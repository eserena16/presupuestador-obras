"""
Rutas de sugerencias con IA usando el API de Anthropic (Claude).
POST /api/ai/suggest      → respuesta SSE con el desglose (streaming)
POST /api/ai/suggest/json → respuesta JSON completa (sin streaming)
"""
from __future__ import annotations

import json
from typing import Optional, AsyncGenerator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

import anthropic

from app.core.config import settings
from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.project import Project
from app.models.budget import BudgetLine, Rubro
from app.models.catalog import CatalogCategory, CatalogItem  # noqa: F401 — importados para que SQLAlchemy los registre

router = APIRouter(prefix="/ai", tags=["AI"])


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class AISuggestRequest(BaseModel):
    project_id: Optional[UUID] = None
    obra_type: str
    surface_m2: float
    description: Optional[str] = None
    location: Optional[str] = None
    budget_usd: Optional[float] = None


class AISuggestResponse(BaseModel):
    categories: list[dict]
    total_usd: float
    notes: str


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_system_prompt() -> str:
    return (
        "Eres un arquitecto y presupuestador de obras experto en Uruguay. "
        "Tu tarea es generar un desglose de presupuesto estimado para una obra de construccion. "
        "Responde SIEMPRE con un objeto JSON valido con la siguiente estructura "
        "(sin markdown, sin bloques ```json, solo el JSON puro):\n\n"
        '{\n'
        '  "categories": [\n'
        '    {\n'
        '      "name": "Nombre de categoria",\n'
        '      "percentage": 15.0,\n'
        '      "estimated_usd": 12000.0,\n'
        '      "items": [\n'
        '        {"description": "Item especifico", "unit": "m2", '
        '"quantity": 120, "unit_price": 45, "subtotal": 5400}\n'
        '      ]\n'
        '    }\n'
        '  ],\n'
        '  "total_usd": 80000.0,\n'
        '  "notes": "Observaciones y consideraciones importantes"\n'
        '}\n\n'
        "Usa precios en USD tipicos de Uruguay (2024-2025). "
        "Incluye categorias: movimiento de tierras, fundaciones, estructura, "
        "mamposteria, cubiertas, revoques, revestimientos, carpinteria, "
        "instalacion sanitaria, instalacion electrica, pintura, instalaciones especiales. "
        "La suma de percentages debe ser 100 y la suma de estimated_usd debe ser total_usd."
    )


def _build_user_prompt(req: AISuggestRequest, similar_projects: list[dict]) -> str:
    lines = [
        f"Tipo de obra: {req.obra_type}",
        f"Superficie: {req.surface_m2} m2",
    ]
    if req.description:
        lines.append(f"Descripcion: {req.description}")
    if req.location:
        lines.append(f"Ubicacion: {req.location}")
    if req.budget_usd:
        lines.append(f"Presupuesto maximo disponible: USD {req.budget_usd:,.0f}")

    if similar_projects:
        lines.append("\nProyectos similares en la base de datos (referencia de costos):")
        for p in similar_projects[:5]:
            lines.append(
                f"  - {p['name']} | {p['obra_type']} | {p['surface_m2']}m2 "
                f"| Presupuesto: USD {p.get('budget_usd', 'N/D')}"
            )

    lines.append(
        "\nGenera el desglose de presupuesto completo en formato JSON."
    )
    return "\n".join(lines)


def _get_similar_projects(db: Session, obra_type: str, surface_m2: float) -> list[dict]:
    projects = (
        db.query(Project)
        .filter(Project.obra_type.ilike(f"%{obra_type}%"))
        .limit(10)
        .all()
    )
    result = []
    for p in projects:
        budget_usd = None
        if p.active_version_id:
            lines = (
                db.query(BudgetLine)
                .join(Rubro, BudgetLine.rubro_id == Rubro.id)
                .filter(Rubro.version_id == p.active_version_id)
                .all()
            )
            if lines:
                budget_usd = sum(line.quantity * line.unit_price for line in lines)

        result.append({
            "name": p.name,
            "obra_type": p.obra_type or "",
            "surface_m2": p.surface_m2,
            "budget_usd": round(budget_usd, 2) if budget_usd else None,
        })
    return result


def _extract_json(text: str) -> dict:
    """Extrae el primer JSON completo del texto de la respuesta."""
    start = text.find("{")
    end = text.rfind("}") + 1
    if start == -1:
        raise ValueError("No se encontro JSON en la respuesta de la IA")
    return json.loads(text[start:end])


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/suggest")
async def ai_suggest_streaming(
    req: AISuggestRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Genera una sugerencia de presupuesto con streaming SSE.
    Usa AsyncAnthropic para no bloquear el event loop.
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY no configurada. Agregala en backend/.env"
        )

    similar = _get_similar_projects(db, req.obra_type, req.surface_m2)
    system_prompt = _build_system_prompt()
    user_prompt = _build_user_prompt(req, similar)

    async def generate() -> AsyncGenerator[str, None]:
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        try:
            async with client.messages.stream(
                model="claude-opus-4-7",
                max_tokens=4096,
                thinking={"type": "adaptive"},
                system=system_prompt,
                messages=[{"role": "user", "content": user_prompt}],
            ) as stream:
                async for text in stream.text_stream:
                    yield f"data: {json.dumps({'chunk': text})}\n\n"

            yield "data: [DONE]\n\n"

        except anthropic.APIStatusError as e:
            yield f"data: {json.dumps({'error': f'Error de API: {e.status_code} {e.message}'})}\n\n"
        except anthropic.APIConnectionError as e:
            yield f"data: {json.dumps({'error': f'Error de conexion: {str(e)}'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/suggest/json", response_model=AISuggestResponse)
async def ai_suggest_json(
    req: AISuggestRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Genera una sugerencia de presupuesto y devuelve JSON completo (sin streaming).
    """
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY no configurada. Agregala en backend/.env"
        )

    similar = _get_similar_projects(db, req.obra_type, req.surface_m2)
    system_prompt = _build_system_prompt()
    user_prompt = _build_user_prompt(req, similar)

    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    try:
        async with client.messages.stream(
            model="claude-opus-4-7",
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        ) as stream:
            final_msg = await stream.get_final_message()
            text = ""
            for block in final_msg.content:
                if hasattr(block, "text"):
                    text += block.text

    except anthropic.APIStatusError as e:
        raise HTTPException(status_code=502, detail=f"Error de Anthropic API: {e.status_code} {e.message}")
    except anthropic.APIConnectionError as e:
        raise HTTPException(status_code=502, detail=f"Error de conexion con Anthropic: {e}")

    try:
        data = _extract_json(text)
        return AISuggestResponse(**data)
    except (json.JSONDecodeError, ValueError, KeyError) as e:
        raise HTTPException(
            status_code=422,
            detail=f"No se pudo parsear la respuesta de la IA: {e}. Respuesta: {text[:500]}"
        )
