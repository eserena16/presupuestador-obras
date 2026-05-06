from pydantic import BaseModel, field_validator
from typing import Optional, List
from uuid import UUID
from datetime import datetime


class ObraTypeRubro(BaseModel):
    name: str
    color: str = "#3b82f6"


class ObraTypeConfigCreate(BaseModel):
    key: str
    label: str
    description: Optional[str] = None
    active: bool = True
    order: int = 0
    rubros: List[ObraTypeRubro] = []

    @field_validator("key")
    @classmethod
    def key_uppercase(cls, v: str) -> str:
        return v.strip().upper().replace(" ", "_")


class ObraTypeConfigUpdate(BaseModel):
    label: Optional[str] = None
    description: Optional[str] = None
    active: Optional[bool] = None
    order: Optional[int] = None
    rubros: Optional[List[ObraTypeRubro]] = None


class ObraTypeConfigResponse(BaseModel):
    id: UUID
    key: str
    label: str
    description: Optional[str]
    active: bool
    order: int
    rubros: List[ObraTypeRubro]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
