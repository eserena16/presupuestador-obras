import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Package, ChevronRight, ChevronDown } from 'lucide-react'
import { catalogApi, type CatalogItem } from '../api/catalog'

export default function CatalogPage() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const { data: categories = [], isLoading: loadingCats } = useQuery({
    queryKey: ['catalog-categories'],
    queryFn: catalogApi.getCategories,
  })

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['catalog-items', selectedCategory],
    queryFn: () => catalogApi.getItems(selectedCategory ?? undefined),
  })

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()),
  )

  const itemsByCategory = filteredItems.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    if (!acc[item.category_id]) acc[item.category_id] = []
    acc[item.category_id].push(item)
    return acc
  }, {})

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-app-text">Catálogo de Ítems</h2>
          <p className="text-sm text-app-muted mt-0.5">
            {items.length} ítems en {categories.length} categorías — precios en USD
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
          <input
            type="text"
            placeholder="Buscar ítem o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-app-canvas border border-app-line2 rounded-lg text-sm text-app-text placeholder-app-muted focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${selectedCategory === null ? 'bg-sky-500 text-white' : 'bg-app-card text-app-muted hover:bg-app-raised'}`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-white"
              style={{ backgroundColor: selectedCategory === cat.id ? cat.color : cat.color + '40', color: selectedCategory === cat.id ? 'white' : cat.color }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {(loadingCats || loadingItems) && (
        <div className="text-center py-12 text-app-muted">
          <Package size={32} className="mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="text-sm">Cargando catálogo...</p>
        </div>
      )}

      {!loadingCats && !loadingItems && (
        <div className="space-y-3">
          {Object.entries(itemsByCategory).map(([catId, catItems]) => {
            const cat = categoryMap[catId]
            if (!cat) return null
            const isExpanded = expandedCategories.has(catId)
            return (
              <div key={catId} className="bg-app-canvas border border-app-line rounded-xl overflow-hidden">
                <button onClick={() => toggleCategory(catId)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-app-card transition-colors">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-app-text text-sm flex-1 text-left">{cat.name}</span>
                  <span className="text-xs text-app-muted mr-2">{catItems.length} ítems</span>
                  {isExpanded ? <ChevronDown size={16} className="text-app-muted" /> : <ChevronRight size={16} className="text-app-muted" />}
                </button>
                {isExpanded && (
                  <div className="border-t border-app-line">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-app-card text-app-muted text-xs">
                          <th className="text-left px-5 py-2 font-medium">Código</th>
                          <th className="text-left px-3 py-2 font-medium">Descripción</th>
                          <th className="text-center px-3 py-2 font-medium">Unidad</th>
                          <th className="text-right px-5 py-2 font-medium">Precio USD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map((item, i) => (
                          <tr key={item.id} className={`border-t border-app-line hover:bg-app-card transition-colors ${i % 2 === 0 ? '' : 'bg-app-bg/30'}`}>
                            <td className="px-5 py-2.5">
                              <span className="font-mono text-xs text-app-muted bg-app-card px-1.5 py-0.5 rounded">{item.code}</span>
                            </td>
                            <td className="px-3 py-2.5 text-app-text2">{item.name}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-xs text-app-muted bg-app-card px-2 py-0.5 rounded">{item.unit}</span>
                            </td>
                            <td className="px-5 py-2.5 text-right">
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                ${item.unit_price.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
          {Object.keys(itemsByCategory).length === 0 && (
            <div className="text-center py-12 bg-app-canvas border border-app-line rounded-xl">
              <Search size={32} className="mx-auto mb-3 text-app-muted opacity-40" />
              <p className="text-app-muted text-sm">No se encontraron ítems para tu búsqueda.</p>
            </div>
          )}
        </div>
      )}

      {!loadingCats && categories.length > 0 && (
        <div className="bg-app-canvas border border-app-line rounded-xl p-5">
          <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wide mb-3">Categorías</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                <span className="text-xs text-app-text3 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
