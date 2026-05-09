import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Activity, Loader2, FolderOpen,
  Sparkles, X, ChevronRight, DollarSign,
  Copy, SendHorizonal, CheckCircle2, XCircle, RotateCcw, Ban, Flag,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsApi } from '../api/projects'
import { aiApi, type AISuggestResponse } from '../api/ai'
import BudgetEditor from '../components/budget/BudgetEditor'
import { useAuthStore } from '../store/useAuthStore'
import type { ProjectStatus } from '../types'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  borrador:    'Borrador',
  en_revision: 'En revisión',
  autorizado:  'Autorizado',
  rechazado:   'Rechazado',
  completado:  'Completado',
  cancelado:   'Cancelado',
}

const STATUS_DESC: Record<string, string> = {
  borrador:    'Presupuesto en elaboración',
  en_revision: 'Enviado para aprobación',
  autorizado:  'Presupuesto aprobado — listo para ejecutar',
  rechazado:   'Requiere correcciones antes de reenviar',
  completado:  'Obra finalizada',
  cancelado:   'Proyecto cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  borrador:    'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  en_revision: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  autorizado:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  rechazado:   'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
  completado:  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
  cancelado:   'bg-slate-300 text-slate-500 dark:bg-slate-600 dark:text-slate-400',
}

// Acciones disponibles por rol y estado actual
type ActionVariant = 'primary' | 'success' | 'danger' | 'ghost'
interface StatusAction {
  to: ProjectStatus
  label: string
  icon: React.ReactNode
  variant: ActionVariant
}

const STATUS_ACTIONS_BY_ROLE: Record<string, Partial<Record<ProjectStatus, StatusAction[]>>> = {
  creador: {
    borrador: [
      { to: 'en_revision', label: 'Enviar a revisión', icon: <SendHorizonal size={13} />, variant: 'primary' },
      { to: 'cancelado',   label: 'Cancelar proyecto', icon: <Ban size={13} />,           variant: 'ghost'   },
    ],
    rechazado: [
      { to: 'en_revision', label: 'Corregir y reenviar', icon: <SendHorizonal size={13} />, variant: 'primary' },
      { to: 'cancelado',   label: 'Cancelar proyecto',   icon: <Ban size={13} />,           variant: 'ghost'   },
    ],
  },
  autorizador: {
    en_revision: [
      { to: 'autorizado', label: 'Aprobar',  icon: <CheckCircle2 size={13} />, variant: 'success' },
      { to: 'rechazado',  label: 'Rechazar', icon: <XCircle size={13} />,      variant: 'danger'  },
      { to: 'cancelado',  label: 'Cancelar', icon: <Ban size={13} />,          variant: 'ghost'   },
    ],
    autorizado: [
      { to: 'completado', label: 'Marcar como completado', icon: <Flag size={13} />,       variant: 'success' },
      { to: 'cancelado',  label: 'Cancelar',               icon: <Ban size={13} />,        variant: 'ghost'   },
    ],
    cancelado: [
      { to: 'borrador', label: 'Reabrir proyecto', icon: <RotateCcw size={13} />, variant: 'ghost' },
    ],
  },
  admin: {
    borrador: [
      { to: 'en_revision', label: 'Enviar a revisión',      icon: <SendHorizonal size={13} />, variant: 'primary' },
      { to: 'autorizado',  label: 'Autorizar directamente', icon: <CheckCircle2 size={13} />,  variant: 'success' },
      { to: 'cancelado',   label: 'Cancelar',               icon: <Ban size={13} />,           variant: 'ghost'   },
    ],
    en_revision: [
      { to: 'autorizado', label: 'Aprobar',  icon: <CheckCircle2 size={13} />, variant: 'success' },
      { to: 'rechazado',  label: 'Rechazar', icon: <XCircle size={13} />,      variant: 'danger'  },
      { to: 'cancelado',  label: 'Cancelar', icon: <Ban size={13} />,          variant: 'ghost'   },
    ],
    autorizado: [
      { to: 'completado', label: 'Marcar como completado', icon: <Flag size={13} />,       variant: 'success' },
      { to: 'cancelado',  label: 'Cancelar',               icon: <Ban size={13} />,        variant: 'ghost'   },
    ],
    rechazado: [
      { to: 'en_revision', label: 'Corregir y reenviar', icon: <SendHorizonal size={13} />, variant: 'primary' },
      { to: 'cancelado',   label: 'Cancelar',            icon: <Ban size={13} />,           variant: 'ghost'   },
    ],
    cancelado: [
      { to: 'borrador', label: 'Reabrir proyecto', icon: <RotateCcw size={13} />, variant: 'ghost' },
    ],
  },
}

const ACTION_BTN: Record<ActionVariant, string> = {
  primary: 'bg-sky-600 hover:bg-sky-500 text-white',
  success: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  danger:  'bg-red-600 hover:bg-red-500 text-white',
  ghost:   'bg-app-card hover:bg-app-raised text-app-text2 border border-app-line2',
}

// ─── StatusActions ────────────────────────────────────────────────────────────

function StatusActions({
  projectId,
  current,
  userRole,
}: {
  projectId: string
  current: ProjectStatus
  userRole: string
}) {
  const qc = useQueryClient()
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null)

  const mutation = useMutation({
    mutationFn: (newStatus: ProjectStatus) => {
      setPendingStatus(newStatus)
      return projectsApi.update(projectId, { status: newStatus })
    },
    onSuccess: (_, newStatus) => {
      qc.invalidateQueries({ queryKey: ['project', projectId] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      setPendingStatus(null)
      toast.success(`Estado actualizado → ${STATUS_LABEL[newStatus]}`)
    },
    onError: (e: any) => {
      setPendingStatus(null)
      const msg = e?.response?.data?.detail ?? 'Error al actualizar el estado'
      toast.error(msg)
    },
  })

  // Calcular rol efectivo para las transiciones
  const effectiveRole = userRole === 'admin' ? 'admin'
    : userRole === 'autorizador' ? 'autorizador'
    : 'creador'

  const actions = STATUS_ACTIONS_BY_ROLE[effectiveRole]?.[current] ?? []

  return (
    <div className="flex items-center gap-2 flex-wrap mt-1.5">
      {/* Badge de estado actual */}
      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLOR[current]}`}>
        {STATUS_LABEL[current]}
      </span>

      {/* Descripción del estado */}
      <span className="text-xs text-app-muted hidden sm:inline">— {STATUS_DESC[current]}</span>

      {/* Botones de acción */}
      {actions.length > 0 && (
        <>
          <span className="text-app-faint text-xs mx-0.5">·</span>
          {actions.map((action) => (
            <button
              key={action.to}
              onClick={() => mutation.mutate(action.to)}
              disabled={mutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${ACTION_BTN[action.variant]}`}
            >
              {mutation.isPending && pendingStatus === action.to
                ? <Loader2 size={12} className="animate-spin" />
                : action.icon
              }
              {action.label}
            </button>
          ))}
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
  const user = useAuthStore((s) => s.user)

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
          <h2 className="text-xl font-semibold text-app-text">{project.name}</h2>
          {/* ① ESTADO + ACCIONES según rol */}
          <StatusActions
            projectId={project.id}
            current={project.status as ProjectStatus}
            userRole={user?.role ?? 'creador'}
          />
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
