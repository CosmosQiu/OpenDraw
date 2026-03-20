from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine

from src.settings import settings

engine: AsyncEngine | None = None
async_session_factory: async_sessionmaker | None = None  # type: ignore[type-arg]


async def init_db() -> None:
    global engine, async_session_factory

    dsn = (
        f'postgresql+asyncpg://{settings.postgresql_user}:{settings.postgresql_password}'
        f'@{settings.postgresql_host}:{settings.postgresql_port}/{settings.postgresql_db}'
    )
    engine = create_async_engine(dsn, echo=False, pool_size=10, max_overflow=20)
    async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def close_db() -> None:
    global engine
    if engine is not None:
        await engine.dispose()
        engine = None
