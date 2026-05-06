import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderOpen, Plus, Trash2, ArrowRight, Loader2, AlertTriangle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { projectsApi } from '../api/projects'
import type { Project } from '../types'

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

export default function ProjectsPage() {
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

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FolderOpen size={22} className="text-sky-500" />
          <div>
            <h2 className="text-lg font-semibold text-app-text">Proyectos</h2>
            <p className="text-xs text-app-muted">{projects.length} proyecto{projects.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/proyectos/nuevo')}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo proyecto
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-app-canvas rounded-xl border border-app-line overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-app-muted">
            <Loader2 size={24} className="animate-spin mr-2" /> Cargando proyectos...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-app-muted">
            <FolderOpen size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No hay proyectos todavía</p>
            <button
              onClick={() => navigate('/proyectos/nuevo')}
              className="mt-4 text-sky-500 hover:text-sky-400 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Crear el primero
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-line text-app-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Proyecto</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Cliente</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Superficie</th>
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
                  className="group border-b border-app-line last:border-0 hover:bg-app-card cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-app-text">{p.name}</div>
                    {p.location && (
                      <div className="text-xs text-app-muted mt-0.5">{p.location}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden md:table-cell">
                    {p.client ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden lg:table-cell">
                    {p.obra_type?.replace(/_/g, ' ') ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden sm:table-cell">
                    {p.surface_m2 ? `${p.surface_m2} m²` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLOR[p.status] ?? STATUS_COLOR.borrador}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-app-muted text-xs hidden sm:table-cell">
                    {format(new Date(p.created_at), 'dd MMM yyyy', { locale: es })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={(e) => { e.stopPropagation(); setToDelete(p) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      <ArrowRight size={14} className="text-app-faint opacity-0 group-hover:opacity-100 transition-opacity" />
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
          <div className="bg-app-canvas border border-app-line2 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text">Eliminar proyecto</h3>
                <p className="text-sm text-app-muted">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-app-text2 text-sm mb-6">
              ¿Estás seguro de que querés eliminar{' '}
              <span className="font-semibold text-app-text">"{toDelete.name}"</span>?
              Se eliminarán todos los presupuestos y gastos asociados.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setToDelete(null)}
                className="px-4 py-2 rounded-lg text-app-text2 hover:bg-app-card text-sm transition-colors"
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
