from src.server.schema.generate_text_schema import GenerateTextRequestDTO, GenerateTextResponseDTO


class GenerateTextService:
    @staticmethod
    async def generate(request: GenerateTextRequestDTO) -> GenerateTextResponseDTO:
        input_str = str(request.input) if request.input is not None else None
        input_desc = '[input provided]' if input_str else '[no input]'

        prompt_truncated = request.prompt[:60] + ('...' if len(request.prompt) > 60 else '')
        return GenerateTextResponseDTO(
            text=f'[Placeholder] Prompt: "{prompt_truncated}" | Input: {input_desc}',
        )
