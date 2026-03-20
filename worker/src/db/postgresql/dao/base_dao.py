from sqlalchemy.ext.asyncio import AsyncSession


class BaseDAO:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
