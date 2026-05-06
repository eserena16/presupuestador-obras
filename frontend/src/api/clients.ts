import { apiClient } from './client'
import type { Client } from '../types'

export interface ClientCreate {
  name: string
  rut?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
}

export interface ClientUpdate extends Partial<ClientCreate> {
  active?: boolean
}

export const clientsApi = {
  list: async (activeOnly = true): Promise<Client[]> => {
    const { data } = await apiClient.get<Client[]>('/clients/', {
      params: { active_only: activeOnly },
    })
    return data
  },

  get: async (id: string): Promise<Client> => {
    const { data } = await apiClient.get<Client>(`/clients/${id}`)
    return data
  },

  create: async (body: ClientCreate): Promise<Client> => {
    const { data } = await apiClient.post<Client>('/clients/', body)
    return data
  },

  update: async (id: string, body: ClientUpdate): Promise<Client> => {
    const { data } = await apiClient.put<Client>(`/clients/${id}`, body)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/clients/${id}`)
  },
}
