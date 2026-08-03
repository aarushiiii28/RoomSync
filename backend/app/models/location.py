from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import UUID
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User


class Location(Base):
    """
    Stores the current geographic location and search preferences for a user.

    latitude / longitude use Numeric(9, 6) to support GPS-level precision
    (e.g. 12.971599, 77.594566) without floating-point drift.
    search_radius_km is stored as Float to allow fractional values (e.g. 2.5 km).
    """

    __tablename__ = "locations"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_locations_user_id"),
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

    country: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    locality: Mapped[str] = mapped_column(String(200), nullable=False)
    pincode: Mapped[str] = mapped_column(String(20), nullable=False)

    # GPS coordinates — Numeric avoids floating-point rounding issues
    latitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)
    longitude: Mapped[Decimal] = mapped_column(Numeric(9, 6), nullable=False)

    search_radius_km: Mapped[float] = mapped_column(Float, nullable=False)

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
        back_populates="location",
    )
