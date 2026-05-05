import { apiClient } from './client'

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
  description?: string
  unit: string
  unit_price: number
  currency: string
  category_id: string
  created_at: string
  updated_at: string
}

export interface CatalogItemWithCategory extends CatalogItem {
  category?: CatalogCategory
}

export const catalogApi = {
  getCategories: async (): Promise<CatalogCategory[]> => {
    const { data } = await apiClient.get<CatalogCategory[]>('/catalog/categories')
    return data
  },

  getItems: async (categoryId?: string): Promise<CatalogItem[]> => {
    const params = categoryId ? { category_id: categoryId } : {}
    const { data } = await apiClient.get<CatalogItem[]>('/catalog/items', { params })
    return data
  },

  getItem: async (id: string): Promise<CatalogItem> => {
    const { data } = await apiClient.get<CatalogItem>(`/catalog/items/${id}`)
    return data
  },
}
