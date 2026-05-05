import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsApi } from '../api/projects'
import type { ProjectCreate, ProjectStatus } from '../types'

const OBRA_TYPES = [
  'INDUSTRIAL', 'VIVIENDA_UNIFAMILIAR', 'EDIFICIO_MULTIFAMILIAR',
  'COMERCIAL', 'EDUCACIONAL', 'SALUD', 'OFICINAS', 'OTRO',
]

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'borrador', label: 'Borrador' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'pausado', label: 'Pausado' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
]

export default function ProjectFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState<ProjectCreate>({
    name: '',
    description: '',
    location: '',
    client: '',
    surface_m2: 0,
    obra_type: '',
    currency: 'USD',
    status: 'borrador',
  })

  const set = (k: keyof ProjectCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const createMutation = useMutation({
    mutationFn: () => projectsApi.create(form),
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Proyecto creado')
      navigate(`/proyectos/${project.id}`)
    },
    onError: () => toast.error('Error al crear el proyecto'),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    createMutation.mutate()
  }

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-slate-100">Nuevo proyecto</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 rounded-xl border border-slate-800 p-6 space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">
            Nombre del proyecto *
          </label>
          <input
            value={form.name}
            onChange={set('name')}
            placeholder="Ej: Edificio Residencial Las Palmas"
            className={inputCls}
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Descripción</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            placeholder="Descripción del proyecto..."
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Cliente */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Cliente</label>
            <input value={form.client} onChange={set('client')} placeholder="Nombre del cliente" className={inputCls} />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Ubicación</label>
            <input value={form.location} onChange={set('location')} placeholder="Ciudad, región" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Superficie */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Superficie (m²)
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.surface_m2}
              onChange={(e) =>
                setForm((f) => ({ ...f, surface_m2: parseFloat(e.target.value) || 0 }))
              }
              className={inputCls}
            />
          </div>

          {/* Moneda */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Moneda</label>
            <select value={form.currency} onChange={set('currency')} className={inputCls}>
              <option value="USD">USD — Dólar</option>
              <option value="CLP">CLP — Peso chileno</option>
              <option value="UF">UF — Unidad de fomento</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Tipo de obra */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo de obra</label>
            <select value={form.obra_type} onChange={set('obra_type')} className={inputCls}>
              <option value="">Sin clasificar</option>
              {OBRA_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Estado</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !form.name.trim()}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Crear proyecto
          </button>
        </div>
      </form>
    </div>
  )
}
