"""
Chat models: Conversation and Message.

Conversation — one row per user pair (enforced unique + check constraint).
Message      — individual messages within a conversation.
"""

from datetime import datetime
from typing import TYPE_CHECKING, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Index,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import MessageStatus

if TYPE_CHECKING:
    from app.models.user import User


class Conversation(Base):
    """
    Represents a 1-to-1 chat between two users.

    Convention: user_a_id < user_b_id (as UUID strings) — enforced by a DB
    CHECK constraint so there is always exactly one canonical row per pair
    regardless of who initiated the conversation.
    """

    __tablename__ = "conversations"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=func.gen_random_uuid(),
    )

    user_a_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    user_b_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    user_a: Mapped["User"] = relationship(
        "User", foreign_keys=[user_a_id], lazy="select"
    )
    user_b: Mapped["User"] = relationship(
        "User", foreign_keys=[user_b_id], lazy="select"
    )
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )

    __table_args__ = (
        # Exactly one row per ordered pair — prevents duplicate conversations
        UniqueConstraint("user_a_id", "user_b_id", name="uq_conversation_user_pair"),
        # Enforce the canonical ordering (a < b) at DB level
        CheckConstraint(
            "user_a_id < user_b_id",
            name="ck_conversation_ordered_users",
        ),
    )


class Message(Base):
    """
    A single chat message within a Conversation.

    Status flow:
      sent → delivered (when pushed to recipient's active WebSocket)
           → read      (when recipient opens / views the conversation thread)
    """

    __tablename__ = "messages"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=func.gen_random_uuid(),
    )

    conversation_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("conversations.id", ondelete="CASCADE"),
        nullable=False,
    )

    sender_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Plain text (including emoji — UTF-8 code points, no special handling needed)
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    client_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        unique=True,
    )

    status: Mapped[MessageStatus] = mapped_column(
        SAEnum(MessageStatus, name="messagestatus", create_type=True),
        nullable=False,
        default=MessageStatus.sent,
        server_default="sent",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # ── Relationships ──────────────────────────────────────────────────────────
    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages"
    )
    sender: Mapped["User"] = relationship(
        "User", foreign_keys=[sender_id], lazy="select"
    )

    __table_args__ = (
        # Primary query pattern: fetch paginated messages for a conversation
        Index(
            "ix_messages_conversation_created",
            "conversation_id",
            "created_at",
        ),
    )
