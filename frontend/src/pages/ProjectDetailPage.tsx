import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Activity, Loader2, FolderOpen,
  Sparkles, X, ChevronDown, ChevronRight, DollarSign,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsApi } from '../api/projects'
import { aiApi, type AISuggestResponse } from '../api/ai'

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador', en_progreso: 'En progreso', pausado: 'Pausado',
  completado: 'Completado', cancelado: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  borrador: 'bg-slate-700 text-slate-300',
  en_progreso: 'bg-blue-500/20 text-blue-300',
  pausado: 'bg-amber-500/20 text-amber-300',
  completado: 'bg-emerald-500/20 text-emerald-300',
  cancelado: 'bg-red-500/20 text-red-300',
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })

  // AI Suggest state
  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText] = useState('')
  const [aiResult, setAiResult] = useState<AISuggestResponse | null>(null)
  const [expandedCat, setExpandedCat] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)

  const handleAiSuggest = async () => {
    if (!project) return
    setAiText('')
    setAiResult(null)
    setAiLoading(true)
    setAiOpen(true)

    abortRef.current = new AbortController()

    try {
      const result = await aiApi.suggestStreaming(
        {
          project_id: project.id,
          obra_type: project.obra_type ?? 'VIVIENDA_UNIFAMILIAR',
          surface_m2: project.surface_m2,
          description: project.description ?? undefined,
          location: project.location ?? undefined,
        },
        (chunk) => setAiText((prev) => prev + chunk),
        abortRef.current.signal,
      )
      setAiResult(result)
      toast.success('Sugerencia generada por IA')
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      const msg = err instanceof Error ? err.message : 'Error al generar sugerencia'
      toast.error(msg)
    } finally {
      setAiLoading(false)
    }
  }

  const cancelAi = () => {
    abortRef.current?.abort()
    setAiLoading(false)
  }

  const toggleCat = (name: string) => {
    setExpandedCat((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={24} className="animate-spin mr-2" /> Cargando proyecto...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <FolderOpen size={40} className="mb-3 opacity-30" />
        <p>Proyecto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-white">{project.name}</h2>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[project.status]}`}>
              {STATUS_LABEL[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-sm text-slate-400 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Botón sugerencia IA */}
          <button
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Sugerir presupuesto IA
          </button>
          {/* Botón seguimiento */}
          <button
            onClick={() => navigate(`/proyectos/${project.id}/seguimiento`)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Activity size={16} />
            Seguimiento
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Cliente" value={project.client ?? '—'} />
        <InfoCard label="Ubicación" value={project.location ?? '—'} />
        <InfoCard label="Superficie" value={project.surface_m2 ? `${project.surface_m2} m²` : '—'} />
        <InfoCard label="Tipo de obra" value={project.obra_type?.replace(/_/g, ' ') ?? '—'} />
      </div>

      {/* Panel de sugerencia IA */}
      {aiOpen && (
        <div className="bg-slate-900 border border-violet-800/50 rounded-xl overflow-hidden">
          {/* Cabecera del panel */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 bg-violet-900/10">
            <Sparkles size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-violet-200">Sugerencia de presupuesto — IA</span>
            <div className="flex-1" />
            {aiLoading && (
              <button
                onClick={cancelAi}
                className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Cancelar
              </button>
            )}
            <button
              onClick={() => setAiOpen(false)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Contenido */}
          <div className="p-5">
            {/* Mientras carga: mostrar texto en streaming */}
            {aiLoading && !aiResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <Loader2 size={12} className="animate-spin" />
                  Claude está analizando el proyecto...
                </div>
                {aiText && (
                  <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap bg-slate-800/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {aiText}
                  </pre>
                )}
              </div>
            )}

            {/* Resultado estructurado */}
            {aiResult && (
              <div className="space-y-4">
                {/* Total */}
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-lg p-4">
                  <DollarSign size={20} className="text-emerald-400" />
                  <div>
                    <p className="text-xs text-slate-400">Presupuesto total estimado</p>
                    <p className="text-2xl font-bold text-emerald-400">
                      USD {aiResult.total_usd.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  {project.surface_m2 > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-slate-400">Por m²</p>
                      <p className="text-lg font-semibold text-slate-200">
                        USD {Math.round(aiResult.total_usd / project.surface_m2).toLocaleString('es-UY')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Categorías */}
                <div className="space-y-2">
                  {aiResult.categories.map((cat) => (
                    <div key={cat.name} className="border border-slate-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCat(cat.name)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/50 transition-colors"
                      >
                        {/* Barra de porcentaje */}
                        <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-10 text-right">
                          {cat.percentage.toFixed(0)}%
                        </span>
                        <span className="flex-1 text-sm font-medium text-slate-200 text-left">
                          {cat.name}
                        </span>
                        <span className="text-sm font-semibold text-emerald-400">
                          USD {cat.estimated_usd.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        {expandedCat.has(cat.name) ? (
                          <ChevronDown size={14} className="text-slate-500 ml-1" />
                        ) : (
                          <ChevronRight size={14} className="text-slate-500 ml-1" />
                        )}
                      </button>

                      {/* Ítems de la categoría */}
                      {expandedCat.has(cat.name) && cat.items.length > 0 && (
                        <div className="border-t border-slate-800">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-800/40 text-slate-500">
                                <th className="text-left px-4 py-1.5 font-medium">Descripción</th>
                                <th className="text-center px-3 py-1.5 font-medium">Unidad</th>
                                <th className="text-right px-3 py-1.5 font-medium">Cant.</th>
                                <th className="text-right px-3 py-1.5 font-medium">P/Unit</th>
                                <th className="text-right px-4 py-1.5 font-medium">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cat.items.map((item, i) => (
                                <tr key={i} className="border-t border-slate-800/50">
                                  <td className="px-4 py-2 text-slate-300">{item.description}</td>
                                  <td className="px-3 py-2 text-center text-slate-500">{item.unit}</td>
                                  <td className="px-3 py-2 text-right text-slate-400">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right text-slate-400">
                                    ${item.unit_price.toLocaleString('es-UY')}
                                  </td>
                                  <td className="px-4 py-2 text-right font-medium text-emerald-400">
                                    ${item.subtotal.toLocaleString('es-UY')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Notas */}
                {aiResult.notes && (
                  <div className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
                    <p className="text-xs font-semibold text-slate-400 mb-1">Observaciones</p>
                    <p className="text-sm text-slate-300">{aiResult.notes}</p>
                  </div>
                )}

                <p className="text-xs text-slate-500 text-center">
                  Sugerencia generada por IA — valores estimados, sujetos a revisión profesional
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder presupuesto */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <FolderOpen size={36} className="mx-auto mb-3 text-slate-600" />
        <p className="text-slate-400 text-sm font-medium">Módulo de presupuesto</p>
        <p className="text-slate-600 text-xs mt-1">
          Creá versiones de presupuesto, rubros y líneas de cotización.
        </p>
        <p className="text-slate-600 text-xs mt-3">
          (Próximamente — módulo en desarrollo)
        </p>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-slate-100">{value}</p>
    </div>
  )
}
