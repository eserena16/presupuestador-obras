import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Pencil, Trash2, Loader2, Truck, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { providersApi } from '../api/providers'
import type { Provider, ProviderCreate } from '../types'

const CATEGORIES = ['Materiales', 'Mano de obra', 'Equipos', 'Transporte', 'Servicios', 'Otro']

export default function ProvidersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [toDelete, setToDelete] = useState<Provider | null>(null)

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providersApi.list(false),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => providersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] })
      toast.success('Proveedor eliminado')
      setToDelete(null)
    },
    onError: () => toast.error('No se pudo eliminar el proveedor'),
  })

  const filtered = providers.filter((p) => {
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      (p.category?.toLowerCase().includes(q) ?? false) ||
      (p.rut?.toLowerCase().includes(q) ?? false)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-app-text">Proveedores</h2>
          <p className="text-sm text-app-muted">
            {providers.filter((p) => p.active).length} activos de {providers.length} total
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo proveedor
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, categoría o RUT..."
          className="w-full bg-app-card border border-app-line2 rounded-lg pl-9 pr-4 py-2 text-sm text-app-text2 placeholder-app-muted focus:outline-none focus:border-sky-500"
        />
      </div>

      {/* Tabla */}
      <div className="bg-app-canvas rounded-xl border border-app-line overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-app-muted">
            <Loader2 size={22} className="animate-spin mr-2" />
            Cargando...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-app-muted">
            <Truck size={36} className="mb-3 opacity-30" />
            <p className="text-sm">
              {search ? 'Sin resultados para esa búsqueda' : 'No hay proveedores aún'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-line text-app-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">RUT</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-20" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-app-line last:border-0 hover:bg-app-card group">
                  <td className="px-4 py-3">
                    <p className="font-medium text-app-text">{p.name}</p>
                    {p.email && <p className="text-xs text-app-muted">{p.email}</p>}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden md:table-cell">
                    {p.category ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden lg:table-cell">
                    {p.rut ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden lg:table-cell">
                    {p.phone ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      p.active
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-app-card text-app-muted'
                    }`}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditing(p); setShowModal(true) }}
                        className="p-1.5 rounded text-app-muted hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setToDelete(p)}
                        className="p-1.5 rounded text-app-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
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

      {/* Modal editar/crear */}
      {showModal && (
        <ProviderModal
          provider={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['providers'] })
            setShowModal(false)
          }}
        />
      )}

      {/* Modal confirmar borrado */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-app-canvas border border-app-line2 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text">Eliminar proveedor</h3>
                <p className="text-sm text-app-muted">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-app-text2 text-sm mb-6">
              ¿Eliminar a <span className="font-semibold text-app-text">"{toDelete.name}"</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setToDelete(null)}
                className="px-4 py-2 rounded-lg text-app-text2 hover:bg-app-card text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate(toDelete.id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium flex items-center gap-2 disabled:opacity-60"
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

// ─── Modal ────────────────────────────────────────────────────────────────────

function ProviderModal({
  provider,
  onClose,
  onSaved,
}: {
  provider: Provider | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<ProviderCreate & { active: boolean }>({
    name: provider?.name ?? '',
    rut: provider?.rut ?? '',
    phone: provider?.phone ?? '',
    email: provider?.email ?? '',
    category: provider?.category ?? '',
    notes: provider?.notes ?? '',
    active: provider?.active ?? true,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        rut: form.rut || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        category: form.category || undefined,
        notes: form.notes || undefined,
        active: form.active,
      }
      if (provider) {
        return providersApi.update(provider.id, payload)
      }
      return providersApi.create(payload)
    },
    onSuccess: () => {
      toast.success(provider ? 'Proveedor actualizado' : 'Proveedor creado')
      onSaved()
    },
    onError: () => toast.error('Error al guardar'),
  })

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-app-canvas border border-app-line2 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-line">
          <h3 className="font-semibold text-app-text">
            {provider ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h3>
          <button onClick={onClose} className="text-app-muted hover:text-app-text">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Nombre *">
            <input
              value={form.name}
              onChange={set('name')}
              placeholder="Nombre del proveedor"
              className={inputCls}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="RUT">
              <input value={form.rut} onChange={set('rut')} placeholder="12.345.678-9" className={inputCls} />
            </Field>
            <Field label="Teléfono">
              <input value={form.phone} onChange={set('phone')} placeholder="+56 9 1234 5678" className={inputCls} />
            </Field>
          </div>

          <Field label="Email">
            <input value={form.email} onChange={set('email')} type="email" placeholder="proveedor@email.com" className={inputCls} />
          </Field>

          <Field label="Categoría">
            <select value={form.category} onChange={set('category')} className={inputCls}>
              <option value="">Sin categoría</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={2}
              placeholder="Observaciones..."
              className={`${inputCls} resize-none`}
            />
          </Field>

          {provider && (
            <label className="flex items-center gap-2 text-sm text-app-text3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="accent-sky-500"
              />
              Proveedor activo
            </label>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-app-line">
          <button onClick={onClose} className="px-4 py-2 text-sm text-app-text2 hover:bg-app-card rounded-lg transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name.trim()}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {provider ? 'Guardar cambios' : 'Crear proveedor'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full bg-app-card border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text2 placeholder-app-muted focus:outline-none focus:border-sky-500'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-app-muted mb-1">{label}</label>
      {children}
    </div>
  )
}
