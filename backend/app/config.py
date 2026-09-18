from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Central app configuration, loaded from environment variables / .env.
    Keep secrets and tunables here instead of scattering them across the app.
    """
    database_url: str = "postgresql://labtriage:labtriage_dev_password@postgres:5432/labtriage"

    jwt_secret_key: str = "change_this_to_a_long_random_string"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "llama3.1"

    cors_origins: str = "http://localhost:5173"

    class Config:
        env_file = ".env"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
