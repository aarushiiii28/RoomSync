"""remove_budget_from_roommate_preferences

Revision ID: 4af69e130148
Revises: 198cb74c4fe0
Create Date: 2026-09-01 13:21:18.206300

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4af69e130148'
down_revision: Union[str, Sequence[str], None] = '198cb74c4fe0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Use bind to check if columns exist to prevent failing on local DB where they were manually dropped
    conn = op.get_bind()
    from sqlalchemy import inspect
    inspector = inspect(conn)
    columns = [c['name'] for c in inspector.get_columns('roommate_preferences')]
    
    if 'budget_min' in columns:
        op.drop_column('roommate_preferences', 'budget_min')
    if 'budget_max' in columns:
        op.drop_column('roommate_preferences', 'budget_max')


def downgrade() -> None:
    op.add_column('roommate_preferences', sa.Column('budget_min', sa.Numeric(precision=10, scale=2), nullable=True))
    op.add_column('roommate_preferences', sa.Column('budget_max', sa.Numeric(precision=10, scale=2), nullable=True))
