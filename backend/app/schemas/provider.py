from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ProviderCreate(BaseModel):
    name: str
    rut: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    active: bool = True


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    rut: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class ProviderResponse(BaseModel):
    id: UUID
    name: str
    rut: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    category: Optional[str]
    notes: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
