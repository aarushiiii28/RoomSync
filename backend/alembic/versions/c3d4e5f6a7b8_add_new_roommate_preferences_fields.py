"""Add new compatibility and deal-breaker columns to roommate_preferences

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-15 18:36:50.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c3d4e5f6a7b8'
down_revision: Union[str, Sequence[str], None] = 'b2c3d4e5f6a7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

social_style_enum = postgresql.ENUM(
    'very_private',
    'somewhat_private',
    'balanced',
    'very_social',
    name='socialstyle',
)

personal_space_enum = postgresql.ENUM(
    'a_lot',
    'moderate',
    'comfortable_sharing',
    name='personalspacepreference',
)

communication_style_enum = postgresql.ENUM(
    'mostly_independent',
    'occasional_checkins',
    'open_communication',
    'very_communicative',
    name='communicationstyle',
)

household_responsibility_enum = postgresql.ENUM(
    'mostly_separate',
    'flexible',
    'shared_equally',
    'clearly_divided',
    name='householdresponsibilitypreference',
)


def upgrade() -> None:
    # 1. Create enum types in PostgreSQL
    social_style_enum.create(op.get_bind(), checkfirst=True)
    personal_space_enum.create(op.get_bind(), checkfirst=True)
    communication_style_enum.create(op.get_bind(), checkfirst=True)
    household_responsibility_enum.create(op.get_bind(), checkfirst=True)

    # 2. Add new columns with safe defaults
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'social_style',
            sa.Enum(
                'very_private',
                'somewhat_private',
                'balanced',
                'very_social',
                name='socialstyle',
            ),
            nullable=False,
            server_default='balanced',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'personal_space',
            sa.Enum(
                'a_lot',
                'moderate',
                'comfortable_sharing',
                name='personalspacepreference',
            ),
            nullable=False,
            server_default='moderate',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'communication_style',
            sa.Enum(
                'mostly_independent',
                'occasional_checkins',
                'open_communication',
                'very_communicative',
                name='communicationstyle',
            ),
            nullable=False,
            server_default='open_communication',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'issue_handling_importance',
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
        'roommate_preferences',
        sa.Column(
            'household_responsibilities',
            sa.Enum(
                'mostly_separate',
                'flexible',
                'shared_equally',
                'clearly_divided',
                name='householdresponsibilitypreference',
            ),
            nullable=False,
            server_default='shared_equally',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'financial_responsibility',
            sa.Enum(
                'not_important',
                'slightly_important',
                'important',
                'very_important',
                name='importancelevel',
            ),
            nullable=False,
            server_default='very_important',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'deal_breakers',
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default='{}',
        ),
    )
    op.add_column(
        'roommate_preferences',
        sa.Column(
            'deal_breaker_other',
            sa.String(length=255),
            nullable=True,
        ),
    )


def downgrade() -> None:
    # 1. Drop columns
    op.drop_column('roommate_preferences', 'deal_breaker_other')
    op.drop_column('roommate_preferences', 'deal_breakers')
    op.drop_column('roommate_preferences', 'financial_responsibility')
    op.drop_column('roommate_preferences', 'household_responsibilities')
    op.drop_column('roommate_preferences', 'issue_handling_importance')
    op.drop_column('roommate_preferences', 'communication_style')
    op.drop_column('roommate_preferences', 'personal_space')
    op.drop_column('roommate_preferences', 'social_style')

    # 2. Drop enum types
    household_responsibility_enum.drop(op.get_bind(), checkfirst=True)
    communication_style_enum.drop(op.get_bind(), checkfirst=True)
    personal_space_enum.drop(op.get_bind(), checkfirst=True)
    social_style_enum.drop(op.get_bind(), checkfirst=True)
