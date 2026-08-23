"""Replace move_in_date with move_in_timeframe enum in accommodation_preferences

Revision ID: f6a9b4c2e1d7
Revises: e5f8a2b3c1d9
Create Date: 2026-08-15 17:46:40.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'f6a9b4c2e1d7'
down_revision: Union[str, Sequence[str], None] = 'e5f8a2b3c1d9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Enum definition
move_in_timeframe_enum = postgresql.ENUM(
    'within_1_month',
    'one_to_three_months',
    'three_to_six_months',
    'six_to_twelve_months',
    'not_sure',
    name='moveintimeframe',
)


def upgrade() -> None:
    # 1. Create moveintimeframe enum type in PostgreSQL
    move_in_timeframe_enum.create(op.get_bind(), checkfirst=True)

    # 2. Add move_in_timeframe column with default
    op.add_column(
        'accommodation_preferences',
        sa.Column(
            'move_in_timeframe',
            sa.Enum(
                'within_1_month',
                'one_to_three_months',
                'three_to_six_months',
                'six_to_twelve_months',
                'not_sure',
                name='moveintimeframe',
            ),
            nullable=False,
            server_default='within_1_month',
        ),
    )

    # 3. Drop move_in_date column
    op.drop_column('accommodation_preferences', 'move_in_date')


def downgrade() -> None:
    # 1. Add back move_in_date column
    op.add_column(
        'accommodation_preferences',
        sa.Column(
            'move_in_date',
            sa.Date(),
            nullable=False,
            server_default=sa.text('CURRENT_DATE'),
        ),
    )

    # 2. Drop move_in_timeframe column
    op.drop_column('accommodation_preferences', 'move_in_timeframe')

    # 3. Drop enum type in PostgreSQL
    move_in_timeframe_enum.drop(op.get_bind(), checkfirst=True)
