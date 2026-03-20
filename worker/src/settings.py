from typing import List, Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ark_api_key: Optional[str] = None
    image_storage_path: str = './data/images'

    server_host: str = '0.0.0.0'
    server_port: int = 8711
    server_reload: bool = False
    log_level: str = 'INFO'

    cors_origins: List[str] = ['http://localhost:5173', 'http://127.0.0.1:5173']

    # PostgreSQL（预留，暂不启用）
    postgresql_host: str = '127.0.0.1'
    postgresql_port: int = 5432
    postgresql_user: str = 'postgres'
    postgresql_password: str = ''
    postgresql_db: str = 'movie_claw'

    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8')

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(',') if origin.strip()]
        return value


settings = Settings()
