"""add roommate_expectations to user_profiles

Revision ID: f9a8b7c6d5e4
Revises: e1f2a3b4c5d6
Create Date: 2026-08-26 23:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f9a8b7c6d5e4"
down_revision: Union[str, None] = "e1f2a3b4c5d6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_profiles",
        sa.Column("roommate_expectations", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_profiles", "roommate_expectations")
