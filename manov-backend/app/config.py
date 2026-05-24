"""Centralized application configuration via Pydantic BaseSettings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str
    SECRET_KEY: str
    DOCS_USERNAME: str = "admin"
    DOCS_PASSWORD: str = "password"
    FRONTEND_URL: str = "https://manov.nathanpasca.com"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week


settings = Settings()
