from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Settings come from HQ_* environment variables (or a local .env file)."""

    model_config = SettingsConfigDict(env_prefix="HQ_", env_file=".env", extra="ignore")

    environment: Literal["development", "staging", "production"] = "development"
    # Only the HQ frontend's own origins may call the API from a browser.
    cors_origins: list[str] = ["http://127.0.0.1:8531", "http://localhost:8531"]


@lru_cache
def get_settings() -> Settings:
    return Settings()
