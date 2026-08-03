"""enable refresh token rotation

Revision ID: a1d4c9e7b2f6
Revises: f870b79c85bc
Create Date: 2026-07-31 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1d4c9e7b2f6"
down_revision: Union[str, Sequence[str], None] = "f870b79c85bc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Allow token history per session and index revocation queries."""
    op.drop_index(op.f("ix_refresh_tokens_session_id"), table_name="refresh_tokens")
    op.create_index(
        op.f("ix_refresh_tokens_session_id"),
        "refresh_tokens",
        ["session_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_refresh_tokens_token_hash"),
        "refresh_tokens",
        ["token_hash"],
        unique=True,
    )
    op.create_index(
        op.f("ix_refresh_tokens_user_id"),
        "refresh_tokens",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    """Restore the previous single-record-per-session constraint."""
    op.drop_index(op.f("ix_refresh_tokens_user_id"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_token_hash"), table_name="refresh_tokens")
    op.drop_index(op.f("ix_refresh_tokens_session_id"), table_name="refresh_tokens")
    op.create_index(
        op.f("ix_refresh_tokens_session_id"),
        "refresh_tokens",
        ["session_id"],
        unique=True,
    )
