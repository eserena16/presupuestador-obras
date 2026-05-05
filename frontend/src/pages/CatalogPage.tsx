import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Package, Tag, DollarSign, ChevronRight, ChevronDown } from 'lucide-react'
import { catalogApi, type CatalogCategory, type CatalogItem } from '../api/catalog'

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

  // Filtrar por búsqueda
  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase()),
  )

  // Agrupar items por categoría
  const itemsByCategory = filteredItems.reduce<Record<string, CatalogItem[]>>((acc, item) => {
    if (!acc[item.category_id]) acc[item.category_id] = []
    acc[item.category_id].push(item)
    return acc
  }, {})

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalItems = items.length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Catálogo de Ítems</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalItems} ítems en {categories.length} categorías — precios en USD
          </p>
        </div>
      </div>

      {/* Barra de búsqueda + filtro categoría */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ítem o código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
              style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {(loadingCats || loadingItems) && (
        <div className="text-center py-12 text-slate-400">
          <Package size={32} className="mx-auto mb-3 opacity-40 animate-pulse" />
          <p className="text-sm">Cargando catálogo...</p>
        </div>
      )}

      {/* Lista agrupada por categoría */}
      {!loadingCats && !loadingItems && (
        <div className="space-y-3">
          {Object.entries(itemsByCategory).map(([catId, catItems]) => {
            const cat = categoryMap[catId]
            if (!cat) return null
            const isExpanded = expandedCategories.has(catId)

            return (
              <div
                key={catId}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
              >
                {/* Cabecera de categoría */}
                <button
                  onClick={() => toggleCategory(catId)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-800/50 transition-colors"
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-semibold text-slate-100 text-sm flex-1 text-left">
                    {cat.name}
                  </span>
                  <span className="text-xs text-slate-500 mr-2">{catItems.length} ítems</span>
                  {isExpanded ? (
                    <ChevronDown size={16} className="text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </button>

                {/* Ítems expandidos */}
                {isExpanded && (
                  <div className="border-t border-slate-800">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-800/50 text-slate-400 text-xs">
                          <th className="text-left px-5 py-2 font-medium">Código</th>
                          <th className="text-left px-3 py-2 font-medium">Descripción</th>
                          <th className="text-center px-3 py-2 font-medium">Unidad</th>
                          <th className="text-right px-5 py-2 font-medium">Precio USD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catItems.map((item, i) => (
                          <tr
                            key={item.id}
                            className={`border-t border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                              i % 2 === 0 ? '' : 'bg-slate-800/20'
                            }`}
                          >
                            <td className="px-5 py-2.5">
                              <span className="font-mono text-xs text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                                {item.code}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-200">{item.name}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                                {item.unit}
                              </span>
                            </td>
                            <td className="px-5 py-2.5 text-right">
                              <span className="font-semibold text-emerald-400">
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

          {/* Sin resultados */}
          {Object.keys(itemsByCategory).length === 0 && !loadingItems && (
            <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl">
              <Search size={32} className="mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">No se encontraron ítems para tu búsqueda.</p>
            </div>
          )}
        </div>
      )}

      {/* Leyenda de colores por categoría */}
      {!loadingCats && categories.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
            Categorías
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-xs text-slate-300 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
