"""
Router para configuración de tipos de obra y sus rubros base.
GET    /obra-types/          → lista de tipos (active_only por defecto)
POST   /obra-types/          → crear tipo
GET    /obra-types/{id}      → detalle
PUT    /obra-types/{id}      → actualizar (incluyendo rubros)
DELETE /obra-types/{id}      → eliminar (solo admin)
GET    /obra-types/key/{key} → buscar por clave (usado por AI y BudgetEditor)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.obra_type_config import ObraTypeConfig
from app.models.user import User
from app.schemas.obra_type_config import (
    ObraTypeConfigCreate,
    ObraTypeConfigUpdate,
    ObraTypeConfigResponse,
)

router = APIRouter(prefix="/obra-types", tags=["Tipos de Obra"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_or_404(obra_type_id: UUID, db: Session) -> ObraTypeConfig:
    obj = db.query(ObraTypeConfig).filter(ObraTypeConfig.id == obra_type_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Tipo de obra no encontrado.")
    return obj


def _rubros_to_dict(rubros) -> list:
    """Convierte lista de ObraTypeRubro Pydantic a lista de dicts para JSONB."""
    if rubros is None:
        return []
    return [r.model_dump() for r in rubros]


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ObraTypeConfigResponse])
def list_obra_types(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ObraTypeConfig)
    if active_only:
        q = q.filter(ObraTypeConfig.active == True)  # noqa: E712
    return q.order_by(ObraTypeConfig.order, ObraTypeConfig.label).all()


@router.get("/key/{key}", response_model=ObraTypeConfigResponse)
def get_by_key(
    key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(ObraTypeConfig).filter(
        ObraTypeConfig.key == key.upper()
    ).first()
    if not obj:
        raise HTTPException(status_code=404, detail=f"Tipo de obra '{key}' no encontrado.")
    return obj


@router.post("/", response_model=ObraTypeConfigResponse, status_code=201)
def create_obra_type(
    body: ObraTypeConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(ObraTypeConfig).filter(ObraTypeConfig.key == body.key).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Ya existe un tipo con clave '{body.key}'.")

    obj = ObraTypeConfig(
        key=body.key,
        label=body.label,
        description=body.description,
        active=body.active,
        order=body.order,
        rubros=_rubros_to_dict(body.rubros),
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.get("/{obra_type_id}", response_model=ObraTypeConfigResponse)
def get_obra_type(
    obra_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _get_or_404(obra_type_id, db)


@router.put("/{obra_type_id}", response_model=ObraTypeConfigResponse)
def update_obra_type(
    obra_type_id: UUID,
    body: ObraTypeConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = _get_or_404(obra_type_id, db)

    update_data = body.model_dump(exclude_unset=True)

    # Los rubros se manejan aparte porque requieren conversión
    if "rubros" in update_data:
        obj.rubros = _rubros_to_dict(body.rubros)
        del update_data["rubros"]

    for field, value in update_data.items():
        setattr(obj, field, value)

    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/{obra_type_id}", status_code=204)
def delete_obra_type(
    obra_type_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    obj = _get_or_404(obra_type_id, db)
    db.delete(obj)
    db.commit()
