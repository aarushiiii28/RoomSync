"""Remove search_radius_km column from locations table

Revision ID: e5f8a2b3c1d9
Revises: c4769316d64a
Create Date: 2026-08-15 17:12:30.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5f8a2b3c1d9'
down_revision: Union[str, Sequence[str], None] = 'c4769316d64a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("locations", "search_radius_km")


def downgrade() -> None:
    op.add_column(
        "locations",
        sa.Column(
            "search_radius_km",
            sa.Float(),
            nullable=False,
            server_default="10.0",
        ),
    )
