from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ClientCreate(BaseModel):
    name: str
    rut: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    rut: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class ClientResponse(BaseModel):
    id: UUID
    name: str
    rut: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    notes: Optional[str]
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
