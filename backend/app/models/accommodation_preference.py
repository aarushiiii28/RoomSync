from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint, func
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.enums import (
    AccommodationType,
    LeaseDuration,
    MoveInTimeframe,
    RoomType,
)

if TYPE_CHECKING:
    from app.models.user import User


class AccommodationPreference(Base):
    """
    Stores accommodation-specific housing preferences for a user.

    budget_min / budget_max use Numeric(10, 2) for accurate currency representation.
    The UNIQUE constraint on user_id enforces one-to-one cardinality.
    """

    __tablename__ = "accommodation_preferences"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_accommodation_preferences_user_id"),
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

    accommodation_type: Mapped[AccommodationType] = mapped_column(
        SAEnum(AccommodationType, name="accommodationtype", create_type=True),
        nullable=False,
    )

    room_type: Mapped[RoomType] = mapped_column(
        SAEnum(RoomType, name="roomtype", create_type=True),
        nullable=False,
    )

    move_in_timeframe: Mapped[MoveInTimeframe] = mapped_column(
        SAEnum(MoveInTimeframe, name="moveintimeframe", create_type=True),
        nullable=False,
    )

    lease_duration: Mapped[LeaseDuration] = mapped_column(
        SAEnum(
            LeaseDuration,
            name="leaseduration",
            create_type=False,  # type already exists in the DB
            values_callable=lambda x: [e.value for e in x],
        ),
        nullable=False,
    )

    budget_min: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    budget_max: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

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
        back_populates="accommodation_preference",
    )
