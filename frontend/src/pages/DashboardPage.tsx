import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FolderOpen, TrendingUp, Clock, CheckCircle, Plus, ArrowRight, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { projectsApi } from '../api/projects'

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

export default function DashboardPage() {
  const navigate = useNavigate()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const total     = projects.length
  const active    = projects.filter((p) => p.status === 'en_progreso').length
  const drafts    = projects.filter((p) => p.status === 'borrador').length
  const completed = projects.filter((p) => p.status === 'completado').length

  // Últimos 5 proyectos
  const recent = [...projects]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<FolderOpen size={20} className="text-sky-500" />}
          label="Total proyectos"
          value={total}
          bg="bg-sky-500/10"
        />
        <KpiCard
          icon={<TrendingUp size={20} className="text-emerald-500" />}
          label="En progreso"
          value={active}
          bg="bg-emerald-500/10"
        />
        <KpiCard
          icon={<Clock size={20} className="text-amber-500" />}
          label="Borradores"
          value={drafts}
          bg="bg-amber-500/10"
        />
        <KpiCard
          icon={<CheckCircle size={20} className="text-purple-500" />}
          label="Completados"
          value={completed}
          bg="bg-purple-500/10"
        />
      </div>

      {/* Proyectos recientes */}
      <div className="bg-app-canvas rounded-xl border border-app-line overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-app-line">
          <h3 className="text-sm font-semibold text-app-text">Proyectos recientes</h3>
          <button
            onClick={() => navigate('/proyectos')}
            className="text-xs text-sky-500 hover:text-sky-400 flex items-center gap-1 transition-colors"
          >
            Ver todos <ArrowRight size={12} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-app-muted">
            <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-app-muted">
            <FolderOpen size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No hay proyectos todavía</p>
            <button
              onClick={() => navigate('/proyectos/nuevo')}
              className="mt-3 text-sky-500 hover:text-sky-400 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Crear el primero
            </button>
          </div>
        ) : (
          <ul>
            {recent.map((p) => (
              <li
                key={p.id}
                onClick={() => navigate(`/proyectos/${p.id}`)}
                className="flex items-center gap-4 px-5 py-3.5 border-b border-app-line last:border-0 hover:bg-app-card cursor-pointer transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={16} className="text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-app-text truncate">{p.name}</p>
                  <p className="text-xs text-app-muted mt-0.5">
                    {p.client ?? '—'}
                    {p.location ? ` · ${p.location}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[p.status] ?? STATUS_COLOR.borrador}`}>
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                  <span className="text-xs text-app-faint hidden sm:block">
                    {format(new Date(p.created_at), 'dd MMM yyyy', { locale: es })}
                  </span>
                  <ArrowRight size={14} className="text-app-faint opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Botón "Nuevo proyecto" en el footer */}
        <div className="px-5 py-3 border-t border-app-line bg-app-card/50">
          <button
            onClick={() => navigate('/proyectos/nuevo')}
            className="flex items-center gap-2 text-sm text-sky-500 hover:text-sky-400 transition-colors"
          >
            <Plus size={14} /> Nuevo proyecto
          </button>
        </div>
      </div>
    </div>
  )
}

function KpiCard({
  icon, label, value, bg,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  bg: string
}) {
  return (
    <div className="bg-app-canvas border border-app-line rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>{icon}</div>
        <span className="text-xs text-app-muted font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-app-text">{value}</p>
    </div>
  )
}
