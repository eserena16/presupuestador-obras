from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.project import Project, ProjectStatus
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Proyectos"])

# ---------------------------------------------------------------------------
# Transiciones de estado permitidas por rol
# ---------------------------------------------------------------------------
STATUS_TRANSITIONS_BY_ROLE: dict = {
    UserRole.creador: {
        ProjectStatus.borrador:    [ProjectStatus.en_revision, ProjectStatus.cancelado],
        ProjectStatus.rechazado:   [ProjectStatus.borrador,    ProjectStatus.cancelado],
    },
    UserRole.autorizador: {
        ProjectStatus.en_revision: [ProjectStatus.autorizado,  ProjectStatus.rechazado, ProjectStatus.cancelado],
        ProjectStatus.autorizado:  [ProjectStatus.completado,  ProjectStatus.cancelado],
        ProjectStatus.cancelado:   [ProjectStatus.borrador],
    },
    UserRole.admin: {
        ProjectStatus.borrador:    [ProjectStatus.en_revision, ProjectStatus.autorizado,  ProjectStatus.cancelado],
        ProjectStatus.en_revision: [ProjectStatus.autorizado,  ProjectStatus.rechazado,   ProjectStatus.cancelado],
        ProjectStatus.autorizado:  [ProjectStatus.completado,  ProjectStatus.cancelado],
        ProjectStatus.rechazado:   [ProjectStatus.borrador,    ProjectStatus.cancelado],
        ProjectStatus.completado:  [],
        ProjectStatus.cancelado:   [ProjectStatus.borrador],
    },
}


def check_project_access(project: Project, user: User):
    """Verifica que el usuario puede acceder al proyecto."""
    if user.role in (UserRole.admin, UserRole.autorizador):
        return  # ven todos los proyectos
    if project.owner_id != user.id and project.supervisor_id != user.id:
        raise HTTPException(status_code=403, detail="Sin acceso a este proyecto.")


@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lista proyectos según el rol del usuario."""
    if current_user.role in (UserRole.admin, UserRole.autorizador):
        return db.query(Project).order_by(Project.created_at.desc()).all()
    return db.query(Project).filter(
        (Project.owner_id == current_user.id) | (Project.supervisor_id == current_user.id)
    ).order_by(Project.created_at.desc()).all()


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(**body.model_dump(), owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    check_project_access(project, current_user)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    body: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    check_project_access(project, current_user)

    # Validar transición de estado si se está cambiando
    update_data = body.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] != project.status:
        new_status = update_data["status"]
        allowed = STATUS_TRANSITIONS_BY_ROLE.get(current_user.role, {}).get(project.status, [])
        if new_status not in allowed:
            role_label = current_user.role.value
            raise HTTPException(
                status_code=403,
                detail=(
                    f"El rol '{role_label}' no puede cambiar el estado "
                    f"de '{project.status.value}' a '{new_status.value}'."
                ),
            )

    for field, value in update_data.items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    check_project_access(project, current_user)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=201)
def duplicate_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Duplica un proyecto con todos sus datos (sin historial de gastos)."""
    original = db.query(Project).filter(Project.id == project_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    check_project_access(original, current_user)

    copy = Project(
        name=f"Copia de {original.name}",
        description=original.description,
        location=original.location,
        client=original.client,
        surface_m2=original.surface_m2,
        obra_type=original.obra_type,
        currency=original.currency,
        status=ProjectStatus.borrador,
        owner_id=current_user.id,
        supervisor_id=original.supervisor_id,
    )
    db.add(copy)
    db.flush()  # obtener el id del nuevo proyecto

    # Copiar versiones de presupuesto con sus rubros y líneas
    from app.models.budget import BudgetVersion, Rubro, BudgetLine
    versions = db.query(BudgetVersion).filter(
        BudgetVersion.project_id == project_id
    ).all()

    for ver in versions:
        new_ver = BudgetVersion(
            project_id=copy.id,
            name=ver.name,
            description=ver.description,
            auth_status="borrador",
            created_by=current_user.id,
        )
        db.add(new_ver)
        db.flush()

        rubros = db.query(Rubro).filter(Rubro.version_id == ver.id).all()
        for rub in rubros:
            new_rub = Rubro(
                version_id=new_ver.id,
                name=rub.name,
                color=rub.color,
                order=rub.order,
            )
            db.add(new_rub)
            db.flush()

            lines = db.query(BudgetLine).filter(BudgetLine.rubro_id == rub.id).all()
            for ln in lines:
                db.add(BudgetLine(
                    rubro_id=new_rub.id,
                    description=ln.description,
                    unit=ln.unit,
                    quantity=ln.quantity,
                    unit_price=ln.unit_price,
                    currency=ln.currency,
                    notes=ln.notes,
                    order=ln.order,
                ))

    db.commit()
    db.refresh(copy)
    return copy
