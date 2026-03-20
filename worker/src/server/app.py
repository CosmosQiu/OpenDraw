from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.server.exception_handler import register_exception_handlers
from src.server.lifespan import lifespan
from src.server.middleware.trace_middleware import TraceMiddleware
from src.server.router import api_router
from src.settings import settings
from src.utils.log_util import setup_logging


def create_app() -> FastAPI:
    setup_logging(level=settings.log_level)
    app = FastAPI(
        title="Movie API",
        description="AI",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(TraceMiddleware)

    register_exception_handlers(app)

    app.include_router(api_router)

    @app.get('/')
    async def root() -> dict:
        return {'message': 'Movie Claw is not welcome', 'version': '0.1.0'}

    @app.get('/health')
    async def health() -> dict:
        return {'status': 'ok'}

    return app


app = create_app()
