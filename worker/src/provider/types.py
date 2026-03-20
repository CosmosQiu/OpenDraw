from dataclasses import dataclass
from typing import List, Literal, Optional

DoubaoImageSize = Literal['2K']
DoubaoOutputFormat = Literal['png', 'jpeg', 'webp']
DoubaoResponseFormat = Literal['url']
DoubaoSequentialImageGeneration = Literal['auto', 'disabled']


@dataclass
class GenerateParams:
    modelId: str
    prompt: str
    negativePrompt: Optional[str] = None
    imageUrls: Optional[List[str]] = None
    size: DoubaoImageSize = '2K'
    outputFormat: DoubaoOutputFormat = 'png'
    responseFormat: DoubaoResponseFormat = 'url'
    watermark: Optional[bool] = None
    seed: Optional[int] = None
    guidanceScale: Optional[float] = None
    sequentialImageGeneration: Optional[DoubaoSequentialImageGeneration] = None


@dataclass
class GenerateResult:
    imageUrl: str
    seed: int
