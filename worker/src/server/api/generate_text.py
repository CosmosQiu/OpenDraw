from fastapi import APIRouter

from src.constant.response_code import ResponseCode
from src.module.generate_text_service import GenerateTextService
from src.server.exception_handler import BaseError
from src.server.schema.generate_text_schema import GenerateTextRequestDTO, GenerateTextResponseDTO

router = APIRouter()


@router.post('/generate-text', response_model=GenerateTextResponseDTO)
async def handle_generate_text(request: GenerateTextRequestDTO) -> GenerateTextResponseDTO:
    if not request.prompt:
        raise BaseError(code=ResponseCode.PROMPT_REQUIRED, msg='prompt is required')

    return await GenerateTextService.generate(request)
