"""
Chat router: REST endpoints + authenticated WebSocket for real-time messaging.

REST:
  GET  /chat/conversations
  POST /chat/conversations
  GET  /chat/conversations/{conversation_id}/messages
  POST /chat/conversations/{conversation_id}/read

WebSocket:
  WS   /chat/ws?token=<access_token>
"""

import json
import logging
import time
from collections import defaultdict, deque
from datetime import datetime, timezone
from typing import Dict, List, Tuple
from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Query,
    WebSocket,
    WebSocketDisconnect,
    status,
)
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies.auth import get_current_user
from app.models.enums import MessageStatus
from app.models.user import User
from app.schemas.chat import (
    ConversationOut,
    CreateConversationRequest,
    MessageOut,
    SendMessageRequest,
)
from app.services.chat import (
    find_or_create_conversation,
    get_conversation,
    get_messages,
    list_conversations,
    mark_conversation_read,
    promote_to_delivered,
    save_message,
)
from app.services.matching import is_authorized_match

logger = logging.getLogger("roomsync.chat")

router = APIRouter(prefix="/chat", tags=["Chat"])


# ── WebSocket Connection Manager ───────────────────────────────────────────────

# NOTE: In-memory connection tracking only works with a single backend
# worker process. If this app is ever deployed with multiple workers/
# instances, messages between users connected to different workers will
# NOT be delivered in real time. This would require a pub/sub layer
# (e.g. Redis) to fix — intentionally not implemented yet, as this app
# currently runs single-worker. Revisit before scaling deployment.

# Rate limiting: (user_id) → list of (timestamp,) for last N sends
_RATE_LIMIT_MAX = 30        # max messages
_RATE_LIMIT_WINDOW = 60.0   # per seconds


class ConnectionManager:
    """
    Tracks active WebSocket connections, keyed by user UUID.
    One connection per user (opening a new one silently closes the old one).
    """

    def __init__(self) -> None:
        self._connections: Dict[UUID, WebSocket] = {}
        self._rate_buckets: Dict[UUID, deque] = defaultdict(deque)

    async def connect(self, user_id: UUID, websocket: WebSocket) -> None:
        # Close existing connection for this user if any
        if user_id in self._connections:
            try:
                await self._connections[user_id].close(code=1001)
            except Exception:
                pass
        await websocket.accept()
        self._connections[user_id] = websocket
        logger.info("WS connected: user %s", user_id)

    def disconnect(self, user_id: UUID) -> None:
        self._connections.pop(user_id, None)
        logger.info("WS disconnected: user %s", user_id)

    def is_connected(self, user_id: UUID) -> bool:
        return user_id in self._connections

    async def send_json(self, user_id: UUID, payload: dict) -> bool:
        """Send a JSON frame to a specific user. Returns True if delivered."""
        ws = self._connections.get(user_id)
        if not ws:
            return False
        try:
            await ws.send_text(json.dumps(payload))
            return True
        except Exception as exc:
            logger.warning("WS send failed for user %s: %s", user_id, exc)
            self.disconnect(user_id)
            return False

    def check_rate_limit(self, user_id: UUID) -> bool:
        """
        Sliding-window rate limit: max _RATE_LIMIT_MAX messages per _RATE_LIMIT_WINDOW seconds.
        Returns True if the action is allowed, False if the user is over limit.
        """
        now = time.monotonic()
        bucket = self._rate_buckets[user_id]
        # Evict timestamps outside the window
        while bucket and now - bucket[0] > _RATE_LIMIT_WINDOW:
            bucket.popleft()
        if len(bucket) >= _RATE_LIMIT_MAX:
            return False
        bucket.append(now)
        return True


manager = ConnectionManager()


