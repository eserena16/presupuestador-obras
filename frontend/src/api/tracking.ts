import { apiClient } from './client'
import type { TrackingExpense, ExpenseCreate } from '../types'

export interface ExpenseSummary {
  project_id: string
  total_spent: number
  expense_count: number
  by_category: { name: string; amount: number }[]
}

export const trackingApi = {
  listExpenses: async (projectId: string): Promise<TrackingExpense[]> => {
    const { data } = await apiClient.get<TrackingExpense[]>(
      `/projects/${projectId}/expenses`,
    )
    return data
  },

  createExpense: async (
    projectId: string,
    body: ExpenseCreate,
  ): Promise<TrackingExpense> => {
    const { data } = await apiClient.post<TrackingExpense>(
      `/projects/${projectId}/expenses`,
      body,
    )
    return data
  },

  updateExpense: async (
    projectId: string,
    expenseId: string,
    body: Partial<ExpenseCreate>,
  ): Promise<TrackingExpense> => {
    const { data } = await apiClient.put<TrackingExpense>(
      `/projects/${projectId}/expenses/${expenseId}`,
      body,
    )
    return data
  },

  deleteExpense: async (projectId: string, expenseId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/expenses/${expenseId}`)
  },

  summary: async (projectId: string): Promise<ExpenseSummary> => {
    const { data } = await apiClient.get<ExpenseSummary>(
      `/projects/${projectId}/expenses/summary`,
    )
    return data
  },
}
