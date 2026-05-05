import { apiClient } from './client'

export interface AISuggestRequest {
  project_id?: string
  obra_type: string
  surface_m2: number
  description?: string
  location?: string
  budget_usd?: number
}

export interface AISuggestItem {
  description: string
  unit: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface AISuggestCategory {
  name: string
  percentage: number
  estimated_usd: number
  items: AISuggestItem[]
}

export interface AISuggestResponse {
  categories: AISuggestCategory[]
  total_usd: number
  notes: string
}

export const aiApi = {
  /**
   * Solicita sugerencia de presupuesto con streaming (SSE).
   * Llama onChunk por cada fragmento de texto recibido.
   * Devuelve el JSON completo parseado al terminar.
   */
  suggestStreaming: async (
    req: AISuggestRequest,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
  ): Promise<AISuggestResponse> => {
    const token = localStorage.getItem('accessToken')
    const response = await fetch('/api/ai/suggest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(req),
      signal,
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Error ${response.status}: ${text}`)
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      // Parsear líneas SSE: "data: {...}\n\n"
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') break
        try {
          const parsed = JSON.parse(payload)
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.chunk) {
            fullText += parsed.chunk
            onChunk(parsed.chunk)
          }
        } catch {
          // ignorar lineas malformadas
        }
      }
    }

    // Parsear el JSON completo acumulado
    const start = fullText.indexOf('{')
    const end = fullText.lastIndexOf('}') + 1
    if (start === -1) throw new Error('La IA no devolvio un JSON valido')
    return JSON.parse(fullText.slice(start, end)) as AISuggestResponse
  },

  /**
   * Solicita sugerencia JSON sin streaming (espera respuesta completa).
   */
  suggestJson: async (req: AISuggestRequest): Promise<AISuggestResponse> => {
    const { data } = await apiClient.post<AISuggestResponse>('/ai/suggest/json', req)
    return data
  },
}
