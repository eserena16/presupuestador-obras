"""
Script de inicialización de datos.
Crea los usuarios por defecto (admin/admin y enzo/enzo).

Uso:
    python seed.py
"""

import sys
import os

# Asegurar que el módulo 'app' sea encontrado
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models import *  # importar todos los modelos para crear tablas

def seed():
    # Crear todas las tablas si no existen
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Verificar si ya existen usuarios
        existing = db.query(User).count()
        if existing > 0:
            print(f"✓ Ya existen {existing} usuarios en la base de datos. Seed omitido.")
            return

        users = [
            User(
                name="admin",
                email="admin@stargquitectos.com",
                role=UserRole.admin,
                hashed_password=hash_password("admin"),
                active=True,
            ),
            User(
                name="enzo",
                email="enzo@starquitectos.com",
                role=UserRole.creador,
                hashed_password=hash_password("enzo"),
                active=True,
            ),
        ]

        for u in users:
            db.add(u)

        db.commit()
        print("✓ Usuarios creados:")
        print("  → admin / admin  (rol: admin)")
        print("  → enzo  / enzo   (rol: creador)")

    except Exception as e:
        db.rollback()
        print(f"✗ Error al crear usuarios: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
