import os
import time
from typing import Optional

import aiofiles
import aiofiles.os

from src.settings import settings

_image_cache: dict[str, tuple[bytes, float]] = {}
CACHE_MAX_AGE = 31536000  # 1 year


class ImagesService:
    @staticmethod
    async def get_image_path(image_id: str) -> Optional[str]:
        storage_path = settings.image_storage_path
        if not storage_path:
            return None
        image_path = os.path.join(storage_path, image_id)
        if os.path.exists(image_path):
            return image_path
        return None

    @staticmethod
    async def get_image(image_id: str) -> Optional[bytes]:
        cached = _get_from_cache(image_id)
        if cached is not None:
            return cached

        image_path = await ImagesService.get_image_path(image_id)
        if image_path is None:
            return None

        async with aiofiles.open(image_path, 'rb') as f:
            data = await f.read()

        _set_cache(image_id, data)
        return data

    @staticmethod
    async def save_image(image_id: str, data: bytes) -> bool:
        storage_path = settings.image_storage_path
        if not storage_path:
            return False

        os.makedirs(storage_path, exist_ok=True)
        image_path = os.path.join(storage_path, image_id)

        async with aiofiles.open(image_path, 'wb') as f:
            await f.write(data)

        _set_cache(image_id, data)
        return True

    @staticmethod
    async def image_exists(image_id: str) -> bool:
        return await ImagesService.get_image_path(image_id) is not None


def _cache_key(image_id: str) -> str:
    return f'image:{image_id}'


def _get_from_cache(image_id: str) -> Optional[bytes]:
    key = _cache_key(image_id)
    cached = _image_cache.get(key)
    if cached:
        data, timestamp = cached
        if time.time() - timestamp < CACHE_MAX_AGE:
            return data
        del _image_cache[key]
    return None


def _set_cache(image_id: str, data: bytes) -> None:
    _image_cache[_cache_key(image_id)] = (data, time.time())
