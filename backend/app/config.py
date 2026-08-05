
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from functools import lru_cache
from typing import Literal, Optional, List, Union

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "SchoolManager API"
    CORS_ORIGINS: Union[List[str], str] = [
        "https://schoolmanager.id.vn", 
        "http://schoolmanager.id.vn", 
        "https://api.schoolmanager.id.vn",
        "http://localhost:3000"
    ]
    
    # Security
    ENVIRONMENT: Literal["development", "test", "production"] = "development"
    SECRET_KEY: str = Field(min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    FRONTEND_URL: str = "http://localhost:3000"
    TRUSTED_PROXY_HOSTS: Union[List[str], str] = ["127.0.0.1", "::1"]
    
    # Email (SMTP)
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@happyschools.vn"

    # Database
    DATABASE_URL: Optional[str] = None
    DATABASE_URL_SYNC: Optional[str] = "sqlite:///./sql_app.db"
    
    # NOTE: external AI provider configuration was removed since
    # ChatGPT/Gemini APIs are no longer used.  Keep dataset-based logic only.

    # Redis
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    @field_validator("CORS_ORIGINS", "TRUSTED_PROXY_HOSTS", mode="before")
    @classmethod
    def parse_list_setting(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.strip().startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

    @field_validator("SECRET_KEY")
    @classmethod
    def reject_placeholder_secret(cls, value: str) -> str:
        normalized = value.strip().lower()
        placeholder_markers = ("change-this", "change_me", "changeme", "your-secret", "example")
        if any(marker in normalized for marker in placeholder_markers):
            raise ValueError("SECRET_KEY must be a generated secret, not a placeholder")
        return value

@lru_cache()
def get_settings():
    return Settings()
