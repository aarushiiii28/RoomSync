"""
Pydantic schemas for the Chat feature (conversations + messages).
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import MessageStatus


# ── Outbound ──────────────────────────────────────────────────────────────────

class OtherUserInfo(BaseModel):
    """Minimal public info about the other participant in a conversation."""

    id: UUID
    username: str
    display_name: Optional[str] = None
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


class MessagePreview(BaseModel):
    """Last-message summary shown in the conversation list."""

    content: str
    sender_id: UUID
    created_at: datetime
    status: MessageStatus

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: UUID
    other_user: OtherUserInfo
    last_message: Optional[MessagePreview] = None
    unread_count: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: UUID
    conversation_id: UUID
    sender_id: UUID
    content: str
    status: MessageStatus
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Inbound ───────────────────────────────────────────────────────────────────

class CreateConversationRequest(BaseModel):
    candidate_id: UUID


class SendMessageRequest(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)


# ── WebSocket frames ──────────────────────────────────────────────────────────

class WsIncomingMessage(BaseModel):
    """Shape of a JSON frame sent by the client over WebSocket."""

    type: str  # "message"
    conversation_id: UUID
    content: str = Field(..., min_length=1, max_length=2000)


class WsOutgoingMessage(BaseModel):
    """Shape of a JSON frame pushed by the server over WebSocket."""

    type: str  # "message" | "status_update" | "error"
    payload: dict
