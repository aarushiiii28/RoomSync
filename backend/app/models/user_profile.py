from __future__ import annotations

from datetime import date, datetime
from uuid import UUID
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import GenderEnum

if TYPE_CHECKING:
    from app.models.user import User


class UserProfile(Base):
    """
    One-to-one extension of the User record holding personal profile data.

    The UNIQUE constraint on user_id enforces the one-to-one cardinality at
    the database level (not just at the ORM level).
    """

    __tablename__ = "user_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_user_profiles_user_id"),
    )

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )

    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)

    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)

    gender: Mapped[GenderEnum] = mapped_column(
        SAEnum(GenderEnum, name="genderenum", create_type=True),
        nullable=False,
    )

    occupation: Mapped[str] = mapped_column(String(150), nullable=False)

    # Nullable fields
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    roommate_expectations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    profile_photo_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="profile",
    )
