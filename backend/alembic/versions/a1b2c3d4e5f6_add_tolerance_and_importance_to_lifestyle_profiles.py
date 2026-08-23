"""Add tolerance and importance columns to lifestyle_profiles

Revision ID: a1b2c3d4e5f6
Revises: f6a9b4c2e1d7
Create Date: 2026-08-15 18:08:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f6a9b4c2e1d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

importance_enum = postgresql.ENUM(
    'not_important',
    'slightly_important',
    'important',
    'very_important',
    name='importancelevel',
)

tolerance_enum = postgresql.ENUM(
    'not_comfortable',
    'slightly_comfortable',
    'comfortable',
    'very_comfortable',
    name='tolerancelevel',
)


def upgrade() -> None:
    # 1. Create enum types in PostgreSQL
    importance_enum.create(op.get_bind(), checkfirst=True)
    tolerance_enum.create(op.get_bind(), checkfirst=True)

    # 2. Add columns with safe defaults
    op.add_column(
        'lifestyle_profiles',
        sa.Column(
            'cleanliness_importance',
            sa.Enum(
                'not_important',
                'slightly_important',
                'important',
                'very_important',
                name='importancelevel',
            ),
            nullable=False,
            server_default='important',
        ),
    )
    op.add_column(
        'lifestyle_profiles',
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
        'lifestyle_profiles',
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
        'lifestyle_profiles',
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
    op.add_column(
        'lifestyle_profiles',
        sa.Column(
            'guest_tolerance',
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
        'lifestyle_profiles',
        sa.Column(
            'cooking_tolerance',
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
        'lifestyle_profiles',
        sa.Column(
            'party_tolerance',
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


def downgrade() -> None:
    # 1. Drop columns
    op.drop_column('lifestyle_profiles', 'party_tolerance')
    op.drop_column('lifestyle_profiles', 'cooking_tolerance')
    op.drop_column('lifestyle_profiles', 'guest_tolerance')
    op.drop_column('lifestyle_profiles', 'pet_tolerance')
    op.drop_column('lifestyle_profiles', 'drinking_tolerance')
    op.drop_column('lifestyle_profiles', 'smoking_tolerance')
    op.drop_column('lifestyle_profiles', 'cleanliness_importance')

    # 2. Drop enum types
    tolerance_enum.drop(op.get_bind(), checkfirst=True)
    importance_enum.drop(op.get_bind(), checkfirst=True)
