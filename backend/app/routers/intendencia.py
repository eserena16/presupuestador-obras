"""
Rutas para consulta del padron catastral via la API de la Intendencia de Montevideo.
GET /api/intendencia/padron/{numero}  → datos del predio

API utilizada: GeoServer WFS de Montevideo
Base URL: https://montevideo.gub.uy/app/geoserver/ows
Capas:
  - mapstore-base:cb_v_mdg_parcelas_citim  → area del predio (areatot, areacat)
  - mapstore-base:cb_v_mdg_accesos_puerta  → direccion (concatenado, nom_calle, num_puerta)
  - mapstore-tematicas:zon_v_sig_barrios   → barrio (por interseccion espacial)
"""
from __future__ import annotations

import asyncio
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/intendencia", tags=["Intendencia"])

# ---------------------------------------------------------------------------
# URL del servicio WFS de la Intendencia de Montevideo
# ---------------------------------------------------------------------------
WFS_URL = "https://montevideo.gub.uy/app/geoserver/ows"

# Capas verificadas
LAYER_PARCELAS = "mapstore-base:cb_v_mdg_parcelas_citim"   # area del predio
LAYER_ACCESOS  = "mapstore-base:cb_v_mdg_accesos_puerta"   # direccion/puerta
LAYER_BARRIOS  = "mapstore-tematicas:zon_v_sig_barrios"    # barrios (spatial)


class PadronResponse(BaseModel):
    padron: str
    direccion: Optional[str] = None
    barrio: Optional[str] = None
    zona: Optional[str] = None
    superficie_m2: Optional[float] = None
    frente_m: Optional[float] = None
    fondo_m: Optional[float] = None


async def _fetch_parcela(client: httpx.AsyncClient, numero: str) -> dict | None:
    """Consulta datos de area/parcela para el padron."""
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": LAYER_PARCELAS,
        "CQL_FILTER": f"padron={numero}",
        "outputFormat": "application/json",
        "count": "1",
    }
    try:
        resp = await client.get(WFS_URL, params=params)
        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            if features:
                return features[0].get("properties") or {}
    except Exception:
        pass
    return None


async def _fetch_acceso(client: httpx.AsyncClient, numero: str) -> dict | None:
    """Consulta datos de direccion/puerta para el padron."""
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": LAYER_ACCESOS,
        "CQL_FILTER": f"padron={numero}",
        "outputFormat": "application/json",
        "count": "1",
    }
    try:
        resp = await client.get(WFS_URL, params=params)
        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            if features:
                return features[0].get("properties") or {}
    except Exception:
        pass
    return None


async def _fetch_barrio(client: httpx.AsyncClient, numero: str) -> str | None:
    """Consulta el barrio via interseccion espacial con la parcela."""
    # Usa querySingle para obtener la geometria de la parcela e intersectarla con barrios
    cql = (
        f"INTERSECTS(the_geom,"
        f"querySingle('{LAYER_PARCELAS}','the_geom','padron={numero}'))"
    )
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "typeNames": LAYER_BARRIOS,
        "CQL_FILTER": cql,
        "outputFormat": "application/json",
        "count": "1",
    }
    try:
        resp = await client.get(WFS_URL, params=params)
        if resp.status_code == 200:
            data = resp.json()
            features = data.get("features", [])
            if features:
                props = features[0].get("properties") or {}
                return (
                    props.get("barrio")
                    or props.get("BARRIO")
                    or props.get("nombre")
                    or props.get("nom_barrio")
                )
    except Exception:
        pass
    return None


@router.get("/padron/{numero}", response_model=PadronResponse)
async def get_padron(numero: str):
    """
    Consulta los datos de un padron catastral en Montevideo.
    El numero debe ser el numero de padron catastral (ej: 421264).
    """
    numero = numero.strip()
    if not numero.isdigit():
        raise HTTPException(
            status_code=400,
            detail="El numero de padron debe contener solo digitos."
        )

    async with httpx.AsyncClient(timeout=20.0) as client:
        # Realizar las 3 consultas en paralelo
        parcela_task = _fetch_parcela(client, numero)
        acceso_task  = _fetch_acceso(client, numero)
        barrio_task  = _fetch_barrio(client, numero)

        parcela, acceso, barrio = await asyncio.gather(
            parcela_task, acceso_task, barrio_task
        )

    # Si no encontramos nada en parcelas ni accesos, el padron no existe
    if parcela is None and acceso is None:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No se encontraron datos para el padron {numero}. "
                "Verifique que el numero sea correcto y pertenezca a Montevideo."
            ),
        )

    # --- Direccion ---
    direccion = None
    if acceso:
        # 'concatenado' tiene la direccion completa, ej: "SARA OTERMIN 3953"
        direccion = (
            acceso.get("concatenado")
            or acceso.get("CONCATENADO")
        )
        if not direccion:
            # Armar desde partes
            calle  = acceso.get("nom_calle") or acceso.get("NOM_CALLE") or ""
            numero_puerta = acceso.get("num_puerta") or acceso.get("NUM_PUERTA") or ""
            if calle:
                direccion = f"{calle} {numero_puerta}".strip()

    # --- Superficie ---
    superficie = None
    if parcela:
        sup_raw = parcela.get("areatot") or parcela.get("areacat") or parcela.get("AREATOT")
        if sup_raw is not None:
            try:
                superficie = round(float(sup_raw), 2)
            except (ValueError, TypeError):
                pass

    # --- Barrio ---
    barrio_nombre = barrio  # ya es string o None

    return PadronResponse(
        padron=numero,
        direccion=direccion,
        barrio=barrio_nombre,
        zona=None,
        superficie_m2=superficie,
        frente_m=None,
        fondo_m=None,
    )


@router.get("/padron/{numero}/raw")
async def get_padron_raw(numero: str):
    """
    Devuelve las respuestas crudas del WFS para depuracion.
    """
    numero = numero.strip()
    async with httpx.AsyncClient(timeout=20.0) as client:
        parcela_task = _fetch_parcela(client, numero)
        acceso_task  = _fetch_acceso(client, numero)
        barrio_task  = _fetch_barrio(client, numero)

        parcela, acceso, barrio = await asyncio.gather(
            parcela_task, acceso_task, barrio_task
        )

    return {
        "padron": numero,
        "parcela": parcela,
        "acceso": acceso,
        "barrio": barrio,
    }
