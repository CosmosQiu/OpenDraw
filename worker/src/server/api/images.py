from fastapi import APIRouter, Request, Response

from src.constant.response_code import ResponseCode
from src.module.images_service import ImagesService
from src.server.exception_handler import BaseError
from src.server.schema.images_schema import UploadResponseDTO

router = APIRouter()

CACHE_CONTROL_IMMUTABLE = 'public, max-age=31536000, immutable'


@router.post('/images/{image_id}', response_model=UploadResponseDTO)
async def handle_image_upload(image_id: str, request: Request) -> UploadResponseDTO:
    content_type = request.headers.get('content-type', 'image/png')
    if not content_type.startswith('image/'):
        raise BaseError(code=ResponseCode.IMAGE_INVALID, msg='Invalid content type')

    if await ImagesService.image_exists(image_id):
        return UploadResponseDTO(ok=True)

    data = await request.body()
    await ImagesService.save_image(image_id, data)
    return UploadResponseDTO(ok=True)


@router.get('/images/{image_id}')
async def handle_image_download(image_id: str) -> Response:
    data = await ImagesService.get_image(image_id)
    if data is None:
        raise BaseError(code=ResponseCode.IMAGE_NOT_FOUND, msg='Image not found')

    return Response(
        content=data,
        media_type='image/png',
        headers={'Cache-Control': CACHE_CONTROL_IMMUTABLE},
    )
