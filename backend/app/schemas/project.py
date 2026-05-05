from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.project import ProjectStatus


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    client: Optional[str] = None
    surface_m2: float = 0
    obra_type: Optional[str] = None
    currency: str = "USD"
    status: ProjectStatus = ProjectStatus.borrador
    supervisor_id: Optional[UUID] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    client: Optional[str] = None
    surface_m2: Optional[float] = None
    obra_type: Optional[str] = None
    currency: Optional[str] = None
    status: Optional[ProjectStatus] = None
    supervisor_id: Optional[UUID] = None
    active_version_id: Optional[UUID] = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    location: Optional[str]
    client: Optional[str]
    surface_m2: float
    obra_type: Optional[str]
    currency: str
    status: ProjectStatus
    owner_id: UUID
    supervisor_id: Optional[UUID]
    active_version_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
