import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff, X, AlertTriangle, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { usersApi, type UserCreate } from '../api/users'
import { useAuthStore } from '../store/useAuthStore'
import type { User, UserRole } from '../types'

export default function AdminUsersPage() {
  const { isAdmin } = useAuthStore()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [toDelete, setToDelete] = useState<User | null>(null)

  if (!isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-app-muted">
        <ShieldAlert size={48} className="mb-4 opacity-40" />
        <p className="text-base font-medium text-app-text2">Acceso restringido</p>
        <p className="text-sm mt-1">Esta página es solo para administradores.</p>
      </div>
    )
  }

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Usuario eliminado')
      setToDelete(null)
    },
    onError: () => toast.error('No se pudo eliminar el usuario'),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      usersApi.update(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })

  const ROLE_LABEL: Record<UserRole, string> = {
    admin: 'Admin',
    autorizador: 'Autorizador',
    creador: 'Creador',
  }
  const ROLE_COLOR: Record<UserRole, string> = {
    admin:       'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
    autorizador: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    creador:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-app-text">Usuarios</h2>
          <p className="text-sm text-app-muted">
            {users.filter((u) => u.active).length} activos de {users.length} total
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true) }}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      <div className="bg-app-canvas rounded-xl border border-app-line overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-app-muted">
            <Loader2 size={22} className="animate-spin mr-2" />
            Cargando...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-app-line text-app-muted text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3">Usuario</th>
                <th className="text-left px-4 py-3">Rol</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-app-line last:border-0 hover:bg-app-card group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-300 uppercase">
                          {u.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-app-text">{u.name}</p>
                        <p className="text-xs text-app-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLOR[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate({ id: u.id, active: !u.active })}
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                        u.active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                          : 'bg-app-card text-app-muted hover:bg-app-raised'
                      }`}
                    >
                      {u.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditing(u); setShowModal(true) }}
                        className="p-1.5 rounded text-app-muted hover:text-sky-500 hover:bg-sky-500/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setToDelete(u)}
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

      {showModal && (
        <UserModal
          user={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['users'] })
            setShowModal(false)
          }}
        />
      )}

      {toDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-app-canvas border border-app-line2 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-app-text">Eliminar usuario</h3>
                <p className="text-sm text-app-muted">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-app-text2 text-sm mb-6">
              ¿Eliminar a <span className="font-semibold text-app-text">"{toDelete.name}"</span>?
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setToDelete(null)} className="px-4 py-2 rounded-lg text-app-text2 hover:bg-app-card text-sm">
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

function UserModal({
  user,
  onClose,
  onSaved,
}: {
  user: User | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: (user?.role ?? 'creador') as UserRole,
  })
  const [showPass, setShowPass] = useState(false)

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        const payload: Parameters<typeof usersApi.update>[1] = {
          name: form.name,
          email: form.email,
          role: form.role,
        }
        if (form.password) payload.password = form.password
        return usersApi.update(user.id, payload)
      }
      return usersApi.create(form as UserCreate)
    },
    onSuccess: () => {
      toast.success(user ? 'Usuario actualizado' : 'Usuario creado')
      onSaved()
    },
    onError: () => toast.error('Error al guardar el usuario'),
  })

  const ROLES: UserRole[] = ['admin', 'autorizador', 'creador']

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-app-canvas border border-app-line2 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-app-line">
          <h3 className="font-semibold text-app-text">{user ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <button onClick={onClose} className="text-app-muted hover:text-app-text"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Nombre</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full bg-app-card border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-sky-500"
              placeholder="Nombre completo"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full bg-app-card border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-sky-500"
              placeholder="usuario@empresa.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-1">
              {user ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full bg-app-card border border-app-line2 rounded-lg px-3 py-2 pr-10 text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-sky-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-text"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-app-muted mb-2">Rol</label>
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors capitalize ${
                    form.role === r
                      ? 'bg-sky-500 text-white'
                      : 'bg-app-card text-app-muted hover:bg-app-raised'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-app-line">
          <button onClick={onClose} className="px-4 py-2 text-sm text-app-text2 hover:bg-app-card rounded-lg">
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name || !form.email || (!user && !form.password)}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-sm font-medium rounded-lg flex items-center gap-2"
          >
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {user ? 'Guardar' : 'Crear usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}
