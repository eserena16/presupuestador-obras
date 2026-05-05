from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.models.project import Project
from app.models.tracking import TrackingExpense
from app.schemas.tracking import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.dependencies.auth import get_current_user
from app.routers.projects import check_project_access

router = APIRouter(prefix="/projects", tags=["Seguimiento"])


def get_project_or_404(project_id: UUID, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado.")
    return project


@router.get("/{project_id}/expenses", response_model=List[ExpenseResponse])
def list_expenses(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)
    return (
        db.query(TrackingExpense)
        .filter(TrackingExpense.project_id == project_id)
        .order_by(TrackingExpense.date.desc(), TrackingExpense.created_at.desc())
        .all()
    )


@router.post("/{project_id}/expenses", response_model=ExpenseResponse, status_code=201)
def create_expense(
    project_id: UUID,
    body: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    # Necesitamos active_version_id
    if not project.active_version_id:
        raise HTTPException(
            status_code=400,
            detail="El proyecto no tiene una versión de presupuesto activa.",
        )

    expense = TrackingExpense(
        **body.model_dump(),
        project_id=project_id,
        version_id=project.active_version_id,
        registered_by=current_user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.put("/{project_id}/expenses/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    project_id: UUID,
    expense_id: UUID,
    body: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    expense = db.query(TrackingExpense).filter(
        TrackingExpense.id == expense_id,
        TrackingExpense.project_id == project_id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado.")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@router.delete("/{project_id}/expenses/{expense_id}", status_code=204)
def delete_expense(
    project_id: UUID,
    expense_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    expense = db.query(TrackingExpense).filter(
        TrackingExpense.id == expense_id,
        TrackingExpense.project_id == project_id,
    ).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Gasto no encontrado.")
    db.delete(expense)
    db.commit()


@router.get("/{project_id}/expenses/summary")
def expenses_summary(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Resumen de gastos reales agrupados por rubro para comparación con presupuesto."""
    project = get_project_or_404(project_id, db)
    check_project_access(project, current_user)

    expenses = (
        db.query(TrackingExpense)
        .filter(TrackingExpense.project_id == project_id)
        .all()
    )

    total_spent = sum(e.amount for e in expenses)
    by_category: dict = {}
    for e in expenses:
        key = e.rubro_name or e.category or "Sin categoría"
        by_category[key] = by_category.get(key, 0) + e.amount

    return {
        "project_id": str(project_id),
        "total_spent": total_spent,
        "expense_count": len(expenses),
        "by_category": [
            {"name": k, "amount": v}
            for k, v in sorted(by_category.items(), key=lambda x: -x[1])
        ],
    }
