import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, Enum as SAEnum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base
import enum


class AuthStatus(str, enum.Enum):
    borrador   = "borrador"
    pendiente  = "pendiente"
    autorizado = "autorizado"
    rechazado  = "rechazado"


class BudgetVersion(Base):
    __tablename__ = "budget_versions"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id  = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    auth_status = Column(SAEnum(AuthStatus), nullable=False, default=AuthStatus.borrador)
    auth_comment= Column(Text, nullable=True)
    authorized_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    authorized_at = Column(DateTime(timezone=True), nullable=True)
    created_by  = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Rubro(Base):
    __tablename__ = "rubros"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    version_id  = Column(UUID(as_uuid=True), ForeignKey("budget_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(String(200), nullable=False)
    color       = Column(String(20), nullable=True, default="#3b82f6")
    order       = Column(Integer, nullable=False, default=0)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BudgetLine(Base):
    __tablename__ = "budget_lines"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rubro_id      = Column(UUID(as_uuid=True), ForeignKey("rubros.id", ondelete="CASCADE"), nullable=False, index=True)
    catalog_item_id = Column(UUID(as_uuid=True), ForeignKey("catalog_items.id"), nullable=True)
    description   = Column(String(500), nullable=False)
    unit          = Column(String(20), nullable=False)
    quantity      = Column(Float, nullable=False, default=0)
    unit_price    = Column(Float, nullable=False, default=0)
    currency      = Column(String(10), nullable=False, default="USD")
    notes         = Column(Text, nullable=True)
    order         = Column(Integer, nullable=False, default=0)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
