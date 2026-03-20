import uvicorn

from src.settings import settings


def main() -> None:
    uvicorn.run(
        'src.server.app:app',
        host=settings.server_host,
        port=settings.server_port,
        reload=settings.server_reload,
    )


if __name__ == '__main__':
    main()
