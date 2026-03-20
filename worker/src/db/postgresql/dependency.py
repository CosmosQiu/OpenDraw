from typing import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from src.db.postgresql.lifespan import async_session_factory


async def get_db_session() -> AsyncIterator[AsyncSession]:
    if async_session_factory is None:
        raise RuntimeError('Database not initialized. Call init_db() first.')
    async with async_session_factory() as session:
        yield session
