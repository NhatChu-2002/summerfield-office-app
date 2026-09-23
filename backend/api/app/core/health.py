from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness check used by the host. It must stay fast and must not touch the database."""
    return {"status": "ok"}
