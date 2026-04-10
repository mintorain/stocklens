from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    anthropic_api_key: str
    claude_model: str = "claude-sonnet-4-6"
    claude_daily_token_limit: int = 100000

    database_url: str
    redis_url: str = "redis://localhost:6379"

    environment: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()