# ── WebSocket Endpoint ─────────────────────────────────────────────────────────

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="Access token for authentication"),
    db: Session = Depends(get_db),
) -> None:
    """
    Authenticated WebSocket connection. Token is passed as ?token=<access_token>.

    Client sends JSON frames: {"type": "message", "conversation_id": "...", "content": "..."}
    Server sends JSON frames: {"type": "message"|"status_update"|"error", "payload": {...}}
    """
    # ── Authenticate ───────────────────────────────────────────────────────────
    current_user: User | None = None
    try:
        # Reuse the same two-step token verification as REST endpoints
        from app.services.cognito import verify_cognito_token
        from app.services.security import decode_access_token, decode_token
        from sqlalchemy import func as sqlfunc, or_ as sqlor_
        from uuid import UUID as _UUID

        payload = None
        try:
            payload = verify_cognito_token(token)
        except Exception:
            try:
                payload = decode_access_token(token)
            except Exception:
                payload = decode_token(token)

        if not payload:
            await websocket.close(code=4001, reason="Invalid token")
            return

        sub = payload.get("sub")
        if not sub:
            await websocket.close(code=4001, reason="Invalid token")
            return

        # Try UUID lookup first (local JWT)
        try:
            user_uuid = _UUID(str(sub))
            current_user = (
                db.query(User)
                .filter(User.id == user_uuid, User.is_active.is_(True))
                .first()
            )
        except (ValueError, TypeError):
            pass

        # Fall back to cognito_sub or username
        if not current_user:
            username = payload.get("username") or payload.get("cognito:username")
            current_user = (
                db.query(User)
                .filter(
                    User.is_active.is_(True),
                    sqlor_(
                        User.cognito_sub == str(sub),
                        sqlfunc.lower(User.username) == (username.lower() if username else ""),
                    ),
                )
                .first()
            )

        if not current_user:
            await websocket.close(code=4001, reason="User not found")
            return

    except Exception as exc:
        logger.warning("WS auth failed: %s", exc)
        await websocket.close(code=4001, reason="Authentication failed")
        return

    # ── Connect ────────────────────────────────────────────────────────────────
    await manager.connect(current_user.id, websocket)

    # Promote any pending 'sent' messages addressed to this user → 'delivered'
    # (They went unread while the user was offline; fetching history will also do this)
    try:
        from app.models.chat import Conversation, Message as ChatMessage
        from sqlalchemy import or_
        pending = (
            db.query(ChatMessage)
            .join(Conversation, ChatMessage.conversation_id == Conversation.id)
            .filter(
                or_(
                    Conversation.user_a_id == current_user.id,
                    Conversation.user_b_id == current_user.id,
                ),
                ChatMessage.sender_id != current_user.id,
                ChatMessage.status == MessageStatus.sent,
            )
            .all()
        )
        now = datetime.now(timezone.utc)
        for msg in pending:
            msg.status = MessageStatus.delivered
            msg.delivered_at = now
        if pending:
            db.commit()
            logger.info(
                "Promoted %d pending messages to 'delivered' for user %s",
                len(pending),
                current_user.id,
            )
    except Exception as exc:
        logger.warning("Failed to promote pending messages on connect: %s", exc)

    # ── Message loop ───────────────────────────────────────────────────────────
    try:
        while True:
            raw = await websocket.receive_text()

            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                await manager.send_json(
                    current_user.id, {"type": "error", "payload": {"detail": "Invalid JSON"}}
                )
                continue

            msg_type = data.get("type")

            if msg_type == "message":
                # ── Rate limit check ───────────────────────────────────────────
                if not manager.check_rate_limit(current_user.id):
                    await manager.send_json(
                        current_user.id,
                        {
                            "type": "error",
                            "payload": {
                                "detail": "Rate limit exceeded. Please slow down.",
                                "code": "rate_limited",
                            },
                        },
                    )
                    continue

                conversation_id_str = data.get("conversation_id")
                content = (data.get("content") or "").strip()
                client_id = data.get("client_id")

                if not conversation_id_str or not content:
                    await manager.send_json(
                        current_user.id,
                        {"type": "error", "payload": {"detail": "Missing conversation_id or content"}},
                    )
                    continue

                if len(content) > 2000:
                    await manager.send_json(
                        current_user.id,
                        {"type": "error", "payload": {"detail": "Message too long (max 2000 chars)"}},
                    )
                    continue

                try:
                    conv_id = UUID(conversation_id_str)
                except ValueError:
                    await manager.send_json(
                        current_user.id,
                        {"type": "error", "payload": {"detail": "Invalid conversation_id"}},
                    )
                    continue

                # Verify participant
                conv = get_conversation(db, conv_id, current_user.id)
                if not conv:
                    await manager.send_json(
                        current_user.id,
                        {"type": "error", "payload": {"detail": "Conversation not found or access denied"}},
                    )
                    continue

                # Authorization check for new messages (§2 edge case):
                # Existing conversations stay readable but block new messages
                # if the pair is no longer mutually authorized.
                other_user_id = (
                    conv.user_b_id if conv.user_a_id == current_user.id else conv.user_a_id
                )
                other_user = db.query(User).filter(User.id == other_user_id).first()
                if not other_user or not is_authorized_match(current_user, other_user):
                    await manager.send_json(
                        current_user.id,
                        {
                            "type": "error",
                            "payload": {
                                "detail": "You are no longer matched with this user. New messages cannot be sent.",
                                "code": "unauthorized_match",
                            },
                        },
                    )
                    continue

                # ── Persist message ────────────────────────────────────────────
                parsed_client_id = None
                if client_id:
                    try:
                        parsed_client_id = UUID(client_id)
                    except ValueError:
                        pass
                
                saved = save_message(
                    db=db,
                    conversation_id=conv_id,
                    sender_id=current_user.id,
                    content=content,
                    initial_status=MessageStatus.sent,
                    client_id=parsed_client_id,
                )

                msg_payload = {
                    "id": str(saved.id),
                    "conversation_id": str(saved.conversation_id),
                    "sender_id": str(saved.sender_id),
                    "content": saved.content,
                    "status": saved.status.value,
                    "created_at": saved.created_at.isoformat(),
                    "delivered_at": None,
                    "read_at": None,
                }
                if client_id:
                    msg_payload["client_id"] = client_id

                # Echo back to sender with 'sent' status
                await manager.send_json(
                    current_user.id, {"type": "message", "payload": msg_payload}
                )

                # Push to recipient if connected
                delivered = await manager.send_json(
                    other_user_id, {"type": "message", "payload": msg_payload}
                )
                if delivered:
                    promote_to_delivered(db, saved.id)
                    msg_payload["status"] = MessageStatus.delivered.value
                    # Notify sender of delivery upgrade
                    await manager.send_json(
                        current_user.id,
                        {
                            "type": "status_update",
                            "payload": {
                                "message_id": str(saved.id),
                                "status": MessageStatus.delivered.value,
                            },
                        },
                    )

            else:
                await manager.send_json(
                    current_user.id,
                    {"type": "error", "payload": {"detail": f"Unknown message type: {msg_type}"}},
                )

    except WebSocketDisconnect:
        manager.disconnect(current_user.id)


