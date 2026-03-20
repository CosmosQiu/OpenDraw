from typing import Optional

from src.server.schema.base_schema import BaseDTO


class GenerateTextRequestDTO(BaseDTO):
    input: Optional[str] = None
    prompt: str


class GenerateTextResponseDTO(BaseDTO):
    text: str
