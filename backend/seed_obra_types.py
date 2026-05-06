"""
seed_obra_types.py — Pobla la tabla obra_type_configs con los tipos de obra
y sus rubros base. Solo inserta si la tabla está vacía.
"""
import sys
import os

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.obra_type_config import ObraTypeConfig

RUBRO_COLORS = [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
    "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#14b8a6",
    "#6366f1", "#d97706", "#dc2626", "#7c3aed", "#0891b2",
]


def rubros(names: list[str]) -> list[dict]:
    return [
        {"name": n, "color": RUBRO_COLORS[i % len(RUBRO_COLORS)]}
        for i, n in enumerate(names)
    ]


OBRA_TYPES = [
    {
        "key": "VIVIENDA_UNIFAMILIAR",
        "label": "Vivienda Unifamiliar",
        "description": "Casa o vivienda de una sola unidad habitacional.",
        "order": 1,
        "rubros": rubros([
            "Movimiento de tierras y demoliciones",
            "Fundaciones",
            "Estructura de hormigón",
            "Mampostería",
            "Cubiertas e impermeabilizaciones",
            "Revoques y enlucidos",
            "Revestimientos y pisos",
            "Carpintería de madera",
            "Carpintería metálica y herrería",
            "Instalación sanitaria",
            "Instalación eléctrica",
            "Pintura",
        ]),
    },
    {
        "key": "EDIFICIO_MULTIFAMILIAR",
        "label": "Edificio Multifamiliar",
        "description": "Edificio con múltiples unidades habitacionales.",
        "order": 2,
        "rubros": rubros([
            "Movimiento de tierras y excavaciones",
            "Fundaciones y pilotes",
            "Estructura de hormigón armado",
            "Mampostería y tabiquería",
            "Cubiertas e impermeabilizaciones",
            "Revoques y revestimientos",
            "Pisos y contrapisos",
            "Carpintería de madera",
            "Carpintería metálica y herrería",
            "Instalación sanitaria y pluvial",
            "Instalación eléctrica y baja tensión",
            "Ascensor e instalaciones especiales",
            "Pintura y terminaciones",
            "Espacios comunes y exteriores",
        ]),
    },
    {
        "key": "INDUSTRIAL",
        "label": "Industrial",
        "description": "Nave industrial, galpón o planta de producción.",
        "order": 3,
        "rubros": rubros([
            "Movimiento de tierras y preparación del terreno",
            "Fundaciones y losas industriales",
            "Estructura metálica principal",
            "Cubierta y cerramiento",
            "Pisos industriales",
            "Instalación eléctrica",
            "Instalación sanitaria y pluvial",
            "Instalaciones especiales",
            "Equipamiento industrial",
            "Accesos y exteriores",
            "Pintura anticorrosiva y terminaciones",
        ]),
    },
    {
        "key": "COMERCIAL",
        "label": "Comercial",
        "description": "Local comercial, centro comercial o retail.",
        "order": 4,
        "rubros": rubros([
            "Demoliciones y preparación",
            "Fundaciones y estructura",
            "Cerramientos y fachada",
            "Cubiertas",
            "Revestimientos y pisos",
            "Carpintería y vidrios",
            "Instalación eléctrica e iluminación",
            "Instalación sanitaria",
            "Climatización (HVAC)",
            "Señalética y equipamiento",
            "Pintura y terminaciones",
        ]),
    },
    {
        "key": "EDUCACIONAL",
        "label": "Educacional",
        "description": "Escuela, colegio, universidad u otros centros educativos.",
        "order": 5,
        "rubros": rubros([
            "Movimiento de tierras",
            "Fundaciones",
            "Estructura",
            "Mampostería",
            "Cubiertas",
            "Revoques y revestimientos",
            "Pisos",
            "Carpintería",
            "Instalación sanitaria",
            "Instalación eléctrica",
            "Climatización y ventilación",
            "Mobiliario y equipamiento escolar",
            "Pintura",
            "Espacios exteriores y patio",
        ]),
    },
    {
        "key": "SALUD",
        "label": "Salud",
        "description": "Hospital, clínica, centro médico o policlínica.",
        "order": 6,
        "rubros": rubros([
            "Demoliciones y acondicionamiento",
            "Fundaciones y estructura",
            "Mampostería y tabiquería especial",
            "Cubiertas e impermeabilizaciones",
            "Revestimientos cerámicos sanitarios",
            "Pisos vinílicos y especiales",
            "Carpintería y puertas corta-fuego",
            "Instalación sanitaria y gases medicinales",
            "Instalación eléctrica y UPS",
            "Climatización y flujos laminares",
            "Equipamiento médico-hospitalario",
            "Pintura epoxi y terminaciones",
        ]),
    },
    {
        "key": "OFICINAS",
        "label": "Oficinas",
        "description": "Espacio de trabajo corporativo o coworking.",
        "order": 7,
        "rubros": rubros([
            "Acondicionamiento y demoliciones",
            "Estructura y refuerzos",
            "Tabiquería seca (drywall)",
            "Cielorrasos",
            "Pisos flotantes y alfombras",
            "Carpintería y vidrios",
            "Instalación eléctrica y telecomunicaciones",
            "Instalación sanitaria",
            "Climatización (VRF/fan coil)",
            "Iluminación LED",
            "Mobiliario y equipamiento",
            "Pintura y terminaciones",
        ]),
    },
    {
        "key": "OTRO",
        "label": "Otro",
        "description": "Tipo de obra no clasificado en las categorías anteriores.",
        "order": 99,
        "rubros": rubros([
            "Movimiento de tierras",
            "Fundaciones",
            "Estructura",
            "Cerramientos",
            "Cubiertas",
            "Revestimientos y pisos",
            "Carpintería",
            "Instalación sanitaria",
            "Instalación eléctrica",
            "Instalaciones especiales",
            "Pintura y terminaciones",
        ]),
    },
]


def seed():
    db = SessionLocal()
    try:
        count = db.query(ObraTypeConfig).count()
        if count > 0:
            print(f"  Tipos de obra: ya existen {count} registros, omitiendo seed.")
            return

        for data in OBRA_TYPES:
            db.add(ObraTypeConfig(**data))
        db.commit()
        print(f"  Tipos de obra: {len(OBRA_TYPES)} tipos insertados correctamente.")
    except Exception as e:
        db.rollback()
        print(f"  ERROR en seed_obra_types: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
