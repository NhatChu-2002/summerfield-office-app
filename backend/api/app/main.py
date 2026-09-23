from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core import health
from app.core.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    # Interactive docs are for local and staging use only.
    docs = settings.environment != "production"
    app = FastAPI(
        title="Summerfield HQ API",
        version="0.1.0",
        docs_url="/docs" if docs else None,
        redoc_url=None,
        openapi_url="/openapi.json" if docs else None,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.include_router(health.router)
    # Feature routers go here, e.g. app.include_router(inventory.routes.router, prefix="/inventory")
    return app


app = create_app()
