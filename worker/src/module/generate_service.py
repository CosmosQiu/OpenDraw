import uuid

from src.module.images_service import ImagesService
from src.provider import GenerateParams, get_provider
from src.server.schema.generate_schema import GenerateRequestDTO, GenerateResponseDTO
from src.utils.image_util import data_url_to_bytes


class GenerateService:
    @staticmethod
    async def generate(request: GenerateRequestDTO) -> GenerateResponseDTO:
        model_str = request.model or 'doubao:doubao-seedream-5-0-260128'
        parts = model_str.split(':')
        provider_name = parts[0] if len(parts) > 0 else 'doubao'
        model_id = parts[1] if len(parts) > 1 else 'doubao-seedream-5-0-260128'

        provider = get_provider(provider_name)
        params = GenerateParams(
            modelId=model_id,
            prompt=request.prompt,
            negativePrompt=request.negativePrompt,
            imageUrls=request.imageUrls,
            size=request.size or '2K',
            outputFormat=request.outputFormat or 'png',
            responseFormat=request.responseFormat or 'url',
            watermark=request.watermark,
            seed=request.seed,
            guidanceScale=request.guidanceScale,
            sequentialImageGeneration=request.sequentialImageGeneration,
        )

        result = await provider.generate(params)

        if result.imageUrl and result.imageUrl.startswith('data:'):
            image_id = f'gen_{uuid.uuid4().hex[:8]}'
            image_bytes = data_url_to_bytes(result.imageUrl)
            await ImagesService.save_image(image_id, image_bytes)
            result.imageUrl = f'/api/images/{image_id}'

        return GenerateResponseDTO(imageUrl=result.imageUrl, seed=result.seed)
