from pydantic_settings import BaseSettings
from typing import Literal


class Settings(BaseSettings):
    # Base de datos
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/presupuestador"

    # JWT
    SECRET_KEY: str = "dev-secret-key-cambiar-en-produccion"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    FRONTEND_URL: str = "http://localhost:5173"

    # Entorno
    ENVIRONMENT: Literal["development", "production"] = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
