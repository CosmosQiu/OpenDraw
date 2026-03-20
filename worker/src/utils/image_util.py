import base64
from typing import List, Tuple

import httpx


async def resolve_image(url: str) -> Tuple[bytes, str]:
    """将各种形式的图片引用统一解析为 (bytes, data_url)。"""
    if url.startswith('data:'):
        return _resolve_data_url(url)

    if url.startswith('/api/images/'):
        return await _resolve_storage_url(url)

    return await _resolve_remote_url(url)


def _resolve_data_url(url: str) -> Tuple[bytes, str]:
    header, data = url.split(',', 1)
    mime_match = header.split(':')[1].split(';')[0] if ':' in header else 'image/png'
    mime = mime_match if mime_match else 'image/png'

    if 'base64' in header:
        image_bytes = base64.b64decode(data)
        return image_bytes, url

    decoded = base64.b64decode(data)
    b64 = base64.b64encode(decoded).decode('utf-8')
    return decoded, f'data:{mime};base64,{b64}'


async def _resolve_storage_url(url: str) -> Tuple[bytes, str]:
    from src.module.images_service import ImagesService

    image_id = url[len('/api/images/'):]
    image_bytes = await ImagesService.get_image(image_id)
    if image_bytes is None:
        raise ValueError(f'Image not found in storage: {image_id}')
    b64 = base64.b64encode(image_bytes).decode('utf-8')
    return image_bytes, f'data:image/png;base64,{b64}'


async def _resolve_remote_url(url: str) -> Tuple[bytes, str]:
    async with httpx.AsyncClient() as client:
        response = await client.get(url, follow_redirects=True)
        if response.status_code != 200:
            raise ValueError(f'Failed to fetch image: {response.status_code}')
        content = response.content
        mime = response.headers.get('content-type', 'image/png')
        b64 = base64.b64encode(content).decode('utf-8')
        return content, f'data:{mime};base64,{b64}'


async def resolve_images(urls: List[str]) -> List[str]:
    """批量解析图片 URL，返回 data URL 列表。"""
    resolved: List[str] = []
    for url in urls:
        _, data_url = await resolve_image(url)
        resolved.append(data_url)
    return resolved


def data_url_to_bytes(data_url: str) -> bytes:
    """将 data URL 转换为 bytes。"""
    if not data_url.startswith('data:'):
        raise ValueError('Invalid data URL')
    header, data = data_url.split(',', 1)
    if 'base64' not in header:
        raise ValueError('Only base64 data URLs are supported')
    return base64.b64decode(data)
