from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.core.database import get_db
from app.models.user import User
from app.models.provider import Provider
from app.schemas.provider import ProviderCreate, ProviderUpdate, ProviderResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/providers", tags=["Proveedores"])


@router.get("/", response_model=List[ProviderResponse])
def list_providers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Provider).order_by(Provider.name).all()


@router.post("/", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
def create_provider(body: ProviderCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    provider = Provider(**body.model_dump())
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


@router.put("/{provider_id}", response_model=ProviderResponse)
def update_provider(provider_id: UUID, body: ProviderUpdate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)
    db.commit()
    db.refresh(provider)
    return provider


@router.delete("/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_provider(provider_id: UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado.")
    db.delete(provider)
    db.commit()
