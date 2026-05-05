import { Outlet, useLocation } from 'react-router-dom'
import { Sun, Moon } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { useThemeStore } from '../../store/useThemeStore'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/proyectos': 'Proyectos',
  '/proveedores': 'Proveedores',
  '/catalogo': 'Catálogo de Ítems',
  '/admin/usuarios': 'Administración de Usuarios',
}

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/proyectos/') && pathname.includes('/seguimiento'))
    return 'Seguimiento de Obra'
  if (pathname.startsWith('/proyectos/')) return 'Detalle del Proyecto'
  return 'Presupuestador'
}

export function AppShell() {
  const location = useLocation()
  const title = getTitle(location.pathname)
  const { theme, toggleTheme } = useThemeStore()

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-app-canvas border-b border-app-line flex items-center px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-app-text flex-1">{title}</h1>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            className="p-2 rounded-lg text-app-muted hover:bg-app-card hover:text-app-text transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-app-bg">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
