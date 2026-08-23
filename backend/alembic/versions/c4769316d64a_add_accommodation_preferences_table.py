"""Add accommodation preferences table and enums

Revision ID: c4769316d64a
Revises: d4e2f9a1b7c3
Create Date: 2026-08-15 14:13:56.976361

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c4769316d64a'
down_revision: Union[str, Sequence[str], None] = 'd4e2f9a1b7c3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create accommodation_preferences table and domain enums:
      - accommodationtype
      - roomtype
      - leaseduration
    """

    # -------------------------------------------------------------------------
    # Step 1 — PostgreSQL enum types
    # -------------------------------------------------------------------------

    op.execute(sa.text(
        "CREATE TYPE accommodationtype AS ENUM "
        "('pg', 'flat', 'apartment', 'house', 'co_living', 'other')"
    ))
    op.execute(sa.text(
        "CREATE TYPE roomtype AS ENUM "
        "('private', 'shared')"
    ))
    op.execute(sa.text(
        "CREATE TYPE leaseduration AS ENUM "
        "('1_month', '3_months', '6_months', '12_months', 'flexible')"
    ))

    # -------------------------------------------------------------------------
    # Step 2 — accommodation_preferences table
    # -------------------------------------------------------------------------

    op.create_table(
        "accommodation_preferences",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "accommodation_type",
            postgresql.ENUM(name="accommodationtype", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "room_type",
            postgresql.ENUM(name="roomtype", create_type=False),
            nullable=False,
        ),
        sa.Column("move_in_date", sa.Date(), nullable=False),
        sa.Column(
            "lease_duration",
            postgresql.ENUM(name="leaseduration", create_type=False),
            nullable=False,
        ),
        sa.Column("budget_min", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("budget_max", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            name="fk_accommodation_preferences_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_accommodation_preferences"),
        sa.UniqueConstraint("user_id", name="uq_accommodation_preferences_user_id"),
    )
    op.create_index(
        "ix_accommodation_preferences_user_id",
        "accommodation_preferences",
        ["user_id"],
    )


def downgrade() -> None:
    """
    Drop accommodation_preferences table and associated PostgreSQL enum types.
    """
    op.drop_index(
        "ix_accommodation_preferences_user_id",
        table_name="accommodation_preferences",
    )
    op.drop_table("accommodation_preferences")

    # Drop enum types
    op.execute(sa.text("DROP TYPE IF EXISTS leaseduration"))
    op.execute(sa.text("DROP TYPE IF EXISTS roomtype"))
    op.execute(sa.text("DROP TYPE IF EXISTS accommodationtype"))
