from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_health_reports_ok():
    client = TestClient(create_app(Settings()))
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_production_hides_api_docs():
    client = TestClient(create_app(Settings(environment="production")))
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404


def test_cors_allows_only_configured_origins():
    client = TestClient(create_app(Settings(cors_origins=["https://hq.example.com"])))
    allowed = client.options("/health", headers={"Origin": "https://hq.example.com", "Access-Control-Request-Method": "GET"})
    blocked = client.options("/health", headers={"Origin": "https://evil.example.com", "Access-Control-Request-Method": "GET"})
    assert allowed.headers.get("access-control-allow-origin") == "https://hq.example.com"
    assert "access-control-allow-origin" not in blocked.headers
