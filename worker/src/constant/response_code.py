class ResponseCode:
    SUCCESS: int = 0
    BAD_REQUEST: int = 400
    UNAUTHORIZED: int = 401
    FORBIDDEN: int = 403
    NOT_FOUND: int = 404
    INTERNAL_ERROR: int = 500

    PROVIDER_ERROR: int = 1001
    PROVIDER_NOT_FOUND: int = 1002
    IMAGE_NOT_FOUND: int = 2001
    IMAGE_INVALID: int = 2002
    GENERATION_FAILED: int = 3001
    PROMPT_REQUIRED: int = 3002
