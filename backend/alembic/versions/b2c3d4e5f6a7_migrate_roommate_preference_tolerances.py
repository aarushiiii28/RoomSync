"""Migrate roommate preferences boolean flags to tolerance level enums

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-15 18:28:55.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, Sequence[str], None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add new enum columns with defaults
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'smoking_tolerance',
            sa.Enum(
                'not_comfortable',
                'slightly_comfortable',
                'comfortable',
                'very_comfortable',
                name='tolerancelevel',
            ),
            nullable=False,
            server_default='not_comfortable',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'drinking_tolerance',
            sa.Enum(
                'not_comfortable',
                'slightly_comfortable',
                'comfortable',
                'very_comfortable',
                name='tolerancelevel',
            ),
            nullable=False,
            server_default='comfortable',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'pet_tolerance',
            sa.Enum(
                'not_comfortable',
                'slightly_comfortable',
                'comfortable',
                'very_comfortable',
                name='tolerancelevel',
            ),
            nullable=False,
            server_default='comfortable',
        ),
    )

    # 2. Migrate existing boolean data to tolerancelevel values
    op.execute(
        """
        UPDATE roommate_preferences
        SET smoking_tolerance = CASE WHEN smoking_allowed THEN 'comfortable'::tolerancelevel ELSE 'not_comfortable'::tolerancelevel END,
            drinking_tolerance = CASE WHEN drinking_allowed THEN 'comfortable'::tolerancelevel ELSE 'not_comfortable'::tolerancelevel END,
            pet_tolerance = CASE WHEN pet_friendly THEN 'comfortable'::tolerancelevel ELSE 'not_comfortable'::tolerancelevel END
        """
    )

    # 3. Drop old boolean columns
    op.drop_column('roommate_preferences', 'smoking_allowed')
    op.drop_column('roommate_preferences', 'drinking_allowed')
    op.drop_column('roommate_preferences', 'pet_friendly')


def downgrade() -> None:
    # 1. Add old boolean columns back
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'smoking_allowed',
            sa.Boolean(),
            nullable=False,
            server_default='false',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'drinking_allowed',
            sa.Boolean(),
            nullable=False,
            server_default='false',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'pet_friendly',
            sa.Boolean(),
            nullable=False,
            server_default='false',
        ),
    )

    # 2. Convert tolerancelevel values back to boolean
    op.execute(
        """
        UPDATE roommate_preferences
        SET smoking_allowed = (smoking_tolerance IN ('comfortable', 'very_comfortable')),
            drinking_allowed = (drinking_tolerance IN ('comfortable', 'very_comfortable')),
            pet_friendly = (pet_tolerance IN ('comfortable', 'very_comfortable'))
        """
    )

    # 3. Drop enum columns
    op.drop_column('roommate_preferences', 'pet_tolerance')
    op.drop_column('roommate_preferences', 'drinking_tolerance')
    op.drop_column('roommate_preferences', 'smoking_tolerance')
