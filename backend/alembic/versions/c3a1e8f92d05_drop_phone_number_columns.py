"""drop phone_number and is_phone_verified from users

Revision ID: c3a1e8f92d05
Revises: f870b79c85bc
Create Date: 2026-07-31 17:06:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3a1e8f92d05'
down_revision: Union[str, Sequence[str], None] = 'a1d4c9e7b2f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove phone_number and is_phone_verified columns from users table."""
    op.drop_constraint('users_phone_number_key', 'users', type_='unique')
    op.drop_column('users', 'phone_number')
    op.drop_column('users', 'is_phone_verified')


def downgrade() -> None:
    """Re-add phone_number and is_phone_verified columns to users table."""
    op.add_column(
        'users',
        sa.Column(
            'is_phone_verified',
            sa.Boolean(),
            server_default=sa.text('false'),
            nullable=False,
        ),
    )
    op.add_column(
        'users',
        sa.Column('phone_number', sa.String(length=20), nullable=True),
    )
    op.create_unique_constraint('users_phone_number_key', 'users', ['phone_number'])
