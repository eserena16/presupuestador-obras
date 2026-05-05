from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import Base, engine
from app.routers import auth, users, projects, providers, budget, catalog, clients, tracking, ai, intendencia

# Crear tablas automáticamente en desarrollo
# En producción usar Alembic migrations
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Presupuestador de Obras — ST Arquitectos",
    description="API para gestión de presupuestos de construcción",
    version="2.0.0",
    docs_url="/api/docs",         # Swagger UI
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — permite al frontend comunicarse con el backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(auth.router,      prefix="/api")
app.include_router(users.router,     prefix="/api")
app.include_router(projects.router,  prefix="/api")
app.include_router(providers.router, prefix="/api")
app.include_router(budget.router,    prefix="/api")
app.include_router(catalog.router,   prefix="/api")
app.include_router(clients.router,   prefix="/api")
app.include_router(tracking.router,  prefix="/api")
app.include_router(ai.router,        prefix="/api")
app.include_router(intendencia.router, prefix="/api")


@app.get("/api/health")
def health_check():
    """Endpoint de health check para Docker / monitoreo."""
    return {"status": "ok", "environment": settings.ENVIRONMENT}
