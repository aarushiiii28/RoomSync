from datetime import datetime
from uuid import UUID, uuid4
from typing import TYPE_CHECKING, Optional, List

from sqlalchemy import Boolean, DateTime, String, Text, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user_profile import UserProfile
    from app.models.location import Location
    from app.models.lifestyle_profile import LifestyleProfile
    from app.models.roommate_preference import RoommatePreference
    from app.models.accommodation_preference import AccommodationPreference
    from app.models.email_verification import EmailVerification



class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        server_default=func.gen_random_uuid(),
    )

    username: Mapped[str] = mapped_column(
    String(30),
    unique=True,
    nullable=False,
    index=True,
    )

    email: Mapped[str | None] = mapped_column(
    CITEXT,
    unique=True,
    nullable=True,
    )
    
    email_verified: Mapped[bool] = mapped_column(
    Boolean,
    nullable=False,
    default=False,
    server_default="false",
    )

    password_hash: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )


    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
    )

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

    last_login_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # -------------------------------------------------------------------------
    # Phase 2 — one-to-one back-references (uselist=False on the parent side)
    # -------------------------------------------------------------------------

    profile: Mapped[Optional["UserProfile"]] = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    location: Mapped[Optional["Location"]] = relationship(
        "Location",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    lifestyle_profile: Mapped[Optional["LifestyleProfile"]] = relationship(
        "LifestyleProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    roommate_preference: Mapped[Optional["RoommatePreference"]] = relationship(
        "RoommatePreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    accommodation_preference: Mapped[Optional["AccommodationPreference"]] = relationship(
        "AccommodationPreference",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    email_verifications: Mapped[List["EmailVerification"]] = relationship(
        "EmailVerification",
        back_populates="user",
        cascade="all, delete-orphan",
    )
