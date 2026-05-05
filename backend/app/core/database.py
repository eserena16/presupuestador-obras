from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,        # reconecta si la conexión cayó
    pool_size=10,              # conexiones simultáneas
    max_overflow=20,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency de FastAPI — inyecta la sesión de DB en cada request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
