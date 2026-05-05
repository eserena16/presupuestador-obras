import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base


class CatalogCategory(Base):
    __tablename__ = "catalog_categories"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name       = Column(String(200), nullable=False)
    color      = Column(String(20), nullable=True, default="#3b82f6")
    order      = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class CatalogItem(Base):
    __tablename__ = "catalog_items"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code        = Column(String(50), nullable=False)
    name        = Column(String(300), nullable=False)
    description = Column(String(500), nullable=True)
    unit        = Column(String(20), nullable=False)
    unit_price  = Column(Float, nullable=False, default=0)
    currency    = Column(String(10), nullable=False, default="USD")
    category_id = Column(UUID(as_uuid=True), ForeignKey("catalog_categories.id"), nullable=False, index=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
