import uuid
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class TrackingExpense(Base):
    __tablename__ = "tracking_expenses"

    id           = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id   = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    version_id   = Column(UUID(as_uuid=True), ForeignKey("budget_versions.id", ondelete="CASCADE"), nullable=False, index=True)
    rubro_id     = Column(UUID(as_uuid=True), ForeignKey("rubros.id"), nullable=True)
    rubro_name   = Column(String(200), nullable=True)
    date         = Column(DateTime(timezone=True), nullable=False)
    description  = Column(String(500), nullable=False)
    category     = Column(String(50), nullable=False)
    amount       = Column(Float, nullable=False)
    currency     = Column(String(10), nullable=False, default="USD")
    provider_id  = Column(UUID(as_uuid=True), ForeignKey("providers.id"), nullable=True)
    provider_name= Column(String(200), nullable=True)
    invoice_ref  = Column(String(100), nullable=True)
    registered_by= Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notes        = Column(Text, nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
