import { useState, FormEvent } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, Plus, Trash2, Pencil, Loader2, X, AlertTriangle, Check,
  Phone, Mail, MapPin, Hash,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { clientsApi, type ClientCreate } from '../api/clients'
import type { Client } from '../types'

const EMPTY_FORM: ClientCreate = {
  name: '',
  rut: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
}

export default function ClientsPage() {
  const qc = useQueryClient()

  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Client | null>(null)
  const [toDelete, setToDelete]   = useState<Client | null>(null)
  const [form, setForm]           = useState<ClientCreate>(EMPTY_FORM)

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientsApi.list(false),   // traer todos (incluir inactivos)
  })

  const createMutation = useMutation({
    mutationFn: () => clientsApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente creado')
      closeForm()
    },
    onError: () => toast.error('Error al crear el cliente'),
  })

  const updateMutation = useMutation({
    mutationFn: () => clientsApi.update(editing!.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente actualizado')
      closeForm()
    },
    onError: () => toast.error('Error al actualizar el cliente'),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      clientsApi.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
    onError: () => toast.error('Error al actualizar estado'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] })
      toast.success('Cliente eliminado')
      setToDelete(null)
    },
    onError: () => toast.error('Sin permisos o error al eliminar'),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (c: Client) => {
    setEditing(c)
    setForm({
      name:    c.name,
      rut:     c.rut    ?? '',
      phone:   c.phone  ?? '',
      email:   c.email  ?? '',
      address: c.address ?? '',
      notes:   c.notes  ?? '',
    })
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null) }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    editing ? updateMutation.mutate() : createMutation.mutate()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  const inputCls =
    'w-full bg-app-canvas border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text2 placeholder-app-muted focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors'

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={22} className="text-sky-500" />
          <div>
            <h2 className="text-lg font-semibold text-app-text">Clientes</h2>
            <p className="text-xs text-app-muted">{clients.length} registros</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo cliente
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-app-canvas rounded-xl border border-app-line overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-app-muted">
            <Loader2 size={22} className="animate-spin mr-2" /> Cargando clientes...
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-app-muted">
            <Users size={36} className="mb-3 opacity-30" />
            <p className="text-sm">No hay clientes registrados</p>
            <button
              onClick={openCreate}
              className="mt-3 text-sky-500 hover:text-sky-400 text-sm flex items-center gap-1"
            >
              <Plus size={14} /> Agregar el primero
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-line text-app-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">RUT</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Teléfono</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr
                  key={c.id}
                  className="group border-b border-app-line last:border-0 hover:bg-app-card transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-app-text">{c.name}</div>
                    {c.address && (
                      <div className="text-xs text-app-muted mt-0.5 flex items-center gap-1">
                        <MapPin size={10} /> {c.address}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden md:table-cell">
                    {c.rut ? (
                      <span className="flex items-center gap-1"><Hash size={12} /> {c.rut}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden lg:table-cell">
                    {c.phone ? (
                      <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-app-muted hidden lg:table-cell">
                    {c.email ? (
                      <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActiveMutation.mutate({ id: c.id, active: !c.active })}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        c.active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600'
                      }`}
                    >
                      {c.active ? <><Check size={10} /> Activo</> : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(c)}
                        className="p-1.5 rounded text-app-muted hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setToDelete(c)}
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

      {/* Modal crear / editar */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-app-canvas border border-app-line2 rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-app-text">
                {editing ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <button
                onClick={closeForm}
                className="text-app-faint hover:text-app-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1.5">
                  Nombre *
                </label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre completo o razón social"
                  className={inputCls}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* RUT */}
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1.5">RUT</label>
                  <input
                    value={form.rut}
                    onChange={(e) => setForm((f) => ({ ...f, rut: e.target.value }))}
                    placeholder="12.345.678-9"
                    className={inputCls}
                  />
                </div>
                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-medium text-app-muted mb-1.5">Teléfono</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+598 99 000 000"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className={inputCls}
                />
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1.5">Dirección</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="Calle 1234, Montevideo"
                  className={inputCls}
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-medium text-app-muted mb-1.5">Notas</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones opcionales..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 text-sm text-app-text2 hover:bg-app-card rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !form.name.trim()}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {isPending && <Loader2 size={14} className="animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar borrado */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-app-canvas border border-app-line2 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text">Eliminar cliente</h3>
                <p className="text-sm text-app-muted">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-app-text2 text-sm mb-6">
              ¿Estás seguro de que querés eliminar{' '}
              <span className="font-semibold text-app-text">"{toDelete.name}"</span>?
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
