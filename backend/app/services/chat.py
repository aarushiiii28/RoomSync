"""
Chat service: business logic for conversations and messages.

Handles: find-or-create conversation, list conversations, paginated message
history, mark-as-read, and bulk status promotion (sent → delivered on
reconnect).
"""

import logging
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from sqlalchemy import or_, desc, and_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.chat import Conversation, Message
from app.models.enums import MessageStatus
from app.models.user import User
from app.schemas.chat import ConversationOut, MessageOut, OtherUserInfo, MessagePreview
from app.services.matching import is_authorized_match

logger = logging.getLogger("roomsync.chat")


# ── Helpers ────────────────────────────────────────────────────────────────────

def _ordered_pair(uid_a: UUID, uid_b: UUID) -> tuple[UUID, UUID]:
    """Return (smaller_uuid, larger_uuid) for the canonical DB ordering."""
    return (uid_a, uid_b) if str(uid_a) < str(uid_b) else (uid_b, uid_a)


def _build_other_user_info(user: User) -> OtherUserInfo:
    profile = getattr(user, "profile", None)
    display_name = None
    if profile:
        first = getattr(profile, "first_name", "") or ""
        last = getattr(profile, "last_name", "") or ""
        combined = f"{first} {last}".strip()
        if combined:
            display_name = combined
    photo_url = getattr(profile, "profile_photo_url", None) if profile else None
    return OtherUserInfo(
        id=user.id,
        username=user.username,
        display_name=display_name,
        photo_url=photo_url,
    )


# ── Conversation management ────────────────────────────────────────────────────

def find_or_create_conversation(
    db: Session, requesting_user: User, candidate_user: User
) -> Conversation:
    """
    Find an existing conversation between the two users, or create one.

    Authorization check: is_authorized_match must pass before a *new*
    conversation is created. Existing conversations are always returned
    (history is preserved even if authorization lapses later — see prompt §2).
    """
    a_id, b_id = _ordered_pair(requesting_user.id, candidate_user.id)

    existing = (
        db.query(Conversation)
        .filter(Conversation.user_a_id == a_id, Conversation.user_b_id == b_id)
        .first()
    )
    if existing:
        return existing

    # New conversation — enforce mutual authorization
    if not is_authorized_match(requesting_user, candidate_user):
        raise ValueError("You are not authorized to start a conversation with this user.")
    # Also check the reverse direction (bidirectional deal-breakers)
    if not is_authorized_match(candidate_user, requesting_user):
        raise ValueError("You are not authorized to start a conversation with this user.")

    conv = Conversation(user_a_id=a_id, user_b_id=b_id)
    db.add(conv)
    db.commit()
    db.refresh(conv)
    logger.info("Created conversation %s between %s and %s", conv.id, a_id, b_id)
    return conv


def get_conversation(
    db: Session, conversation_id: UUID, requesting_user_id: UUID
) -> Optional[Conversation]:
    """Return a conversation only if requesting_user is a participant."""
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        return None
    if conv.user_a_id != requesting_user_id and conv.user_b_id != requesting_user_id:
        return None
    return conv


# ── Conversation list ─────────────────────────────────────────────────────────

def list_conversations(db: Session, requesting_user: User) -> List[ConversationOut]:
    """
    Return all conversations for the user, ordered by latest message time desc,
    with last-message preview and unread count.
    """
    uid = requesting_user.id
    conversations = (
        db.query(Conversation)
        .filter(
            or_(
                Conversation.user_a_id == uid,
                Conversation.user_b_id == uid,
            )
        )
        .order_by(Conversation.created_at.desc())
        .all()
    )

    result = []
    for conv in conversations:
        other_user = conv.user_b if conv.user_a_id == uid else conv.user_a

        # Last message
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(Message.created_at.desc())
            .first()
        )

        last_message_preview = (
            MessagePreview(
                content=last_msg.content,
                sender_id=last_msg.sender_id,
                created_at=last_msg.created_at,
                status=last_msg.status,
            )
            if last_msg
            else None
        )

        # Unread count — messages sent by the other user that are not yet read
        unread_count = (
            db.query(Message)
            .filter(
                Message.conversation_id == conv.id,
                Message.sender_id != uid,
                Message.status != MessageStatus.read,
            )
            .count()
        )

        result.append(
            ConversationOut(
                id=conv.id,
                other_user=_build_other_user_info(other_user),
                last_message=last_message_preview,
                unread_count=unread_count,
                created_at=conv.created_at,
            )
        )

    # Sort by last-message time (most recent first); fallback to conv created_at
    result.sort(
        key=lambda c: c.last_message.created_at if c.last_message else c.created_at,
        reverse=True,
    )
    return result


# ── Message history ───────────────────────────────────────────────────────────

def get_messages(
    db: Session,
    conversation_id: UUID,
    requesting_user_id: UUID,
    page: int = 1,
    page_size: int = 50,
) -> List[MessageOut]:
    """
    Return paginated message history for a conversation.
    Participant check is enforced by the caller (router).
    Also promotes any 'sent' messages addressed to requesting_user → 'delivered'.
    """
    offset = (page - 1) * page_size
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    # Promote sent → delivered for messages addressed to this user
    now = datetime.now(timezone.utc)
    updated = False
    for msg in messages:
        if msg.sender_id != requesting_user_id and msg.status == MessageStatus.sent:
            msg.status = MessageStatus.delivered
            msg.delivered_at = now
            updated = True
    if updated:
        db.commit()

    return [
        MessageOut(
            id=m.id,
            conversation_id=m.conversation_id,
            sender_id=m.sender_id,
            content=m.content,
            status=m.status,
            created_at=m.created_at,
            delivered_at=m.delivered_at,
            read_at=m.read_at,
        )
        for m in messages
    ]


# ── Mark as read ──────────────────────────────────────────────────────────────

def mark_conversation_read(
    db: Session, conversation_id: UUID, requesting_user_id: UUID
) -> int:
    """
    Mark all unread messages in this conversation as 'read' for the
    requesting user (i.e. messages they received, not sent).

    Returns the number of messages updated.
    """
    now = datetime.now(timezone.utc)
    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id,
            Message.sender_id != requesting_user_id,
            Message.status != MessageStatus.read,
        )
        .all()
    )
    for msg in messages:
        msg.status = MessageStatus.read
        msg.read_at = now
    db.commit()
    return len(messages)


# ── Message persistence (called from WebSocket handler) ───────────────────────

def save_message(
    db: Session,
    conversation_id: UUID,
    sender_id: UUID,
    content: str,
    initial_status: MessageStatus = MessageStatus.sent,
    client_id: Optional[UUID] = None,
) -> Message:
    """Persist a message to the database. Always succeeds (status = sent). 
    Handles idempotency if client_id is provided and already exists."""
    msg = Message(
        conversation_id=conversation_id,
        sender_id=sender_id,
        content=content,
        status=initial_status,
        client_id=client_id,
    )
    db.add(msg)
    try:
        db.commit()
        db.refresh(msg)
        return msg
    except IntegrityError:
        db.rollback()
        # Fetch the existing message by client_id
        if client_id:
            existing = db.query(Message).filter(Message.client_id == client_id).first()
            if existing:
                return existing
        raise  # Should only happen if some other integrity constraint fails


def promote_to_delivered(db: Session, message_id: UUID) -> None:
    """Set a single message's status to 'delivered' once pushed over WebSocket."""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if msg and msg.status == MessageStatus.sent:
        msg.status = MessageStatus.delivered
        msg.delivered_at = datetime.now(timezone.utc)
        db.commit()
