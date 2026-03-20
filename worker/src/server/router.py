from fastapi import APIRouter

from src.server.api.generate import router as generate_router
from src.server.api.generate_text import router as generate_text_router
from src.server.api.images import router as images_router

api_router = APIRouter(prefix='/api')

api_router.include_router(generate_router, tags=['generate'])
api_router.include_router(generate_text_router, tags=['generate-text'])
api_router.include_router(images_router, tags=['images'])
