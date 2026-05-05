from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    color: str = "#3b82f6"
    order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    color: str
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CatalogItemCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    unit: str
    unit_price: float
    currency: str = "USD"
    category_id: UUID


class CatalogItemUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = None
    category_id: Optional[UUID] = None


class CatalogItemResponse(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str]
    unit: str
    unit_price: float
    currency: str
    category_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
