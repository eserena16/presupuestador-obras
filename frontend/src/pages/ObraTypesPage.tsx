import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Settings2, Plus, Trash2, Pencil, Loader2, X, AlertTriangle,
  ChevronUp, ChevronDown, GripVertical, Check,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { obraTypesApi, type ObraTypeConfig, type ObraTypeRubro } from '../api/obraTypes'

// ─── Constants ───────────────────────────────────────────────────────────────

const RUBRO_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#6366f1', '#d97706', '#dc2626', '#7c3aed', '#0891b2',
  '#65a30d', '#0ea5e9', '#a855f7', '#f43f5e', '#78716c',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  key: string
  label: string
  description: string
  active: boolean
  order: number
  rubros: ObraTypeRubro[]
}

const EMPTY_FORM: FormState = {
  key: '',
  label: '',
  description: '',
  active: true,
  order: 0,
  rubros: [],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextColor(rubros: ObraTypeRubro[]): string {
  return RUBRO_COLORS[rubros.length % RUBRO_COLORS.length]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColorDot({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ backgroundColor: color }}
      className={`w-6 h-6 rounded-full flex-shrink-0 transition-transform hover:scale-110 ${
        selected ? 'ring-2 ring-white ring-offset-1 ring-offset-app-canvas scale-110' : ''
      }`}
      title={color}
    />
  )
}

