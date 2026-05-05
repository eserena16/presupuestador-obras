import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderOpen,
  Truck,
  Users,
  LogOut,
  HardHat,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

interface NavItem {
  to: string
  icon: React.ReactNode
  label: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/proyectos', icon: <FolderOpen size={18} />, label: 'Proyectos' },
  { to: '/catalogo', icon: <BookOpen size={18} />, label: 'Catálogo' },
  { to: '/proveedores', icon: <Truck size={18} />, label: 'Proveedores' },
  {
    to: '/admin/usuarios',
    icon: <Users size={18} />,
    label: 'Usuarios',
    adminOnly: true,
  },
]

export function Sidebar() {
  const { user, logout, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    autorizador: 'Autorizador',
    creador: 'Creador',
  }

  const roleBadge: Record<string, string> = {
    admin: 'bg-blue-500/20 text-blue-300',
    autorizador: 'bg-amber-500/20 text-amber-300',
    creador: 'bg-emerald-500/20 text-emerald-300',
  }

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col bg-slate-900 border-r border-slate-800 h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
          <HardHat size={20} className="text-white" />
        </div>
        <div>
          <p className="font-semibold text-white text-sm leading-tight">ST Arquitectos</p>
          <p className="text-xs text-slate-400 leading-tight">Presupuestador v2</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin()) return null
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              {item.icon}
              {item.label}
              <ChevronRight size={14} className="ml-auto opacity-40" />
            </NavLink>
          )
        })}
      </nav>

      {/* Footer: usuario */}
      <div className="border-t border-slate-800 p-4 space-y-3">
        {user && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-600/50 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-300 text-xs font-bold uppercase">
                {user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">{user.name}</p>
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  roleBadge[user.role] ?? 'bg-slate-700 text-slate-300'
                }`}
              >
                {roleLabel[user.role] ?? user.role}
              </span>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
