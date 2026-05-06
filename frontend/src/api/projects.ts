import { apiClient } from './client'
import type { Project, ProjectCreate, BudgetVersion, Rubro, BudgetLine } from '../types'

export const projectsApi = {
  list: async (): Promise<Project[]> => {
    const { data } = await apiClient.get<Project[]>('/projects/')
    return data
  },

  get: async (id: string): Promise<Project> => {
    const { data } = await apiClient.get<Project>(`/projects/${id}`)
    return data
  },

  create: async (body: ProjectCreate): Promise<Project> => {
    const { data } = await apiClient.post<Project>('/projects/', body)
    return data
  },

  update: async (id: string, body: Partial<ProjectCreate>): Promise<Project> => {
    const { data } = await apiClient.put<Project>(`/projects/${id}`, body)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`)
  },

  duplicate: async (id: string): Promise<Project> => {
    const { data } = await apiClient.post<Project>(`/projects/${id}/duplicate`)
    return data
  },
}

export const versionsApi = {
  list: async (projectId: string): Promise<BudgetVersion[]> => {
    const { data } = await apiClient.get<BudgetVersion[]>(
      `/projects/${projectId}/versions`,
    )
    return data
  },

  create: async (
    projectId: string,
    body: { name: string; description?: string },
  ): Promise<BudgetVersion> => {
    const { data } = await apiClient.post<BudgetVersion>(
      `/projects/${projectId}/versions`,
      body,
    )
    return data
  },

  update: async (
    projectId: string,
    versionId: string,
    body: object,
  ): Promise<BudgetVersion> => {
    const { data } = await apiClient.put<BudgetVersion>(
      `/projects/${projectId}/versions/${versionId}`,
      body,
    )
    return data
  },

  delete: async (projectId: string, versionId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/versions/${versionId}`)
  },
}

export const rubrosApi = {
  list: async (projectId: string, versionId: string): Promise<Rubro[]> => {
    const { data } = await apiClient.get<Rubro[]>(
      `/projects/${projectId}/versions/${versionId}/rubros`,
    )
    return data
  },

  create: async (
    projectId: string,
    versionId: string,
    body: { name: string; color?: string; order?: number },
  ): Promise<Rubro> => {
    const { data } = await apiClient.post<Rubro>(
      `/projects/${projectId}/versions/${versionId}/rubros`,
      body,
    )
    return data
  },

  update: async (
    projectId: string,
    versionId: string,
    rubroId: string,
    body: object,
  ): Promise<Rubro> => {
    const { data } = await apiClient.put<Rubro>(
      `/projects/${projectId}/versions/${versionId}/rubros/${rubroId}`,
      body,
    )
    return data
  },

  delete: async (
    projectId: string,
    versionId: string,
    rubroId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/projects/${projectId}/versions/${versionId}/rubros/${rubroId}`,
    )
  },
}

export const linesApi = {
  list: async (
    projectId: string,
    versionId: string,
    rubroId: string,
  ): Promise<BudgetLine[]> => {
    const { data } = await apiClient.get<BudgetLine[]>(
      `/projects/${projectId}/versions/${versionId}/rubros/${rubroId}/lines`,
    )
    return data
  },

  create: async (
    projectId: string,
    versionId: string,
    rubroId: string,
    body: object,
  ): Promise<BudgetLine> => {
    const { data } = await apiClient.post<BudgetLine>(
      `/projects/${projectId}/versions/${versionId}/rubros/${rubroId}/lines`,
      body,
    )
    return data
  },

  update: async (
    projectId: string,
    versionId: string,
    rubroId: string,
    lineId: string,
    body: object,
  ): Promise<BudgetLine> => {
    const { data } = await apiClient.put<BudgetLine>(
      `/projects/${projectId}/versions/${versionId}/rubros/${rubroId}/lines/${lineId}`,
      body,
    )
    return data
  },

  delete: async (
    projectId: string,
    versionId: string,
    rubroId: string,
    lineId: string,
  ): Promise<void> => {
    await apiClient.delete(
      `/projects/${projectId}/versions/${versionId}/rubros/${rubroId}/lines/${lineId}`,
    )
  },
}
