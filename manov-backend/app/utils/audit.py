import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AdminAuditLog


async def log_admin_action(
    session: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    payload: dict | None = None,
    ip_address: str | None = None,
) -> None:
    log = AdminAuditLog(
        userId=user_id,
        action=action,
        entityType=entity_type,
        entityId=entity_id,
        payloadSnapshot=json.dumps(payload) if payload else None,
        ipAddress=ip_address,
    )
    session.add(log)
    await session.commit()
