from typing import Any, Optional

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.constant.response_code import ResponseCode


class BaseError(Exception):
    def __init__(self, code: int = ResponseCode.INTERNAL_ERROR, msg: str = 'Internal Server Error', data: Any = None):
        self.code = code
        self.msg = msg
        self.data = data
        super().__init__(msg)


def _build_response(code: int, msg: str, data: Optional[Any] = None, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={'code': code, 'data': data, 'msg': msg},
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(BaseError)
    async def handle_base_error(_request: Request, exc: BaseError) -> JSONResponse:
        return _build_response(code=exc.code, msg=exc.msg, data=exc.data)

    @app.exception_handler(ValueError)
    async def handle_value_error(_request: Request, exc: ValueError) -> JSONResponse:
        return _build_response(code=ResponseCode.BAD_REQUEST, msg=str(exc))

    @app.exception_handler(Exception)
    async def handle_generic_error(_request: Request, exc: Exception) -> JSONResponse:
        return _build_response(
            code=ResponseCode.INTERNAL_ERROR,
            msg=str(exc) if str(exc) else 'Internal Server Error',
            status_code=500,
        )
