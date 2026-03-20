import uuid

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

_MAX_BODY_LOG = 1024

_TEXT_CONTENT_TYPES = frozenset((
    'application/json',
    'text/plain',
    'text/html',
    'application/xml',
    'text/xml',
    'application/x-www-form-urlencoded',
))


def _is_text_content(content_type: str | None) -> bool:
    if not content_type:
        return False
    media_type = content_type.split(';', 1)[0].strip().lower()
    return media_type in _TEXT_CONTENT_TYPES


def _truncate(text: str) -> str:
    if len(text) > _MAX_BODY_LOG:
        return text[:_MAX_BODY_LOG] + '...(truncated)'
    return text


class TraceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        trace_id = request.headers.get('X-Trace-Id', uuid.uuid4().hex)
        user_id = '-'
        method = request.method
        path = request.url.path
        qs = str(request.url.query)

        with logger.contextualize(trace_id=trace_id, user_id=user_id):
            req_log = f'>>>Request {method} {path}'
            if qs:
                req_log += f'?{qs}'

            req_ct = request.headers.get('content-type')
            if _is_text_content(req_ct):
                body_bytes = await request.body()
                try:
                    body_text = body_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    body_text = f'<binary {len(body_bytes)} bytes>'
                req_log += f' | body={_truncate(body_text)}'
            elif req_ct:
                cl = request.headers.get('content-length', '?')
                req_log += f' | content-type={req_ct} content-length={cl}'

            logger.info(req_log)

            response = await call_next(request)
            response.headers['X-Trace-Id'] = trace_id

            resp_ct = response.headers.get('content-type')
            resp_body_bytes = b''
            async for chunk in response.body_iterator:  # type: ignore[union-attr]
                if isinstance(chunk, str):
                    resp_body_bytes += chunk.encode('utf-8')
                else:
                    resp_body_bytes += chunk

            resp_log = f'<<<Response {method} {path} | status={response.status_code}'
            if _is_text_content(resp_ct):
                try:
                    resp_text = resp_body_bytes.decode('utf-8')
                except UnicodeDecodeError:
                    resp_text = f'<binary {len(resp_body_bytes)} bytes>'
                resp_log += f' | body={_truncate(resp_text)}'
            elif resp_ct:
                resp_log += f' | content-type={resp_ct} content-length={len(resp_body_bytes)}'

            logger.info(resp_log)

            return Response(
                content=resp_body_bytes,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )
