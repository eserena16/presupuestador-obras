"""
seed_catalog.py — Pobla el catálogo de ítems de construcción con precios en USD.
Ejecutar con:  python seed_catalog.py
"""
import sys
import os

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import SessionLocal
from app.models.catalog import CatalogCategory, CatalogItem

# ---------------------------------------------------------------------------
# Datos del catálogo
# ---------------------------------------------------------------------------
CATALOG: list[dict] = [
    {
        "name": "Movimiento de Tierras",
        "color": "#92400e",
        "order": 1,
        "items": [
            ("MT-001", "Excavacion manual",                    "m3",  15.0),
            ("MT-002", "Excavacion mecanica retroexcavadora",  "m3",   8.0),
            ("MT-003", "Relleno y compactacion",               "m3",  12.0),
            ("MT-004", "Nivelacion y perfilado de terreno",    "m2",   5.0),
            ("MT-005", "Retiro y disposicion de escombros",    "m3",  22.0),
            ("MT-006", "Demolicion de estructura existente",   "m2",  18.0),
        ],
    },
    {
        "name": "Fundaciones",
        "color": "#6b7280",
        "order": 2,
        "items": [
            ("FU-001", "Hormigon simple H-21",                 "m3", 175.0),
            ("FU-002", "Hormigon armado H-25",                 "m3", 245.0),
            ("FU-003", "Hormigon armado H-30",                 "m3", 280.0),
            ("FU-004", "Vigas de fundacion 20x40cm",           "ml",  48.0),
            ("FU-005", "Zapatas aisladas hasta 1m2",           "u",  320.0),
            ("FU-006", "Losa de fundacion",                    "m2",  95.0),
            ("FU-007", "Pilotos hormigon armado",              "ml",  65.0),
        ],
    },
    {
        "name": "Estructura",
        "color": "#1d4ed8",
        "order": 3,
        "items": [
            ("ES-001", "Losa nervurada h=20cm",                "m2",  85.0),
            ("ES-002", "Losa maciza h=15cm",                   "m2",  95.0),
            ("ES-003", "Losa maciza h=20cm",                   "m2", 115.0),
            ("ES-004", "Columna rectangular hormigon armado",  "ml", 125.0),
            ("ES-005", "Viga hormigon armado 20x40",           "ml",  88.0),
            ("ES-006", "Escalera hormigon armado",             "m2", 145.0),
            ("ES-007", "Estructura metalica liviana",          "kg",   3.8),
            ("ES-008", "Mezzanine estructura metalica",        "m2", 180.0),
        ],
    },
    {
        "name": "Mamposteria",
        "color": "#b45309",
        "order": 4,
        "items": [
            ("MA-001", "Muro ladrillo macizo 15cm",            "m2",  32.0),
            ("MA-002", "Muro ladrillo macizo 22cm",            "m2",  42.0),
            ("MA-003", "Muro ladrillo hueco 15cm",             "m2",  28.0),
            ("MA-004", "Muro bloque hormigon 15cm",            "m2",  35.0),
            ("MA-005", "Muro bloque hormigon 20cm",            "m2",  42.0),
            ("MA-006", "Tabique ladrillo 12cm",                "m2",  25.0),
            ("MA-007", "Muro de piedra",                       "m2",  75.0),
        ],
    },
    {
        "name": "Cubiertas",
        "color": "#065f46",
        "order": 5,
        "items": [
            ("CU-001", "Cubierta chapa acanalada galvanizada", "m2",  22.0),
            ("CU-002", "Cubierta chapa trapezoidal color",     "m2",  28.0),
            ("CU-003", "Cubierta teja ceramica espanola",      "m2",  48.0),
            ("CU-004", "Cubierta teja asfaltica",              "m2",  35.0),
            ("CU-005", "Membrana asfaltica bicapa",            "m2",  22.0),
            ("CU-006", "Losa cubierta impermeabilizada",       "m2",  55.0),
            ("CU-007", "Estructura madera par y nudillo",      "m2",  32.0),
            ("CU-008", "Canaleta PVC completa",                "ml",  14.0),
            ("CU-009", "Bajada agua pluvial PVC",              "ml",   9.0),
        ],
    },
    {
        "name": "Revoques",
        "color": "#d97706",
        "order": 6,
        "items": [
            ("RV-001", "Revoque grueso interior 2cm",          "m2",  14.0),
            ("RV-002", "Revoque fino interior",                "m2",  12.0),
            ("RV-003", "Revoque grueso exterior",              "m2",  18.0),
            ("RV-004", "Revoque impermeable exterior",         "m2",  24.0),
            ("RV-005", "Yeso proyectado",                      "m2",  10.0),
            ("RV-006", "Enlucido de yeso manual",              "m2",   9.0),
            ("RV-007", "Cielorraso de yeso",                   "m2",  22.0),
        ],
    },
    {
        "name": "Revestimientos",
        "color": "#7c3aed",
        "order": 7,
        "items": [
            ("RE-001", "Ceramico piso interior 40x40",         "m2",  28.0),
            ("RE-002", "Porcelanato 60x60 rectificado",        "m2",  58.0),
            ("RE-003", "Azulejo bano 20x30",                   "m2",  28.0),
            ("RE-004", "Microcemento decorativo",              "m2",  65.0),
            ("RE-005", "Piso flotante laminado AC4",           "m2",  32.0),
            ("RE-006", "Piso vinilico SPC",                    "m2",  28.0),
            ("RE-007", "Madera maciza machihembrada",          "m2",  88.0),
            ("RE-008", "Deck de madera exterior",              "m2",  72.0),
            ("RE-009", "Pavimento hormigon pulido",            "m2",  45.0),
        ],
    },
    {
        "name": "Carpinteria",
        "color": "#92400e",
        "order": 8,
        "items": [
            ("CA-001", "Puerta interior placard madera",       "u",  185.0),
            ("CA-002", "Puerta exterior madera maciza",        "u",  380.0),
            ("CA-003", "Puerta blindada acero",                "u",  520.0),
            ("CA-004", "Ventana aluminio serie 25",            "m2", 115.0),
            ("CA-005", "Ventana aluminio DVH",                 "m2", 185.0),
            ("CA-006", "Ventana PVC con DVH",                  "m2", 220.0),
            ("CA-007", "Puerta ventana aluminio",              "m2", 145.0),
            ("CA-008", "Armario empotrado 2 puertas 2m",       "u",  480.0),
            ("CA-009", "Muebles de cocina",                    "ml", 380.0),
            ("CA-010", "Escalera de madera",                   "u", 1800.0),
            ("CA-011", "Porton garaje seccional",              "u", 1200.0),
        ],
    },
    {
        "name": "Instalacion Sanitaria",
        "color": "#0369a1",
        "order": 9,
        "items": [
            ("IS-001", "Bano completo equipado",               "u",  1350.0),
            ("IS-002", "Inodoro con mochila",                  "u",   180.0),
            ("IS-003", "Bidet",                                "u",   120.0),
            ("IS-004", "Lavatorio 50x40",                      "u",   115.0),
            ("IS-005", "Ducha con mezcladora",                 "u",   220.0),
            ("IS-006", "Banera estandar",                      "u",   450.0),
            ("IS-007", "Caneria desague PVC 110",              "ml",    9.0),
            ("IS-008", "Caneria agua fria PVC 25",             "ml",    8.0),
            ("IS-009", "Caneria agua caliente cobre 22",       "ml",   18.0),
            ("IS-010", "Calefon a gas 14L",                    "u",   380.0),
            ("IS-011", "Termo electrico 80L",                  "u",   280.0),
            ("IS-012", "Bomba de agua (instalacion completa)", "u",   450.0),
            ("IS-013", "Tanque cisterna 1000L",                "u",   320.0),
        ],
    },
    {
        "name": "Instalacion Electrica",
        "color": "#ca8a04",
        "order": 10,
        "items": [
            ("IE-001", "Instalacion electrica completa",       "m2",  48.0),
            ("IE-002", "Tablero principal c/diferenciales",    "u",  320.0),
            ("IE-003", "Circuito cableado + caneria",          "ml",  10.0),
            ("IE-004", "Tomacorriente doble 10A",              "u",   18.0),
            ("IE-005", "Tomacorriente 20A con tierra",         "u",   22.0),
            ("IE-006", "Interruptor simple",                   "u",   14.0),
            ("IE-007", "Boca de luz (artefacto basico)",       "u",   38.0),
            ("IE-008", "Portero electrico completo",           "u",  280.0),
            ("IE-009", "Panel fotovoltaico (por m2)",          "m2", 180.0),
        ],
    },
    {
        "name": "Pintura",
        "color": "#dc2626",
        "order": 11,
        "items": [
            ("PI-001", "Pintura latex interior 2 manos",       "m2",   9.0),
            ("PI-002", "Pintura latex exterior especial",      "m2",  12.0),
            ("PI-003", "Impermeabilizante losa",               "m2",  16.0),
            ("PI-004", "Barniz madera interior",               "m2",  13.0),
            ("PI-005", "Esmalte sintetico",                    "m2",  15.0),
            ("PI-006", "Pintura epoxi piso",                   "m2",  22.0),
        ],
    },
    {
        "name": "Instalaciones Especiales",
        "color": "#475569",
        "order": 12,
        "items": [
            ("IN-001", "Instalacion gas (tuberias completo)",  "u",    850.0),
            ("IN-002", "Aire acondicionado split 3000f",       "u",   1350.0),
            ("IN-003", "Aire acondicionado split 5000f",       "u",   1650.0),
            ("IN-004", "Sistema alarma + monitoreo",           "u",    750.0),
            ("IN-005", "Sistema CCTV 4 camaras",               "u",    950.0),
            ("IN-006", "Sistema domotica basico",              "u",   2800.0),
            ("IN-007", "Ascensor 4 paradas",                   "u",  38000.0),
            ("IN-008", "Ascensor 6 paradas",                   "u",  52000.0),
            ("IN-009", "Piscina 8x4m completa",                "u",  18000.0),
        ],
    },
]


def run():
    db = SessionLocal()
    try:
        # Si ya hay datos, preguntar si resetear
        existing = db.query(CatalogCategory).count()
        if existing > 0:
            print(f"[INFO] Ya existen {existing} categorias en el catalogo.")
            print("[INFO] Borrando datos existentes y recargando...")
            db.query(CatalogItem).delete()
            db.query(CatalogCategory).delete()
            db.commit()

        total_items = 0
        for cat_data in CATALOG:
            cat = CatalogCategory(
                name=cat_data["name"],
                color=cat_data["color"],
                order=cat_data["order"],
            )
            db.add(cat)
            db.flush()  # obtener el id

            for code, name, unit, price in cat_data["items"]:
                item = CatalogItem(
                    code=code,
                    name=name,
                    unit=unit,
                    unit_price=price,
                    currency="USD",
                    category_id=cat.id,
                )
                db.add(item)
                total_items += 1

            print(f"  [OK] {cat_data['name']} — {len(cat_data['items'])} items")

        db.commit()
        print(f"\n[OK] Catalogo cargado: {len(CATALOG)} categorias, {total_items} items.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
