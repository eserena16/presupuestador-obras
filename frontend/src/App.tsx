import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { AppShell } from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectFormPage from './pages/ProjectFormPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import TrackingPage from './pages/TrackingPage'
import ProvidersPage from './pages/ProvidersPage'
import AdminUsersPage from './pages/AdminUsersPage'
import CatalogPage from './pages/CatalogPage'
import ClientsPage from './pages/ClientsPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated())
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      {/* Ruta pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rutas protegidas */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="proyectos" element={<ProjectsPage />} />
        <Route path="proyectos/nuevo" element={<ProjectFormPage />} />
        <Route path="proyectos/:id" element={<ProjectDetailPage />} />
        <Route path="proyectos/:id/seguimiento" element={<TrackingPage />} />
        <Route path="clientes" element={<ClientsPage />} />
        <Route path="proveedores" element={<ProvidersPage />} />
        <Route path="admin/usuarios" element={<AdminUsersPage />} />
        <Route path="catalogo" element={<CatalogPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
