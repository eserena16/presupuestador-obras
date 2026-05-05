from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.budget import BudgetVersion, Rubro, BudgetLine, AuthStatus
from app.schemas.budget import (
    VersionCreate, VersionUpdate, VersionResponse,
    RubroCreate, RubroUpdate, RubroResponse,
    BudgetLineCreate, BudgetLineUpdate, BudgetLineResponse,
)
from app.dependencies.auth import get_current_user, require_autorizador
from app.routers.projects import check_project_access

router = APIRouter(prefix="/projects", tags=["Presupuesto"])


# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_project_or_404(project_id: UUID, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    return project


def get_version_or_404(version_id: UUID, db: Session) -> BudgetVersion:
    v = db.query(BudgetVersion).filter(BudgetVersion.id == version_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Versión no encontrada.")
    return v


def get_rubro_or_404(rubro_id: UUID, db: Session) -> Rubro:
    r = db.query(Rubro).filter(Rubro.id == rubro_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Rubro no encontrado.")
    return r


# ─── Versiones ────────────────────────────────────────────────────────────────

@router.get("/{project_id}/versions", response_model=List[VersionResponse])
def list_versions(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    return (
        db.query(BudgetVersion)
        .filter(BudgetVersion.project_id == project_id)
        .order_by(BudgetVersion.created_at.desc())
        .all()
    )


@router.post("/{project_id}/versions", response_model=VersionResponse, status_code=201)
def create_version(
    project_id: UUID,
    body: VersionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    version = BudgetVersion(
        **body.model_dump(),
        project_id=project_id,
        created_by=current_user.id,
    )
    db.add(version)
    db.commit()
    db.refresh(version)
    return version


@router.get("/{project_id}/versions/{version_id}", response_model=VersionResponse)
def get_version(
    project_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    return get_version_or_404(version_id, db)


@router.put("/{project_id}/versions/{version_id}", response_model=VersionResponse)
def update_version(
    project_id: UUID,
    version_id: UUID,
    body: VersionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    version = get_version_or_404(version_id, db)

    # Solo autorizadores y admins pueden aprobar/rechazar
    if body.auth_status and body.auth_status != version.auth_status:
        if current_user.role not in (UserRole.admin, UserRole.autorizador):
            raise HTTPException(status_code=403, detail="Solo autorizadores pueden cambiar el estado.")
        if body.auth_status in (AuthStatus.autorizado, AuthStatus.rechazado):
            from datetime import datetime, timezone
            version.authorized_by = current_user.id
            version.authorized_at = datetime.now(timezone.utc)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(version, field, value)
    db.commit()
    db.refresh(version)
    return version


@router.delete("/{project_id}/versions/{version_id}", status_code=204)
def delete_version(
    project_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    version = get_version_or_404(version_id, db)
    db.delete(version)
    db.commit()


# ─── Rubros ───────────────────────────────────────────────────────────────────

@router.get("/{project_id}/versions/{version_id}/rubros", response_model=List[RubroResponse])
def list_rubros(
    project_id: UUID,
    version_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    return (
        db.query(Rubro)
        .filter(Rubro.version_id == version_id)
        .order_by(Rubro.order, Rubro.name)
        .all()
    )


@router.post("/{project_id}/versions/{version_id}/rubros", response_model=RubroResponse, status_code=201)
def create_rubro(
    project_id: UUID,
    version_id: UUID,
    body: RubroCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    rubro = Rubro(**body.model_dump(), version_id=version_id)
    db.add(rubro)
    db.commit()
    db.refresh(rubro)
    return rubro


@router.put("/{project_id}/versions/{version_id}/rubros/{rubro_id}", response_model=RubroResponse)
def update_rubro(
    project_id: UUID,
    version_id: UUID,
    rubro_id: UUID,
    body: RubroUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    rubro = get_rubro_or_404(rubro_id, db)

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rubro, field, value)
    db.commit()
    db.refresh(rubro)
    return rubro


@router.delete("/{project_id}/versions/{version_id}/rubros/{rubro_id}", status_code=204)
def delete_rubro(
    project_id: UUID,
    version_id: UUID,
    rubro_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    rubro = get_rubro_or_404(rubro_id, db)
    db.delete(rubro)
    db.commit()


# ─── Líneas de presupuesto ────────────────────────────────────────────────────

@router.get(
    "/{project_id}/versions/{version_id}/rubros/{rubro_id}/lines",
    response_model=List[BudgetLineResponse],
)
def list_lines(
    project_id: UUID,
    version_id: UUID,
    rubro_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    lines = (
        db.query(BudgetLine)
        .filter(BudgetLine.rubro_id == rubro_id)
        .order_by(BudgetLine.order, BudgetLine.description)
        .all()
    )
    return [BudgetLineResponse.from_orm_with_subtotal(l) for l in lines]


@router.post(
    "/{project_id}/versions/{version_id}/rubros/{rubro_id}/lines",
    response_model=BudgetLineResponse,
    status_code=201,
)
def create_line(
    project_id: UUID,
    version_id: UUID,
    rubro_id: UUID,
    body: BudgetLineCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    line = BudgetLine(**body.model_dump(), rubro_id=rubro_id)
    db.add(line)
    db.commit()
    db.refresh(line)
    return BudgetLineResponse.from_orm_with_subtotal(line)


@router.put(
    "/{project_id}/versions/{version_id}/rubros/{rubro_id}/lines/{line_id}",
    response_model=BudgetLineResponse,
)
def update_line(
    project_id: UUID,
    version_id: UUID,
    rubro_id: UUID,
    line_id: UUID,
    body: BudgetLineUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    line = db.query(BudgetLine).filter(BudgetLine.id == line_id).first()
    if not line:
        raise HTTPException(status_code=404, detail="Línea no encontrada.")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(line, field, value)
    db.commit()
    db.refresh(line)
    return BudgetLineResponse.from_orm_with_subtotal(line)


@router.delete(
    "/{project_id}/versions/{version_id}/rubros/{rubro_id}/lines/{line_id}",
    status_code=204,
)
def delete_line(
    project_id: UUID,
    version_id: UUID,
    rubro_id: UUID,
    line_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    line = db.query(BudgetLine).filter(BudgetLine.id == line_id).first()
    if not line:
        raise HTTPException(status_code=404, detail="Línea no encontrada.")
    db.delete(line)
    db.commit()
