from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: UserRole = UserRole.creador
    active: bool = True


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None
    active: Optional[bool] = None


class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: UserRole
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
