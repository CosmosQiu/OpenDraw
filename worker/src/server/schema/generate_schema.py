from typing import List, Literal, Optional

from src.server.schema.base_schema import BaseDTO

DoubaoImageSize = Literal['2K']
DoubaoOutputFormat = Literal['png', 'jpeg', 'webp']
DoubaoResponseFormat = Literal['url']
DoubaoSequentialImageGeneration = Literal['auto', 'disabled']


class GenerateRequestDTO(BaseDTO):
    model: Optional[str] = 'doubao:doubao-seedream-5-0-260128'
    prompt: str
    negativePrompt: Optional[str] = None
    imageUrls: Optional[List[str]] = None
    size: Optional[DoubaoImageSize] = '2K'
    outputFormat: Optional[DoubaoOutputFormat] = 'png'
    responseFormat: Optional[DoubaoResponseFormat] = 'url'
    watermark: Optional[bool] = None
    seed: Optional[int] = None
    guidanceScale: Optional[float] = None
    sequentialImageGeneration: Optional[DoubaoSequentialImageGeneration] = None


class GenerateResponseDTO(BaseDTO):
    imageUrl: str
    seed: int
