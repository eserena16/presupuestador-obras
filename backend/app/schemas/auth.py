from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class LoginRequest(BaseModel):
    username: str       # acepta email o nombre de usuario
    password: str


class UserInToken(BaseModel):
    id: UUID
    name: str
    email: str
    role: str
    active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Optional[UserInToken] = None


class RefreshRequest(BaseModel):
    refresh_token: str
