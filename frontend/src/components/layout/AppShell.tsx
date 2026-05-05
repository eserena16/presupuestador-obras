import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/proyectos': 'Proyectos',
  '/proveedores': 'Proveedores',
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

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center px-6 flex-shrink-0">
          <h1 className="text-sm font-semibold text-slate-100">{title}</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          <div className="max-w-7xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