# ── REST Endpoints ─────────────────────────────────────────────────────────────

@router.get("/conversations", response_model=list[ConversationOut])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all conversations for the authenticated user, newest first."""
    return list_conversations(db, current_user)


@router.post("/conversations", response_model=ConversationOut, status_code=status.HTTP_201_CREATED)
def create_conversation(
    body: CreateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Find or create a 1:1 conversation with candidate_id.
    Enforces is_authorized_match before creating a new conversation.
    """
    if body.candidate_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot start a conversation with yourself.",
        )

    candidate = db.query(User).filter(User.id == body.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    try:
        conv = find_or_create_conversation(db, current_user, candidate)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc))

    # Build response
    other_user = candidate
    from app.services.chat import _build_other_user_info
    from app.schemas.chat import MessagePreview
    last_msg = (
        db.query(__import__("app.models.chat", fromlist=["Message"]).Message)
        .filter(__import__("app.models.chat", fromlist=["Message"]).Message.conversation_id == conv.id)
        .order_by(__import__("app.models.chat", fromlist=["Message"]).Message.created_at.desc())
        .first()
    )
    return ConversationOut(
        id=conv.id,
        other_user=_build_other_user_info(other_user),
        last_message=(
            MessagePreview(
                content=last_msg.content,
                sender_id=last_msg.sender_id,
                created_at=last_msg.created_at,
                status=last_msg.status,
            )
            if last_msg else None
        ),
        unread_count=0,
        created_at=conv.created_at,
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_conversation_messages(
    conversation_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Paginated message history for a conversation.
    Participant check enforced — non-participants get 403.
    Also promotes any 'sent' messages addressed to current user → 'delivered'.
    """
    conv = get_conversation(db, conversation_id, current_user.id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conversation not found or access denied.",
        )
    return get_messages(db, conversation_id, current_user.id, page, page_size)


@router.post("/conversations/{conversation_id}/read", status_code=status.HTTP_200_OK)
def read_conversation(
    conversation_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark all unread messages in this conversation as 'read' for the current user.
    Also notifies the sender via WebSocket if they are connected.
    """
    conv = get_conversation(db, conversation_id, current_user.id)
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conversation not found or access denied.",
        )

    updated = mark_conversation_read(db, conversation_id, current_user.id)

    if updated > 0:
        # Notify the sender that their messages were read
        other_user_id = (
            conv.user_b_id if conv.user_a_id == current_user.id else conv.user_a_id
        )
        import asyncio

        async def _notify():
            await manager.send_json(
                other_user_id,
                {
                    "type": "status_update",
                    "payload": {
                        "conversation_id": str(conversation_id),
                        "event": "read",
                        "reader_id": str(current_user.id),
                    },
                },
            )

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(_notify())
        except Exception:
            pass  # Best-effort WS notification

    return {"updated": updated}
