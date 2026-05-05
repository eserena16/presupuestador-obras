import { apiClient } from './client'

export interface PadronData {
  padron: string
  direccion?: string
  barrio?: string
  zona?: string
  superficie_m2?: number
  frente_m?: number
  fondo_m?: number
  raw?: Record<string, unknown>
}

export const intendenciaApi = {
  getPadron: async (numero: string): Promise<PadronData> => {
    const { data } = await apiClient.get<PadronData>(`/intendencia/padron/${numero}`)
    return data
  },
}
