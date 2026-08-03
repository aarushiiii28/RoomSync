"""Add user profile, location, lifestyle profile, and roommate preference tables

Revision ID: d4e2f9a1b7c3
Revises: c3a1e8f92d05
Create Date: 2026-08-03 22:38:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd4e2f9a1b7c3'
down_revision: Union[str, Sequence[str], None] = 'c3a1e8f92d05'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Create all Phase 2 tables:
      - user_profiles
      - locations
      - lifestyle_profiles
      - roommate_preferences

    Strategy:
      1. CREATE all PostgreSQL enum types upfront (explicit, predictable names).
      2. CREATE tables referencing those types with create_type=False.
      3. Indexes on user_id FK columns are added explicitly after table creation.
         The UNIQUE constraints already create implicit indexes, but we add
         explicit named indexes for clarity and query-plan visibility.
    """

    # -------------------------------------------------------------------------
    # Step 1 — PostgreSQL enum types
    # -------------------------------------------------------------------------

    op.execute(sa.text(
        "CREATE TYPE genderenum AS ENUM "
        "('male', 'female', 'non_binary', 'prefer_not_to_say')"
    ))
    op.execute(sa.text(
        "CREATE TYPE genderpreference AS ENUM "
        "('male', 'female', 'non_binary', 'any')"
    ))
    op.execute(sa.text(
        "CREATE TYPE cleanlinesslevel AS ENUM "
        "('very_clean', 'clean', 'moderate', 'relaxed')"
    ))
    op.execute(sa.text(
        "CREATE TYPE smokinghabit AS ENUM "
        "('never', 'occasionally', 'regularly')"
    ))
    op.execute(sa.text(
        "CREATE TYPE drinkinghabit AS ENUM "
        "('never', 'occasionally', 'regularly')"
    ))
    op.execute(sa.text(
        "CREATE TYPE petownership AS ENUM "
        "('has_pets', 'no_pets')"
    ))
    op.execute(sa.text(
        "CREATE TYPE frequencylevel AS ENUM "
        "('never', 'rarely', 'sometimes', 'often', 'always')"
    ))
    op.execute(sa.text(
        "CREATE TYPE fitnesslevel AS ENUM "
        "('never', 'rarely', 'sometimes', 'often', 'daily')"
    ))
    op.execute(sa.text(
        "CREATE TYPE sleepschedule AS ENUM "
        "('early_bird', 'night_owl', 'flexible')"
    ))

    # -------------------------------------------------------------------------
    # Step 2a — user_profiles
    # -------------------------------------------------------------------------

    op.create_table(
        "user_profiles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("date_of_birth", sa.Date(), nullable=False),
        sa.Column(
            "gender",
            postgresql.ENUM(name="genderenum", create_type=False),
            nullable=False,
        ),
        sa.Column("occupation", sa.String(length=150), nullable=False),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("profile_photo_url", sa.Text(), nullable=True),
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
            name="fk_user_profiles_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_user_profiles"),
        sa.UniqueConstraint("user_id", name="uq_user_profiles_user_id"),
    )
    op.create_index("ix_user_profiles_user_id", "user_profiles", ["user_id"])

    # -------------------------------------------------------------------------
    # Step 2b — locations
    # -------------------------------------------------------------------------

    op.create_table(
        "locations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("country", sa.String(length=100), nullable=False),
        sa.Column("state", sa.String(length=100), nullable=False),
        sa.Column("city", sa.String(length=100), nullable=False),
        sa.Column("locality", sa.String(length=200), nullable=False),
        sa.Column("pincode", sa.String(length=20), nullable=False),
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("longitude", sa.Numeric(precision=9, scale=6), nullable=False),
        sa.Column("search_radius_km", sa.Float(), nullable=False),
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
            name="fk_locations_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_locations"),
        sa.UniqueConstraint("user_id", name="uq_locations_user_id"),
    )
    op.create_index("ix_locations_user_id", "locations", ["user_id"])

    # -------------------------------------------------------------------------
    # Step 2c — lifestyle_profiles
    # -------------------------------------------------------------------------

    op.create_table(
        "lifestyle_profiles",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sleep_time", sa.Time(), nullable=False),
        sa.Column("wake_time", sa.Time(), nullable=False),
        sa.Column(
            "cleanliness",
            postgresql.ENUM(name="cleanlinesslevel", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "smoking",
            postgresql.ENUM(name="smokinghabit", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "drinking",
            postgresql.ENUM(name="drinkinghabit", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "pets",
            postgresql.ENUM(name="petownership", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "guest_frequency",
            postgresql.ENUM(name="frequencylevel", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "cooking",
            postgresql.ENUM(name="frequencylevel", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "music",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "party_frequency",
            postgresql.ENUM(name="frequencylevel", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "fitness",
            postgresql.ENUM(name="fitnesslevel", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "work_from_home",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
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
            name="fk_lifestyle_profiles_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_lifestyle_profiles"),
        sa.UniqueConstraint("user_id", name="uq_lifestyle_profiles_user_id"),
    )
    op.create_index("ix_lifestyle_profiles_user_id", "lifestyle_profiles", ["user_id"])

    # -------------------------------------------------------------------------
    # Step 2d — roommate_preferences
    # -------------------------------------------------------------------------

    op.create_table(
        "roommate_preferences",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "preferred_gender",
            postgresql.ENUM(name="genderpreference", create_type=False),
            nullable=False,
        ),
        sa.Column("min_age", sa.Integer(), nullable=False),
        sa.Column("max_age", sa.Integer(), nullable=False),
        sa.Column("budget_min", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("budget_max", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "smoking_allowed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "drinking_allowed",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "pet_friendly",
            sa.Boolean(),
            server_default=sa.text("false"),
            nullable=False,
        ),
        sa.Column(
            "cleanliness_requirement",
            postgresql.ENUM(name="cleanlinesslevel", create_type=False),
            nullable=False,
        ),
        sa.Column(
            "preferred_sleep_schedule",
            postgresql.ENUM(name="sleepschedule", create_type=False),
            nullable=False,
        ),
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
            name="fk_roommate_preferences_user_id",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name="pk_roommate_preferences"),
        sa.UniqueConstraint("user_id", name="uq_roommate_preferences_user_id"),
    )
    op.create_index("ix_roommate_preferences_user_id", "roommate_preferences", ["user_id"])


def downgrade() -> None:
    """
    Drop all Phase 2 tables and their associated PostgreSQL enum types.

    Tables are dropped in reverse creation order to respect FK dependencies.
    Enum types are dropped after all tables are gone so there are no
    remaining column references at the time of DROP TYPE.
    """

    # Drop indexes first (implicit from UniqueConstraints, but explicit ones need explicit drop)
    op.drop_index("ix_roommate_preferences_user_id", table_name="roommate_preferences")
    op.drop_table("roommate_preferences")

    op.drop_index("ix_lifestyle_profiles_user_id", table_name="lifestyle_profiles")
    op.drop_table("lifestyle_profiles")

    op.drop_index("ix_locations_user_id", table_name="locations")
    op.drop_table("locations")

    op.drop_index("ix_user_profiles_user_id", table_name="user_profiles")
    op.drop_table("user_profiles")

    # Drop PostgreSQL enum types (safe order — least-shared first)
    op.execute(sa.text("DROP TYPE IF EXISTS sleepschedule"))
    op.execute(sa.text("DROP TYPE IF EXISTS fitnesslevel"))
    op.execute(sa.text("DROP TYPE IF EXISTS frequencylevel"))
    op.execute(sa.text("DROP TYPE IF EXISTS petownership"))
    op.execute(sa.text("DROP TYPE IF EXISTS drinkinghabit"))
    op.execute(sa.text("DROP TYPE IF EXISTS smokinghabit"))
    op.execute(sa.text("DROP TYPE IF EXISTS cleanlinesslevel"))
    op.execute(sa.text("DROP TYPE IF EXISTS genderpreference"))
    op.execute(sa.text("DROP TYPE IF EXISTS genderenum"))
