from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime, date


class ExpenseCreate(BaseModel):
    rubro_id: Optional[UUID] = None
    rubro_name: Optional[str] = None
    date: date
    description: str
    category: str
    amount: float
    currency: str = "USD"
    provider_id: Optional[UUID] = None
    provider_name: Optional[str] = None
    invoice_ref: Optional[str] = None
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    date: Optional[date] = None
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    provider_id: Optional[UUID] = None
    provider_name: Optional[str] = None
    invoice_ref: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: UUID
    project_id: UUID
    version_id: UUID
    rubro_id: Optional[UUID]
    rubro_name: Optional[str]
    date: datetime
    description: str
    category: str
    amount: float
    currency: str
    provider_id: Optional[UUID]
    provider_name: Optional[str]
    invoice_ref: Optional[str]
    registered_by: UUID
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
