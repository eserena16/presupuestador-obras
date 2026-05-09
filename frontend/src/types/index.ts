// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'autorizador' | 'creador'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: User
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectStatus = 'borrador' | 'en_revision' | 'autorizado' | 'rechazado' | 'completado' | 'cancelado'

export interface Project {
  id: string
  name: string
  description: string | null
  location: string | null
  client: string | null
  surface_m2: number
  obra_type: string | null
  currency: string
  status: ProjectStatus
  owner_id: string
  supervisor_id: string | null
  active_version_id: string | null
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  description?: string
  location?: string
  client?: string
  surface_m2?: number
  obra_type?: string
  currency?: string
  status?: ProjectStatus
}

// ─── Budget ───────────────────────────────────────────────────────────────────

export type AuthStatus = 'borrador' | 'pendiente' | 'autorizado' | 'rechazado'

export interface BudgetVersion {
  id: string
  project_id: string
  name: string
  description: string | null
  auth_status: AuthStatus
  auth_comment: string | null
  authorized_by: string | null
  authorized_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Rubro {
  id: string
  version_id: string
  name: string
  color: string
  order: number
  created_at: string
  updated_at: string
}

export interface BudgetLine {
  id: string
  rubro_id: string
  catalog_item_id: string | null
  description: string
  unit: string
  quantity: number
  unit_price: number
  currency: string
  notes: string | null
  order: number
  subtotal: number
  created_at: string
  updated_at: string
}

// ─── Providers ────────────────────────────────────────────────────────────────

export interface Provider {
  id: string
  name: string
  rut: string | null
  phone: string | null
  email: string | null
  category: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ProviderCreate {
  name: string
  rut?: string
  phone?: string
  email?: string
  category?: string
  notes?: string
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

export interface TrackingExpense {
  id: string
  project_id: string
  version_id: string
  rubro_id: string | null
  rubro_name: string | null
  date: string
  description: string
  category: string
  amount: number
  currency: string
  provider_id: string | null
  provider_name: string | null
  invoice_ref: string | null
  registered_by: string
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ExpenseCreate {
  rubro_id?: string
  rubro_name?: string
  date: string
  description: string
  category: string
  amount: number
  currency?: string
  provider_id?: string
  provider_name?: string
  invoice_ref?: string
  notes?: string
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  rut: string | null
  phone: string | null
  email: string | null
  address: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export interface CatalogCategory {
  id: string
  name: string
  color: string
  order: number
  created_at: string
  updated_at: string
}

export interface CatalogItem {
  id: string
  code: string
  name: string
  description: string | null
  unit: string
  unit_price: number
  currency: string
  category_id: string
  created_at: string
  updated_at: string
}
