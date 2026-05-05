import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, MapPin, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { projectsApi } from '../api/projects'
import { intendenciaApi, type PadronData } from '../api/intendencia'
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

  // Padrón catastral
  const [padronNum, setPadronNum] = useState('')
  const [padronLoading, setPadronLoading] = useState(false)
  const [padronData, setPadronData] = useState<PadronData | null>(null)
  const [padronError, setPadronError] = useState<string | null>(null)

  const set = (k: keyof ProjectCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  // Búsqueda de padrón
  const handlePadronSearch = async () => {
    if (!padronNum.trim()) return
    setPadronLoading(true)
    setPadronError(null)
    setPadronData(null)
    try {
      const data = await intendenciaApi.getPadron(padronNum.trim())
      setPadronData(data)
      // Auto-rellenar campos del formulario
      if (data.direccion) {
        const location = [data.direccion, data.barrio, 'Montevideo'].filter(Boolean).join(', ')
        setForm((f) => ({ ...f, location }))
      }
      if (data.superficie_m2 && data.superficie_m2 > 0) {
        setForm((f) => ({ ...f, surface_m2: data.superficie_m2! }))
      }
      toast.success(`Padrón ${padronNum} encontrado`)
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'No se encontraron datos para ese padrón'
      setPadronError(msg)
    } finally {
      setPadronLoading(false)
    }
  }

  const clearPadron = () => {
    setPadronData(null)
    setPadronError(null)
    setPadronNum('')
  }

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
    'w-full bg-app-card border border-app-line2 rounded-lg px-3 py-2.5 text-sm text-app-text2 placeholder-app-muted focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors'

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-lg text-app-muted hover:bg-app-card hover:text-app-text transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-app-text">Nuevo proyecto</h2>
      </div>

      {/* Padrón catastral */}
      <div className="bg-app-canvas rounded-xl border border-app-line p-5 space-y-4">
        <div className="flex items-center gap-2">
          <MapPin size={16} className="text-sky-500" />
          <h3 className="text-sm font-semibold text-app-text2">Consulta de Padrón (Intendencia de Montevideo)</h3>
          <span className="text-xs text-app-muted">— opcional</span>
        </div>
        <p className="text-xs text-app-muted">
          Ingresá el número de padrón catastral para auto-completar la dirección y superficie del predio.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={padronNum}
            onChange={(e) => setPadronNum(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePadronSearch()}
            placeholder="Ej: 123456"
            className="flex-1 bg-app-card border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text2 placeholder-app-muted focus:outline-none focus:border-sky-500"
          />
          <button
            type="button"
            onClick={handlePadronSearch}
            disabled={padronLoading || !padronNum.trim()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors"
          >
            {padronLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Search size={14} />
            )}
            Buscar
          </button>
          {(padronData || padronError) && (
            <button
              type="button"
              onClick={clearPadron}
              className="p-2 text-app-muted hover:text-app-text hover:bg-app-card rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Error padrón */}
        {padronError && (
          <p className="text-xs text-red-500 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {padronError}
          </p>
        )}

        {/* Resultado padrón */}
        {padronData && (
          <div className="bg-app-card border border-app-line2 rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-app-text3 mb-3">
              Datos del padrón {padronData.padron}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {padronData.direccion && (
                <div>
                  <span className="text-app-muted">Dirección</span>
                  <p className="text-app-text2 font-medium">{padronData.direccion}</p>
                </div>
              )}
              {padronData.barrio && (
                <div>
                  <span className="text-app-muted">Barrio</span>
                  <p className="text-app-text2 font-medium">{padronData.barrio}</p>
                </div>
              )}
              {padronData.superficie_m2 && (
                <div>
                  <span className="text-app-muted">Superficie</span>
                  <p className="text-app-text2 font-medium">{padronData.superficie_m2} m²</p>
                </div>
              )}
              {padronData.zona && (
                <div>
                  <span className="text-app-muted">Zona / CCZ</span>
                  <p className="text-app-text2 font-medium">{padronData.zona}</p>
                </div>
              )}
              {padronData.frente_m && (
                <div>
                  <span className="text-app-muted">Frente</span>
                  <p className="text-app-text2 font-medium">{padronData.frente_m} m</p>
                </div>
              )}
              {padronData.fondo_m && (
                <div>
                  <span className="text-app-muted">Fondo</span>
                  <p className="text-app-text2 font-medium">{padronData.fondo_m} m</p>
                </div>
              )}
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              Dirección y superficie auto-completados en el formulario
            </p>
          </div>
        )}
      </div>

      {/* Formulario del proyecto */}
      <form onSubmit={handleSubmit} className="bg-app-canvas rounded-xl border border-app-line p-6 space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-app-muted mb-1.5">
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
          <label className="block text-xs font-medium text-app-muted mb-1.5">Descripción</label>
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
            <label className="block text-xs font-medium text-app-muted mb-1.5">Cliente</label>
            <input value={form.client} onChange={set('client')} placeholder="Nombre del cliente" className={inputCls} />
          </div>

          {/* Ubicación */}
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1.5">Ubicación</label>
            <input value={form.location} onChange={set('location')} placeholder="Ciudad, región" className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Superficie */}
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1.5">
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
            <label className="block text-xs font-medium text-app-muted mb-1.5">Moneda</label>
            <select value={form.currency} onChange={set('currency')} className={inputCls}>
              <option value="USD">USD — Dólar</option>
              <option value="UYU">UYU — Peso uruguayo</option>
              <option value="UI">UI — Unidad Indexada</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Tipo de obra */}
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1.5">Tipo de obra</label>
            <select value={form.obra_type} onChange={set('obra_type')} className={inputCls}>
              <option value="">Sin clasificar</option>
              {OBRA_TYPES.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1.5">Estado</label>
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
            className="px-4 py-2 text-sm text-app-text2 hover:bg-app-card rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || !form.name.trim()}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Crear proyecto
          </button>
        </div>
      </form>
    </div>
  )
}
