"""add_ondelete_cascade_to_novelgenrelink

Revision ID: 1e3b78a2ff70
Revises: 5eb90ae43e02
Create Date: 2026-06-07 17:38:58.261422

"""
from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '1e3b78a2ff70'
down_revision: str | Sequence[str] | None = '5eb90ae43e02'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        # Drop existing FKs on novelgenrelink and recreate with ON DELETE CASCADE
        op.drop_constraint("novelgenrelink_genre_id_fkey", "novelgenrelink", type_="foreignkey")
        op.drop_constraint("novelgenrelink_novel_id_fkey", "novelgenrelink", type_="foreignkey")
        op.create_foreign_key(
            None, "novelgenrelink", "genre", ["genre_id"], ["id"], ondelete="CASCADE"
        )
        op.create_foreign_key(
            None, "novelgenrelink", "novel", ["novel_id"], ["id"], ondelete="CASCADE"
        )


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    if conn.dialect.name == "postgresql":
        op.drop_constraint(None, "novelgenrelink", type_="foreignkey")
        op.drop_constraint(None, "novelgenrelink", type_="foreignkey")
        op.create_foreign_key(
            "novelgenrelink_genre_id_fkey",
            "novelgenrelink",
            "genre",
            ["genre_id"],
            ["id"],
        )
        op.create_foreign_key(
            "novelgenrelink_novel_id_fkey",
            "novelgenrelink",
            "novel",
            ["novel_id"],
            ["id"],
        )
