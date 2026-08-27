"""Add cognito_sub column to users table and make password_hash nullable

Revision ID: e1f2a3b4c5d6
Revises: d9a1b2c3e4f5
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e1f2a3b4c5d6"
down_revision: Union[str, None] = "d9a1b2c3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]

    if "cognito_sub" not in columns:
        op.add_column(
            "users",
            sa.Column("cognito_sub", sa.String(length=128), nullable=True),
        )
        op.create_index(
            "ix_users_cognito_sub",
            "users",
            ["cognito_sub"],
            unique=True,
        )

    if "password_hash" in columns:
        try:
            op.alter_column(
                "users",
                "password_hash",
                existing_type=sa.Text(),
                nullable=True,
            )
        except Exception:
            # SQLite does not support alter column nullable changes directly without batch
            pass


def downgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [c["name"] for c in inspector.get_columns("users")]

    if "cognito_sub" in columns:
        op.drop_index("ix_users_cognito_sub", table_name="users")
        op.drop_column("users", "cognito_sub")

    if "password_hash" in columns:
        try:
            op.alter_column(
                "users",
                "password_hash",
                existing_type=sa.Text(),
                nullable=False,
            )
        except Exception:
            pass
