import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderOpen, TrendingUp, Clock, Plus, Trash2, ArrowRight, Loader2, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { projectsApi } from '../api/projects'
import type { Project } from '../types'

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  en_progreso: 'En progreso',
  pausado: 'Pausado',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  borrador: 'bg-slate-700 text-slate-300',
  en_progreso: 'bg-blue-500/20 text-blue-300',
  pausado: 'bg-amber-500/20 text-amber-300',
  completado: 'bg-emerald-500/20 text-emerald-300',
  cancelado: 'bg-red-500/20 text-red-300',
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [toDelete, setToDelete] = useState<Project | null>(null)

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Proyecto eliminado')
      setToDelete(null)
    },
    onError: () => toast.error('No se pudo eliminar el proyecto'),
  })

  const active = projects.filter((p) => p.status === 'en_progreso').length
  const total = projects.length
  const totalBudget = 0 // TODO: sumar presupuestos

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<FolderOpen size={20} className="text-blue-400" />}
          label="Total proyectos"
          value={total}
          bg="bg-blue-500/10"
        />
        <KpiCard
          icon={<TrendingUp size={20} className="text-emerald-400" />}
          label="En progreso"
          value={active}
          bg="bg-emerald-500/10"
        />
        <KpiCard
          icon={<Clock size={20} className="text-amber-400" />}
          label="Borradores"
          value={projects.filter((p) => p.status === 'borrador').length}
          bg="bg-amber-500/10"
        />
        <KpiCard
          icon={<FolderOpen size={20} className="text-purple-400" />}
          label="Completados"
          value={projects.filter((p) => p.status === 'completado').length}
          bg="bg-purple-500/10"
        />
      </div>

      {/* Header + botón nuevo */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">Proyectos</h2>
        <button
          onClick={() => navigate('/proyectos/nuevo')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} />
          Nuevo proyecto
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" />
            Cargando proyectos...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <FolderOpen size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No hay proyectos todavía</p>
            <button
              onClick={() => navigate('/proyectos/nuevo')}
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Crear el primero
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Proyecto</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Tipo</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Creado</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/proyectos/${p.id}`)}
                  className="group border-b border-slate-800/50 last:border-0 hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-100">{p.name}</div>
                    {p.location && (
                      <div className="text-xs text-slate-500 mt-0.5">{p.location}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                    {p.client ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">
                    {p.obra_type ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        STATUS_COLOR[p.status] ?? 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden sm:table-cell">
                    {format(new Date(p.created_at), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setToDelete(p)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ArrowRight size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal confirmar borrado */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Eliminar proyecto</h3>
                <p className="text-sm text-slate-400">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-slate-300 text-sm mb-6">
              ¿Estás seguro de que querés eliminar{' '}
              <span className="font-semibold text-white">"{toDelete.name}"</span>?
              Se eliminarán todos los presupuestos y gastos asociados.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setToDelete(null)}
                className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-800 text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(toDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-60"
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}