function RubroEditor({
  rubros,
  onChange,
}: {
  rubros: ObraTypeRubro[]
  onChange: (next: ObraTypeRubro[]) => void
}) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(nextColor(rubros))
  const [showPicker, setShowPicker] = useState<number | 'new' | null>(null)

  const addRubro = () => {
    const name = newName.trim()
    if (!name) return
    const next = [...rubros, { name, color: newColor }]
    onChange(next)
    setNewName('')
    setNewColor(nextColor(next))
    setShowPicker(null)
  }

  const removeRubro = (i: number) => onChange(rubros.filter((_, idx) => idx !== i))

  const moveUp = (i: number) => {
    if (i === 0) return
    const next = [...rubros]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }

  const moveDown = (i: number) => {
    if (i === rubros.length - 1) return
    const next = [...rubros]
    ;[next[i], next[i + 1]] = [next[i + 1], next[i]]
    onChange(next)
  }

  const setRubroColor = (i: number, color: string) => {
    const next = rubros.map((r, idx) => (idx === i ? { ...r, color } : r))
    onChange(next)
    setShowPicker(null)
  }

  const updateRubroName = (i: number, name: string) => {
    onChange(rubros.map((r, idx) => (idx === i ? { ...r, name } : r)))
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-app-muted uppercase tracking-wider">
          Rubros base ({rubros.length})
        </p>
      </div>

      {/* Lista de rubros */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {rubros.length === 0 && (
          <p className="text-xs text-app-faint italic py-2 text-center">
            Todavía no hay rubros — agregá el primero abajo
          </p>
        )}
        {rubros.map((r, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-app-card border border-app-line rounded-lg px-2 py-1.5 group"
          >
            <GripVertical size={14} className="text-app-faint flex-shrink-0 cursor-grab" />

            {/* Color dot with picker */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowPicker(showPicker === i ? null : i)}
                style={{ backgroundColor: r.color }}
                className="w-5 h-5 rounded-full hover:ring-2 hover:ring-white transition"
                title="Cambiar color"
              />
              {showPicker === i && (
                <div className="absolute left-0 top-7 z-20 bg-app-canvas border border-app-line2 rounded-xl p-2 shadow-xl grid grid-cols-5 gap-1.5 w-40">
                  {RUBRO_COLORS.map((c) => (
                    <ColorDot
                      key={c}
                      color={c}
                      selected={c === r.color}
                      onClick={() => setRubroColor(i, c)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Name input */}
            <input
              value={r.name}
              onChange={(e) => updateRubroName(i, e.target.value)}
              className="flex-1 bg-transparent text-sm text-app-text2 outline-none min-w-0"
            />

            {/* Reorder + delete */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="p-0.5 rounded text-app-muted hover:text-sky-400 disabled:opacity-30"
              >
                <ChevronUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === rubros.length - 1}
                className="p-0.5 rounded text-app-muted hover:text-sky-400 disabled:opacity-30"
              >
                <ChevronDown size={13} />
              </button>
              <button
                type="button"
                onClick={() => removeRubro(i)}
                className="p-0.5 rounded text-app-muted hover:text-red-500"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add new rubro */}
      <div className="flex items-center gap-2 bg-app-card border border-app-line2 rounded-lg px-2 py-1.5">
        {/* New color */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowPicker(showPicker === 'new' ? null : 'new')}
            style={{ backgroundColor: newColor }}
            className="w-5 h-5 rounded-full hover:ring-2 hover:ring-white transition"
            title="Elegir color"
          />
          {showPicker === 'new' && (
            <div className="absolute left-0 top-7 z-20 bg-app-canvas border border-app-line2 rounded-xl p-2 shadow-xl grid grid-cols-5 gap-1.5 w-40">
              {RUBRO_COLORS.map((c) => (
                <ColorDot
                  key={c}
                  color={c}
                  selected={c === newColor}
                  onClick={() => { setNewColor(c); setShowPicker(null) }}
                />
              ))}
            </div>
          )}
        </div>

        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRubro())}
          placeholder="Nombre del nuevo rubro..."
          className="flex-1 bg-transparent text-sm text-app-text2 placeholder-app-faint outline-none min-w-0"
        />
        <button
          type="button"
          onClick={addRubro}
          disabled={!newName.trim()}
          className="flex-shrink-0 p-1 rounded text-sky-500 hover:bg-sky-500/10 disabled:opacity-30 transition-colors"
          title="Agregar rubro"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ObraTypesPage() {
  const qc = useQueryClient()

  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<ObraTypeConfig | null>(null)
  const [toDelete, setToDelete]   = useState<ObraTypeConfig | null>(null)
  const [form, setForm]           = useState<FormState>(EMPTY_FORM)

  const { data: types = [], isLoading } = useQuery({
    queryKey: ['obraTypes'],
    queryFn: () => obraTypesApi.list(false),
  })

  // ── Mutations ──
  const createMutation = useMutation({
    mutationFn: () => obraTypesApi.create({
      key: form.key.toUpperCase().trim(),
      label: form.label.trim(),
      description: form.description.trim() || undefined,
      active: form.active,
      order: form.order,
      rubros: form.rubros,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obraTypes'] })
      toast.success('Tipo de obra creado')
      closeForm()
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail ?? 'Error al crear'
      toast.error(msg)
    },
  })

  const updateMutation = useMutation({
    mutationFn: () => obraTypesApi.update(editing!.id, {
      key: form.key.toUpperCase().trim(),
      label: form.label.trim(),
      description: form.description.trim() || undefined,
      active: form.active,
      order: form.order,
      rubros: form.rubros,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obraTypes'] })
      toast.success('Tipo de obra actualizado')
      closeForm()
    },
    onError: () => toast.error('Error al actualizar'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      obraTypesApi.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['obraTypes'] }),
    onError: () => toast.error('Error al cambiar estado'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => obraTypesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['obraTypes'] })
      toast.success('Tipo de obra eliminado')
      setToDelete(null)
    },
    onError: () => toast.error('Sin permisos o error al eliminar'),
  })

  // ── Handlers ──
  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM, order: types.length + 1 })
    setShowForm(true)
  }

  const openEdit = (t: ObraTypeConfig) => {
    setEditing(t)
    setForm({
      key:         t.key,
      label:       t.label,
      description: t.description ?? '',
      active:      t.active,
      order:       t.order,
      rubros:      [...(t.rubros ?? [])],
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null) }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.key.trim() || !form.label.trim()) return
    editing ? updateMutation.mutate() : createMutation.mutate()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const inputCls =
    'w-full bg-app-canvas border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text2 placeholder-app-muted focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors'

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings2 size={22} className="text-violet-500" />
          <div>
            <h2 className="text-lg font-semibold text-app-text">Tipos de Obra</h2>
            <p className="text-xs text-app-muted">
              {types.length} tipos configurados · rubros base por tipo para presupuesto e IA
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo tipo
        </button>
      </div>

      {/* Table */}
      <div className="bg-app-canvas rounded-xl border border-app-line overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-app-muted">
            <Loader2 size={22} className="animate-spin mr-2" /> Cargando tipos de obra...
          </div>
        ) : types.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-app-muted">
            <Settings2 size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No hay tipos de obra configurados</p>
            <button
              onClick={openCreate}
              className="mt-3 text-violet-500 hover:text-violet-400 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-line text-app-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 w-10">#</th>
                <th className="text-left px-4 py-3">Clave</th>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Descripción</th>
                <th className="text-left px-4 py-3">Rubros</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {[...types].sort((a, b) => a.order - b.order).map((t) => (
                <tr
                  key={t.id}
                  className="group border-b border-app-line last:border-0 hover:bg-app-card transition-colors"
                >
                  <td className="px-4 py-3 text-app-muted text-xs">{t.order}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-app-card border border-app-line px-1.5 py-0.5 rounded text-violet-600 dark:text-violet-400 font-mono">
                      {t.key}
                    </code>
                  </td>
                  <td className="px-4 py-3 font-medium text-app-text">{t.label}</td>
                  <td className="px-4 py-3 text-app-muted hidden lg:table-cell text-xs max-w-xs truncate">
                    {t.description || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      {(t.rubros ?? []).slice(0, 6).map((r, i) => (
                        <span
                          key={i}
                          style={{ backgroundColor: r.color + '33', color: r.color, borderColor: r.color + '66' }}
                          className="inline-block text-xs px-1.5 py-0.5 rounded border font-medium leading-tight"
                        >
                          {r.name.length > 18 ? r.name.slice(0, 17) + '…' : r.name}
                        </span>
                      ))}
                      {(t.rubros ?? []).length > 6 && (
                        <span className="text-xs text-app-faint">
                          +{(t.rubros ?? []).length - 6} más
                        </span>
                      )}
                      {(t.rubros ?? []).length === 0 && (
                        <span className="text-xs text-app-faint italic">Sin rubros</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: t.id, active: !t.active })}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        t.active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {t.active ? <><Check size={10} /> Activo</> : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded text-app-muted hover:text-violet-500 hover:bg-violet-500/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setToDelete(t)}
                        className="p-1.5 rounded text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-app-canvas border border-app-line2 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-app-line">
              <h3 className="font-semibold text-app-text">
                {editing ? `Editar: ${editing.label}` : 'Nuevo tipo de obra'}
              </h3>
              <button
                onClick={closeForm}
                className="text-app-faint hover:text-app-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Row: key + order */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-app-muted mb-1.5">
                      Clave interna * <span className="text-app-faint font-normal">(única, ej: VIVIENDA_UNIFAMILIAR)</span>
                    </label>
                    <input
                      autoFocus
                      value={form.key}
                      onChange={(e) => setForm((f) => ({ ...f, key: e.target.value.toUpperCase().replace(/\s/g, '_') }))}
                      placeholder="VIVIENDA_UNIFAMILIAR"
                      className={`${inputCls} font-mono`}
                      required
                      disabled={!!editing}   // key is immutable once set
                    />
                    {editing && (
                      <p className="text-xs text-app-faint mt-1">La clave no se puede cambiar después de crear el tipo</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-app-muted mb-1.5">Orden</label>
                    <input
                      type="number"
                      min={0}
                      value={form.order}
                      onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                      className={inputCls}
                    />
                  </div>
                </div>

                {/* Label */}
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1.5">
                    Nombre para mostrar *
                  </label>
                  <input
                    value={form.label}
                    onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    placeholder="Vivienda Unifamiliar"
                    className={inputCls}
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1.5">Descripción</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Descripción breve del tipo de obra..."
                    className={`${inputCls} resize-none`}
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                    className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                      form.active ? 'bg-emerald-500' : 'bg-app-line2'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        form.active ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-app-text2">
                    {form.active ? 'Activo — visible al crear proyectos' : 'Inactivo — oculto'}
                  </span>
                </div>

                {/* Divider */}
                <hr className="border-app-line" />

                {/* Rubros editor */}
                <RubroEditor
                  rubros={form.rubros}
                  onChange={(next) => setForm((f) => ({ ...f, rubros: next }))}
                />
              </div>

              {/* Footer */}
              <div className="border-t border-app-line px-6 py-4 flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-app-text2 hover:bg-app-card rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !form.key.trim() || !form.label.trim()}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear tipo de obra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-app-canvas border border-app-line2 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text">Eliminar tipo de obra</h3>
                <p className="text-sm text-app-muted">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-app-text2 text-sm mb-6">
              ¿Estás seguro de que querés eliminar{' '}
              <span className="font-semibold text-app-text">"{toDelete.label}"</span>
              {' '}(<code className="text-xs font-mono text-violet-500">{toDelete.key}</code>)?
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
