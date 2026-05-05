from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.budget import AuthStatus


class VersionCreate(BaseModel):
    name: str
    description: Optional[str] = None


class VersionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    auth_status: Optional[AuthStatus] = None
    auth_comment: Optional[str] = None


class VersionResponse(BaseModel):
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str]
    auth_status: AuthStatus
    auth_comment: Optional[str]
    authorized_by: Optional[UUID]
    authorized_at: Optional[datetime]
    created_by: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RubroCreate(BaseModel):
    name: str
    color: str = "#3b82f6"
    order: int = 0


class RubroUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    order: Optional[int] = None


class RubroResponse(BaseModel):
    id: UUID
    version_id: UUID
    name: str
    color: str
    order: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetLineCreate(BaseModel):
    description: str
    unit: str
    quantity: float
    unit_price: float
    currency: str = "USD"
    notes: Optional[str] = None
    order: int = 0
    catalog_item_id: Optional[UUID] = None


class BudgetLineUpdate(BaseModel):
    description: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    order: Optional[int] = None


class BudgetLineResponse(BaseModel):
    id: UUID
    rubro_id: UUID
    catalog_item_id: Optional[UUID]
    description: str
    unit: str
    quantity: float
    unit_price: float
    currency: str
    notes: Optional[str]
    order: int
    subtotal: float = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_with_subtotal(cls, obj):
        data = cls.model_validate(obj)
        data.subtotal = obj.quantity * obj.unit_price
        return data
