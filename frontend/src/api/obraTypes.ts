import { apiClient } from './client'

export interface ObraTypeRubro {
  name: string
  color: string
}

export interface ObraTypeConfig {
  id: string
  key: string
  label: string
  description?: string
  active: boolean
  order: number
  rubros: ObraTypeRubro[]
  created_at: string
  updated_at: string
}

export interface ObraTypeCreate {
  key: string
  label: string
  description?: string
  active?: boolean
  order?: number
  rubros?: ObraTypeRubro[]
}

export interface ObraTypeUpdate {
  key?: string
  label?: string
  description?: string
  active?: boolean
  order?: number
  rubros?: ObraTypeRubro[]
}

export const obraTypesApi = {
  list: async (activeOnly = false): Promise<ObraTypeConfig[]> => {
    const { data } = await apiClient.get<ObraTypeConfig[]>('/obra-types/', {
      params: { active_only: activeOnly },
    })
    return data
  },

  getByKey: async (key: string): Promise<ObraTypeConfig> => {
    const { data } = await apiClient.get<ObraTypeConfig>(`/obra-types/key/${key}`)
    return data
  },

  get: async (id: string): Promise<ObraTypeConfig> => {
    const { data } = await apiClient.get<ObraTypeConfig>(`/obra-types/${id}`)
    return data
  },

  create: async (body: ObraTypeCreate): Promise<ObraTypeConfig> => {
    const { data } = await apiClient.post<ObraTypeConfig>('/obra-types/', body)
    return data
  },

  update: async (id: string, body: ObraTypeUpdate): Promise<ObraTypeConfig> => {
    const { data } = await apiClient.put<ObraTypeConfig>(`/obra-types/${id}`, body)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/obra-types/${id}`)
  },
}
