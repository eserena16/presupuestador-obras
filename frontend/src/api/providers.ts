import { apiClient } from './client'
import type { Provider, ProviderCreate } from '../types'

export const providersApi = {
  list: async (activeOnly = true): Promise<Provider[]> => {
    const { data } = await apiClient.get<Provider[]>('/providers/', {
      params: { active_only: activeOnly },
    })
    return data
  },

  create: async (body: ProviderCreate): Promise<Provider> => {
    const { data } = await apiClient.post<Provider>('/providers/', body)
    return data
  },

  update: async (id: string, body: Partial<ProviderCreate> & { active?: boolean }): Promise<Provider> => {
    const { data } = await apiClient.put<Provider>(`/providers/${id}`, body)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/providers/${id}`)
  },
}
