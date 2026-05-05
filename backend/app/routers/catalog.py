from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models.user import User
from app.models.catalog import CatalogCategory, CatalogItem
from app.schemas.catalog import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CatalogItemCreate, CatalogItemUpdate, CatalogItemResponse,
)
from app.dependencies.auth import get_current_user, require_admin

router = APIRouter(prefix="/catalog", tags=["Catálogo"])


# ─── Categorías ───────────────────────────────────────────────────────────────

@router.get("/categories", response_model=List[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(CatalogCategory).order_by(CatalogCategory.order, CatalogCategory.name).all()


@router.post("/categories", response_model=CategoryResponse, status_code=201)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = CatalogCategory(**body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: UUID,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = db.query(CatalogCategory).filter(CatalogCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{category_id}", status_code=204)
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    cat = db.query(CatalogCategory).filter(CatalogCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    db.delete(cat)
    db.commit()


# ─── Items ────────────────────────────────────────────────────────────────────

@router.get("/items", response_model=List[CatalogItemResponse])
def list_items(
    category_id: UUID | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(CatalogItem)
    if category_id:
        q = q.filter(CatalogItem.category_id == category_id)
    return q.order_by(CatalogItem.code, CatalogItem.name).all()


@router.post("/items", response_model=CatalogItemResponse, status_code=201)
def create_item(
    body: CatalogItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    # Verificar que la categoría existe
    cat = db.query(CatalogCategory).filter(CatalogCategory.id == body.category_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada.")
    item = CatalogItem(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=CatalogItemResponse)
def update_item(
    item_id: UUID,
    body: CatalogItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = db.query(CatalogItem).filter(CatalogItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    item = db.query(CatalogItem).filter(CatalogItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado.")
    db.delete(item)
    db.commit()
