
from pydantic_settings import BaseSettings
from pydantic import field_validator, AnyHttpUrl
from functools import lru_cache
from typing import Optional, List, Union

class Settings(BaseSettings):
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Happy Schools API"
    CORS_ORIGINS: Union[List[str], str] = [
        "https://schoolmanager.id.vn", 
        "http://schoolmanager.id.vn", 
        "https://api.schoolmanager.id.vn",
        "http://localhost:3000"
    ]
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-it"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
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
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    class Config:
        env_file = ".env"
        extra = "ignore" # Ignore extra fields in .env

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.strip().startswith("["):
            return [i.strip() for i in v.split(",")]
        return v

@lru_cache()
def get_settings():
    return Settings()
