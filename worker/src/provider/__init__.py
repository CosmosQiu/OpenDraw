from src.provider.base import BaseProvider
from src.provider.doubao import DoubaoProvider
from src.provider.types import GenerateParams, GenerateResult

__all__ = [
    'BaseProvider',
    'GenerateParams',
    'GenerateResult',
    'get_provider',
]

_providers: dict[str, BaseProvider] = {
    'doubao': DoubaoProvider(),
}


def get_provider(name: str) -> BaseProvider:
    provider = _providers.get(name)
    if provider is None:
        raise ValueError(f'Unsupported provider: {name}')
    return provider
