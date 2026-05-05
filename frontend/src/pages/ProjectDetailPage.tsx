import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Activity, Loader2, FolderOpen } from 'lucide-react'
import { projectsApi } from '../api/projects'

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
        {/* Botón ir a seguimiento */}
        <button
          onClick={() => navigate(`/proyectos/${project.id}/seguimiento`)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <Activity size={16} />
          Seguimiento
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Cliente" value={project.client ?? '—'} />
        <InfoCard label="Ubicación" value={project.location ?? '—'} />
        <InfoCard label="Superficie" value={project.surface_m2 ? `${project.surface_m2} m²` : '—'} />
        <InfoCard label="Tipo de obra" value={project.obra_type?.replace(/_/g, ' ') ?? '—'} />
      </div>

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
