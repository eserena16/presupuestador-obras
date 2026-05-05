import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class Provider(Base):
    __tablename__ = "providers"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(200), nullable=False)
    rut        = Column(String(50), nullable=True)
    phone      = Column(String(50), nullable=True)
    email      = Column(String(255), nullable=True)
    category   = Column(String(100), nullable=True)
    notes      = Column(Text, nullable=True)
    active     = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
