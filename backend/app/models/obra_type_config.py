import uuid
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.core.database import Base


class ObraTypeConfig(Base):
    __tablename__ = "obra_type_configs"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    key         = Column(String(100), nullable=False, unique=True)   # ej: "VIVIENDA_UNIFAMILIAR"
    label       = Column(String(200), nullable=False)                # ej: "Vivienda Unifamiliar"
    description = Column(Text, nullable=True)
    active      = Column(Boolean, nullable=False, default=True)
    order       = Column(Integer, nullable=False, default=0)
    # Lista de rubros: [{"name": "Fundaciones", "color": "#3b82f6"}, ...]
    rubros      = Column(JSONB, nullable=False, default=list)

    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
