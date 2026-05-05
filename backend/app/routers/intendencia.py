"""
Rutas para consulta del padron catastral via la API de la Intendencia de Montevideo.
GET /api/intendencia/padron/{numero}  → datos del predio
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/intendencia", tags=["Intendencia"])

# ---------------------------------------------------------------------------
# URL del servicio WFS de la Intendencia de Montevideo
# Documentacion: https://sig.montevideo.gub.uy
# ---------------------------------------------------------------------------
WFS_URL = "https://sig.montevideo.gub.uy/geoserver/ows"

# Posibles nombres de capas para padrones (probar en orden)
PADRON_LAYERS = [
    "planeamiento:padrones_ue",
    "planeamiento:PADRON_UE",
    "sig:padrones_mvd",
    "sig:PADRONES_MVD",
]


class PadronResponse(BaseModel):
    padron: str
    direccion: Optional[str] = None
    barrio: Optional[str] = None
    zona: Optional[str] = None
    superficie_m2: Optional[float] = None
    frente_m: Optional[float] = None
    fondo_m: Optional[float] = None
    raw: Optional[dict] = None   # datos crudos para depuracion


def _extract_padron_data(feature: dict, padron_numero: str) -> PadronResponse:
    """Extrae campos relevantes de un feature GeoJSON."""
    props = feature.get("properties") or {}

    # Intentar leer diferentes nombres de campo segun la capa
    direccion = (
        props.get("direccion")
        or props.get("DIRECCION")
        or props.get("dir_prin")
        or props.get("DIR_PRIN")
        or props.get("nombre_calle")
    )
    barrio = (
        props.get("barrio")
        or props.get("BARRIO")
        or props.get("nom_barrio")
        or props.get("NOM_BARRIO")
    )
    zona = (
        props.get("zona")
        or props.get("ZONA")
        or props.get("ccz")
        or props.get("CCZ")
    )

    # Superficie: puede estar en m2 o en hectareas
    sup_raw = (
        props.get("area_m2")
        or props.get("AREA_M2")
        or props.get("superficie")
        or props.get("SUPERFICIE")
        or props.get("sup_m2")
        or props.get("shape_area")
        or props.get("SHAPE_AREA")
    )
    superficie = None
    if sup_raw is not None:
        try:
            sup_val = float(sup_raw)
            # Si parece estar en m2 ya
            if sup_val > 10000:
                # Podria ser en cm2 o unidades catastrales uruguayas
                sup_val = sup_val / 10000
            superficie = round(sup_val, 2)
        except (ValueError, TypeError):
            pass

    frente = None
    fondo = None
    for key in ("frente", "FRENTE", "frente_m", "FRENTE_M"):
        if key in props:
            try:
                frente = float(props[key])
            except (ValueError, TypeError):
                pass
            break
    for key in ("fondo", "FONDO", "fondo_m", "FONDO_M"):
        if key in props:
            try:
                fondo = float(props[key])
            except (ValueError, TypeError):
                pass
            break

    return PadronResponse(
        padron=padron_numero,
        direccion=direccion,
        barrio=barrio,
        zona=str(zona) if zona is not None else None,
        superficie_m2=superficie,
        frente_m=frente,
        fondo_m=fondo,
        raw=props,
    )


@router.get("/padron/{numero}", response_model=PadronResponse)
async def get_padron(numero: str):
    """
    Consulta los datos de un padron catastral en Montevideo.
    El numero debe ser el numero de padron (ej: 12345).
    """
    numero = numero.strip()
    if not numero.isdigit():
        raise HTTPException(
            status_code=400,
            detail="El numero de padron debe contener solo digitos."
        )

    async with httpx.AsyncClient(timeout=15.0) as client:
        last_error: str = "Sin respuesta del servidor"

        for layer in PADRON_LAYERS:
            try:
                params = {
                    "service": "WFS",
                    "version": "2.0.0",
                    "request": "GetFeature",
                    "typeName": layer,
                    "CQL_FILTER": f"padron='{numero}' OR PADRON='{numero}' OR numpad='{numero}' OR NUMPAD='{numero}'",
                    "outputFormat": "application/json",
                    "srsName": "EPSG:4326",
                    "count": "1",
                }
                resp = await client.get(WFS_URL, params=params)

                if resp.status_code != 200:
                    last_error = f"Capa {layer}: HTTP {resp.status_code}"
                    continue

                data = resp.json()
                features = data.get("features", [])

                if features:
                    return _extract_padron_data(features[0], numero)

                # Intentar filtro alternativo (sin comillas para numeros)
                params2 = {**params, "CQL_FILTER": f"padron={numero}"}
                resp2 = await client.get(WFS_URL, params=params2)
                if resp2.status_code == 200:
                    data2 = resp2.json()
                    features2 = data2.get("features", [])
                    if features2:
                        return _extract_padron_data(features2[0], numero)

                last_error = f"Capa {layer}: padron {numero} no encontrado"

            except httpx.RequestError as e:
                last_error = f"Error de red: {e}"
            except Exception as e:
                last_error = f"Error inesperado: {e}"

        raise HTTPException(
            status_code=404,
            detail=(
                f"No se encontraron datos para el padron {numero}. "
                f"Ultimo error: {last_error}. "
                "Verifique que el numero de padron sea correcto y pertenezca a Montevideo."
            ),
        )


@router.get("/padron/{numero}/raw")
async def get_padron_raw(numero: str):
    """
    Devuelve la respuesta cruda del WFS para depuracion.
    """
    numero = numero.strip()
    async with httpx.AsyncClient(timeout=15.0) as client:
        params = {
            "service": "WFS",
            "version": "2.0.0",
            "request": "GetFeature",
            "typeName": PADRON_LAYERS[0],
            "CQL_FILTER": f"padron='{numero}'",
            "outputFormat": "application/json",
            "srsName": "EPSG:4326",
            "count": "5",
        }
        try:
            resp = await client.get(WFS_URL, params=params)
            return {"status": resp.status_code, "body": resp.json()}
        except Exception as e:
            return {"error": str(e)}
