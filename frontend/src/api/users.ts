import { apiClient } from './client'
import type { User } from '../types'

export interface UserCreate {
  name: string
  email: string
  password: string
  role: string
}

export const usersApi = {
  list: async (): Promise<User[]> => {
    const { data } = await apiClient.get<User[]>('/users/')
    return data
  },

  create: async (body: UserCreate): Promise<User> => {
    const { data } = await apiClient.post<User>('/users/', body)
    return data
  },

  update: async (
    id: string,
    body: Partial<UserCreate> & { active?: boolean },
  ): Promise<User> => {
    const { data } = await apiClient.put<User>(`/users/${id}`, body)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
}
