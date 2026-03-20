import httpx

from src.provider.base import BaseProvider
from src.provider.types import GenerateParams, GenerateResult
from src.settings import settings
from src.utils.image_util import resolve_images


class DoubaoProvider(BaseProvider):
    name: str = 'doubao'

    async def generate(self, params: GenerateParams) -> GenerateResult:
        api_key = settings.ark_api_key
        if not api_key:
            raise ValueError('ARK_API_KEY is not configured')

        image_urls = params.imageUrls or []
        content = [{'type': 'text', 'text': params.prompt}]

        if image_urls:
            resolved = await resolve_images(image_urls)
            content.extend(
                {'type': 'image_url', 'image_url': {'url': image_url}}
                for image_url in resolved
            )

        payload: dict = {
            'model': params.modelId or 'doubao-seedream-5-0-260128',
            'prompt': params.prompt,
            'size': params.size,
            'output_format': params.outputFormat,
            'response_format': params.responseFormat,
            'watermark': params.watermark if params.watermark is not None else False,
        }

        if params.seed is not None:
            payload['seed'] = params.seed
        if params.sequentialImageGeneration:
            payload['sequential_image_generation'] = params.sequentialImageGeneration
        if image_urls:
            payload['content'] = content

        async with httpx.AsyncClient() as client:
            response = await client.post(
                'https://ark.cn-beijing.volces.com/api/v3/images/generations',
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {api_key}',
                },
                json=payload,
                timeout=120.0,
            )

            if response.status_code != 200:
                raise ValueError(f'Doubao error {response.status_code}: {response.text}')

            data = response.json()
            image_data = data.get('data') or []
            if not image_data:
                raise ValueError('Doubao returned empty image data')

            first_image = image_data[0]
            image_url = first_image.get('url') or first_image.get('b64_json')
            if not image_url:
                raise ValueError('Doubao returned no image url')
            if first_image.get('b64_json'):
                image_url = f"data:image/{params.outputFormat};base64,{first_image['b64_json']}"

            return GenerateResult(
                imageUrl=image_url,
                seed=first_image.get('seed', params.seed or 0),
            )
