import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Activity, Loader2, FolderOpen,
  Sparkles, X, ChevronDown, ChevronRight, DollarSign,
  Copy, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsApi } from '../api/projects'
import { aiApi, type AISuggestResponse } from '../api/ai'
import BudgetEditor from '../components/budget/BudgetEditor'
import type { ProjectStatus } from '../types'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador', en_progreso: 'En progreso', pausado: 'Pausado',
  completado: 'Completado', cancelado: 'Cancelado',
}
const STATUS_COLOR: Record<string, string> = {
  borrador:    'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  en_progreso: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  pausado:     'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  completado:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  cancelado:   'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}
const ALL_STATUSES: ProjectStatus[] = [
  'borrador', 'en_progreso', 'pausado', 'completado', 'cancelado',
]

// ─── StatusPicker ─────────────────────────────────────────────────────────────

function StatusPicker({
  projectId,
  current,
}: {
  projectId: string
  current: ProjectStatus
}) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: (status: ProjectStatus) =>
      projectsApi.update(projectId, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
      toast.success('Estado actualizado')
    },
    onError: () => toast.error('Error al actualizar el estado'),
  })

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium transition-colors ${STATUS_COLOR[current]}`}
      >
        {STATUS_LABEL[current]}
        <ChevronDown size={11} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1 z-20 bg-app-canvas border border-app-line2 rounded-xl shadow-xl py-1 min-w-[160px]">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => mutation.mutate(s)}
                disabled={mutation.isPending}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-app-card transition-colors ${
                  s === current ? 'text-sky-500 font-semibold' : 'text-app-text2'
                }`}
              >
                {s === current && <Check size={11} />}
                {s !== current && <span className="w-[11px]" />}
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })

  // ── Duplicate ──
  const duplicateMutation = useMutation({
    mutationFn: () => projectsApi.duplicate(id!),
    onSuccess: (newProject) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Proyecto duplicado')
      navigate(`/proyectos/${newProject.id}`)
    },
    onError: () => toast.error('Error al duplicar el proyecto'),
  })

  // ── AI Suggest ──
  const [aiOpen, setAiOpen]     = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiText, setAiText]     = useState('')
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

  const cancelAi = () => { abortRef.current?.abort(); setAiLoading(false) }
  const toggleCat = (name: string) => {
    setExpandedCat((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  // ─────────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-app-muted">
        <Loader2 size={24} className="animate-spin mr-2" /> Cargando proyecto...
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-app-muted">
        <FolderOpen size={40} className="mb-3 opacity-30" />
        <p>Proyecto no encontrado</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/proyectos')}
          className="p-2 rounded-lg text-app-muted hover:bg-app-card hover:text-app-text transition-colors mt-0.5"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold text-app-text">{project.name}</h2>
            {/* ① CAMBIO DE ESTADO inline */}
            <StatusPicker
              projectId={project.id}
              current={project.status as ProjectStatus}
            />
          </div>
          {project.description && (
            <p className="text-sm text-app-muted mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ④ DUPLICAR */}
          <button
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            className="flex items-center gap-2 bg-app-card hover:bg-app-raised border border-app-line2 text-app-text2 text-sm px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
            title="Duplicar proyecto"
          >
            {duplicateMutation.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Copy size={14} />
            )}
            Duplicar
          </button>
          {/* Botón IA */}
          <button
            onClick={handleAiSuggest}
            disabled={aiLoading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            Sugerir con IA
          </button>
          {/* Seguimiento */}
          <button
            onClick={() => navigate(`/proyectos/${project.id}/seguimiento`)}
            className="flex items-center gap-2 bg-app-card hover:bg-app-raised border border-app-line2 text-app-text2 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Activity size={16} />
            Seguimiento
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Cliente"     value={project.client ?? '—'} />
        <InfoCard label="Ubicación"   value={project.location ?? '—'} />
        <InfoCard label="Superficie"  value={project.surface_m2 ? `${project.surface_m2} m²` : '—'} />
        <InfoCard label="Tipo de obra" value={project.obra_type?.replace(/_/g, ' ') ?? '—'} />
      </div>

      {/* Panel sugerencia IA */}
      {aiOpen && (
        <div className="bg-app-canvas border border-violet-800/50 rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-app-line bg-violet-900/10">
            <Sparkles size={16} className="text-violet-400" />
            <span className="text-sm font-semibold text-violet-200 dark:text-violet-200">
              Sugerencia de presupuesto — IA
            </span>
            <div className="flex-1" />
            {aiLoading && (
              <button
                onClick={cancelAi}
                className="text-xs text-app-muted hover:text-red-500 flex items-center gap-1 transition-colors"
              >
                <X size={12} /> Cancelar
              </button>
            )}
            <button
              onClick={() => setAiOpen(false)}
              className="text-app-faint hover:text-app-text3 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5">
            {/* Streaming en progreso */}
            {aiLoading && !aiResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-violet-400">
                  <Loader2 size={12} className="animate-spin" />
                  Claude está analizando el proyecto...
                </div>
                {aiText && (
                  <pre className="text-xs text-app-muted font-mono whitespace-pre-wrap bg-app-card rounded-lg p-3 max-h-48 overflow-y-auto">
                    {aiText}
                  </pre>
                )}
              </div>
            )}

            {/* Resultado estructurado */}
            {aiResult && (
              <div className="space-y-4">
                {/* Total */}
                <div className="flex items-center gap-3 bg-app-card rounded-lg p-4">
                  <DollarSign size={20} className="text-emerald-500" />
                  <div>
                    <p className="text-xs text-app-muted">Presupuesto total estimado</p>
                    <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
                      USD {aiResult.total_usd.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  {project.surface_m2 > 0 && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-app-muted">Por m²</p>
                      <p className="text-lg font-semibold text-app-text2">
                        USD {Math.round(aiResult.total_usd / project.surface_m2).toLocaleString('es-UY')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Categorías */}
                <div className="space-y-2">
                  {aiResult.categories.map((cat) => (
                    <div key={cat.name} className="border border-app-line rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCat(cat.name)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-app-card transition-colors"
                      >
                        <div className="w-24 h-1.5 bg-app-raised rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full"
                            style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-app-muted w-10 text-right">
                          {cat.percentage.toFixed(0)}%
                        </span>
                        <span className="flex-1 text-sm font-medium text-app-text2 text-left">
                          {cat.name}
                        </span>
                        <span className="text-sm font-semibold text-emerald-500 dark:text-emerald-400">
                          USD {cat.estimated_usd.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                        {expandedCat.has(cat.name)
                          ? <ChevronDown size={14} className="text-app-faint ml-1" />
                          : <ChevronRight size={14} className="text-app-faint ml-1" />}
                      </button>

                      {expandedCat.has(cat.name) && cat.items.length > 0 && (
                        <div className="border-t border-app-line">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-app-card text-app-muted">
                                <th className="text-left px-4 py-1.5 font-medium">Descripción</th>
                                <th className="text-center px-3 py-1.5 font-medium">Unidad</th>
                                <th className="text-right px-3 py-1.5 font-medium">Cant.</th>
                                <th className="text-right px-3 py-1.5 font-medium">P/Unit</th>
                                <th className="text-right px-4 py-1.5 font-medium">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cat.items.map((item, i) => (
                                <tr key={i} className="border-t border-app-line">
                                  <td className="px-4 py-2 text-app-text3">{item.description}</td>
                                  <td className="px-3 py-2 text-center text-app-muted">{item.unit}</td>
                                  <td className="px-3 py-2 text-right text-app-muted">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right text-app-muted">${item.unit_price.toLocaleString('es-UY')}</td>
                                  <td className="px-4 py-2 text-right font-medium text-emerald-500 dark:text-emerald-400">
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
                  <div className="bg-app-card border border-app-line2 rounded-lg p-4">
                    <p className="text-xs font-semibold text-app-muted mb-1">Observaciones</p>
                    <p className="text-sm text-app-text3">{aiResult.notes}</p>
                  </div>
                )}

                <p className="text-xs text-app-faint text-center">
                  Sugerencia generada por IA — valores estimados, sujetos a revisión profesional
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ② MÓDULO DE PRESUPUESTO COMPLETO */}
      <BudgetEditor
        projectId={project.id}
        obraType={project.obra_type}
        currency={project.currency}
        aiResult={aiResult}
        onImportAI={() => {
          setAiOpen(false)
          setAiResult(null)
          toast.success('Sugerencia importada al presupuesto')
        }}
      />
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-app-canvas border border-app-line rounded-xl p-4">
      <p className="text-xs text-app-muted mb-1">{label}</p>
      <p className="text-sm font-medium text-app-text">{value}</p>
    </div>
  )
}
