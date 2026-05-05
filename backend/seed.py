# -*- coding: utf-8 -*-
"""
Script de inicializacion de datos.
Crea los usuarios por defecto (admin/admin y enzo/enzo).

Uso:
    python seed.py
"""

import sys
import os

# Forzar UTF-8 en la salida de consola (Windows)
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# Asegurar que el modulo 'app' sea encontrado
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
            print(f"[OK] Ya existen {existing} usuarios en la base de datos. Seed omitido.")
            return

        users = [
            User(
                name="admin",
                email="admin@starquitectos.com",
                role=UserRole.admin,
                password=hash_password("admin"),
                active=True,
            ),
            User(
                name="enzo",
                email="enzo@starquitectos.com",
                role=UserRole.creador,
                password=hash_password("enzo"),
                active=True,
            ),
        ]

        for u in users:
            db.add(u)

        db.commit()
        print("[OK] Usuarios creados:")
        print("  -> admin / admin  (rol: admin)")
        print("  -> enzo  / enzo   (rol: creador)")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] No se pudieron crear usuarios: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
