from fastapi import APIRouter

from src.constant.response_code import ResponseCode
from src.module.generate_service import GenerateService
from src.server.exception_handler import BaseError
from src.server.schema.generate_schema import GenerateRequestDTO, GenerateResponseDTO

router = APIRouter()


@router.post('/generate', response_model=GenerateResponseDTO)
async def handle_generate(request: GenerateRequestDTO) -> GenerateResponseDTO:
    if not request.prompt:
        raise BaseError(code=ResponseCode.PROMPT_REQUIRED, msg='prompt is required')

    return await GenerateService.generate(request)
