import { apiClient } from './client'
import type { LoginResponse, User } from '../types'

export const authApi = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const { data } = await apiClient.post<LoginResponse>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/users/me')
    return data
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const { data } = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return data
  },
}
