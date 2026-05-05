import uuid
from sqlalchemy import Column, String, Float, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class ProjectStatus(str, enum.Enum):
    borrador   = "borrador"
    activo     = "activo"
    pausado    = "pausado"
    finalizado = "finalizado"


class Project(Base):
    __tablename__ = "projects"

    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name            = Column(String(200), nullable=False)
    description     = Column(Text, nullable=True)
    location        = Column(String(200), nullable=True)
    client          = Column(String(200), nullable=True)
    surface_m2      = Column(Float, nullable=False, default=0)
    obra_type       = Column(String(100), nullable=True)
    currency        = Column(String(10), nullable=False, default="USD")
    status          = Column(SAEnum(ProjectStatus), nullable=False, default=ProjectStatus.borrador)

    # Relaciones de usuarios
    owner_id        = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    supervisor_id   = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Versión activa del presupuesto
    active_version_id = Column(UUID(as_uuid=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
