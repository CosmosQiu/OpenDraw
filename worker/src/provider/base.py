from abc import ABC, abstractmethod

from src.provider.types import GenerateParams, GenerateResult


class BaseProvider(ABC):
    name: str

    @abstractmethod
    async def generate(self, params: GenerateParams) -> GenerateResult: ...
