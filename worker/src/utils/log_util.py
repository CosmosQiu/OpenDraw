import logging
import sys

from loguru import logger

LOG_FORMAT = (
    '<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | '
    '<level>{level}</level> | <yellow>pid={process}</yellow> | '
    '<cyan>trace_id={extra[trace_id]}</cyan> | '
    '<magenta>user_id={extra[user_id]}</magenta> | '
    '<level>{message}</level>'
)


class InterceptHandler(logging.Handler):
    """桥接标准库 logging 到 loguru。"""

    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno  # type: ignore[assignment]

        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back  # type: ignore[assignment]
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


def setup_logging(level: str = 'INFO') -> None:
    logger.configure(extra={'trace_id': '-', 'user_id': '-'})
    logger.remove()
    logger.add(sys.stderr, format=LOG_FORMAT, level=level, colorize=True)

    intercept_handler = InterceptHandler()
    for name in ('uvicorn', 'uvicorn.error', 'uvicorn.access', 'httpx', 'fastapi'):
        target = logging.getLogger(name)
        target.handlers = [intercept_handler]
        target.propagate = False
