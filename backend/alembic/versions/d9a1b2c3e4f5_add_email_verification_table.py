"""add email verification table and email_verified column

Revision ID: d9a1b2c3e4f5
Revises: bc2e7e6ae7be
Create Date: 2026-08-25 17:06:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "d9a1b2c3e4f5"
down_revision: Union[str, None] = "bc2e7e6ae7be"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Ensure users table has email_verified column
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]

    if "email_verified" not in columns:
        if "is_email_verified" in columns:
            op.alter_column(
                "users",
                "is_email_verified",
                new_column_name="email_verified",
                existing_type=sa.Boolean(),
                nullable=False,
                server_default=sa.text("false"),
            )
        else:
            op.add_column(
                "users",
                sa.Column(
                    "email_verified",
                    sa.Boolean(),
                    nullable=False,
                    server_default=sa.text("false"),
                ),
            )

    # 2. Create email_verifications table
    tables = inspector.get_table_names()
    if "email_verifications" not in tables:
        op.create_table(
            "email_verifications",
            sa.Column(
                "id",
                postgresql.UUID(as_uuid=True),
                primary_key=True,
                server_default=sa.text("gen_random_uuid()"),
                nullable=False,
            ),
            sa.Column(
                "user_id",
                postgresql.UUID(as_uuid=True),
                sa.ForeignKey("users.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("otp_hash", sa.Text(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column(
                "attempts",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
            sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column(
                "created_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
            sa.Column(
                "last_sent_at",
                sa.DateTime(timezone=True),
                nullable=False,
                server_default=sa.text("now()"),
            ),
        )
        op.create_index(
            "ix_email_verifications_user_id",
            "email_verifications",
            ["user_id"],
            unique=False,
        )


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "email_verifications" in tables:
        op.drop_index("ix_email_verifications_user_id", table_name="email_verifications")
        op.drop_table("email_verifications")

    columns = [c["name"] for c in inspector.get_columns("users")]
    if "email_verified" in columns:
        op.alter_column(
            "users",
            "email_verified",
            new_column_name="is_email_verified",
            existing_type=sa.Boolean(),
            nullable=False,
            server_default=sa.text("false"),
        )
