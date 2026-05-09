import { useState, useCallback, useEffect } from 'react'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Pencil, ChevronDown, ChevronRight, Loader2, X,
  Check, Sparkles, FileText, BookOpen,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { versionsApi, rubrosApi, linesApi } from '../../api/projects'
import { obraTypesApi } from '../../api/obraTypes'
import { catalogApi, type CatalogItem, type CatalogCategory } from '../../api/catalog'
import type { BudgetVersion, Rubro, BudgetLine } from '../../types'

const RUBRO_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#14b8a6',
  '#6366f1', '#d97706', '#dc2626', '#7c3aed', '#0891b2',
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface AISuggestResponse {
  categories: Array<{
    name: string
    percentage: number
    estimated_usd: number
    items: Array<{
      description: string
      unit: string
      quantity: number
      unit_price: number
      subtotal: number
    }>
  }>
  total_usd: number
  notes: string
}

interface BudgetEditorProps {
  projectId: string
  obraType: string | null | undefined
  currency: string
  aiResult?: AISuggestResponse | null
  onImportAI?: (versionId: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('es-UY', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

const inputCls =
  'w-full bg-transparent border-0 outline-none text-xs text-app-text2 focus:bg-app-raised rounded px-1 py-0.5'

const AUTH_LABEL: Record<string, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  autorizado: 'Autorizado',
  rechazado: 'Rechazado',
}

const AUTH_COLOR: Record<string, string> = {
  borrador: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  autorizado: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
  rechazado: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
}

// ─── New-line state per rubro ─────────────────────────────────────────────────

interface NewLineState {
  description: string
  unit: string
  quantity: string
  unit_price: string
}

const emptyNewLine = (): NewLineState => ({
  description: '',
  unit: '',
  quantity: '',
  unit_price: '',
})

// ─── Sub-component: CatalogPicker ────────────────────────────────────────────

function CatalogPicker({
  catalogItems,
  catalogCategories,
  onAdd,
  onClose,
  adding,
}: {
  catalogItems: CatalogItem[]
  catalogCategories: CatalogCategory[]
  onAdd: (item: CatalogItem) => void
  onClose: () => void
  adding: boolean
}) {
  const [search, setSearch] = useState('')
  const lower = search.trim().toLowerCase()

  const filtered = lower.length < 1
    ? catalogItems
    : catalogItems.filter(
        (item) =>
          item.name.toLowerCase().includes(lower) ||
          item.code.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower)
      )

  const grouped = catalogCategories
    .sort((a, b) => a.order - b.order)
    .map((cat) => ({ cat, items: filtered.filter((i) => i.category_id === cat.id) }))
    .filter(({ items }) => items.length > 0)

  const uncategorized = filtered.filter(
    (i) => !catalogCategories.some((c) => c.id === i.category_id)
  )

  return (
    <div className="border-t-2 border-sky-500/40 bg-sky-500/5 dark:bg-sky-900/10">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-sky-500/20">
        <BookOpen size={14} className="text-sky-500 flex-shrink-0" />
        <p className="text-xs font-semibold text-sky-600 dark:text-sky-400 flex-1">
          Catálogo de ítems
          <span className="ml-2 font-normal text-app-muted">— clic para agregar (cantidad 1, editable)</span>
        </p>
        <button
          onClick={onClose}
          className="p-1 rounded text-app-faint hover:text-app-text hover:bg-app-card transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2.5 border-b border-sky-500/20">
        <input
          autoFocus
          type="text"
          placeholder="Buscar por nombre o código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-app-canvas border border-app-line2 rounded-lg px-3 py-1.5 text-xs text-app-text2 placeholder-app-muted focus:outline-none focus:border-sky-500 transition-colors"
        />
      </div>

      {/* Items */}
      <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-4">
        {filtered.length === 0 && (
          <p className="text-xs text-app-faint text-center py-4">No se encontraron ítems</p>
        )}
        {grouped.map(({ cat, items }) => (
          <div key={cat.id}>
            <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <span style={{ backgroundColor: cat.color }} className="w-2 h-2 rounded-full flex-shrink-0" />
              {cat.name}
              <span className="font-normal text-app-faint opacity-60">({items.length})</span>
            </p>
            <div className="space-y-0.5">
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAdd(item)}
                  disabled={adding}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-app-canvas border border-transparent hover:border-app-line2 text-left transition-all disabled:opacity-60 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-app-text2 group-hover:text-app-text truncate">{item.name}</p>
                    <p className="text-[10px] text-app-muted">
                      {item.unit}
                      {item.code && <> · <code className="font-mono">{item.code}</code></>}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-emerald-500">{item.currency} {fmt(item.unit_price)}</p>
                  </div>
                  <Plus size={14} className="text-sky-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-app-muted uppercase tracking-wider mb-1.5">Sin categoría</p>
            <div className="space-y-0.5">
              {uncategorized.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAdd(item)}
                  disabled={adding}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-app-canvas border border-transparent hover:border-app-line2 text-left transition-all disabled:opacity-60 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-app-text2 group-hover:text-app-text truncate">{item.name}</p>
                    <p className="text-[10px] text-app-muted">{item.unit}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-emerald-500">{item.currency} {fmt(item.unit_price)}</p>
                  </div>
                  <Plus size={14} className="text-sky-500 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sub-component: BudgetLinesTable ─────────────────────────────────────────

interface BudgetLinesTableProps {
  projectId: string
  versionId: string
  rubro: Rubro
  currency: string
}

function BudgetLinesTable({ projectId, versionId, rubro, currency }: BudgetLinesTableProps) {
  const qc = useQueryClient()

  const { data: lines = [], isLoading } = useQuery<BudgetLine[]>({
    queryKey: ['lines', projectId, versionId, rubro.id],
    queryFn: () => linesApi.list(projectId, versionId, rubro.id),
  })

  // Catálogo
  const { data: catalogItems = [] } = useQuery<CatalogItem[]>({
    queryKey: ['catalogItems'],
    queryFn: () => catalogApi.getItems(),
    staleTime: 5 * 60 * 1000,
  })
  const { data: catalogCategories = [] } = useQuery<CatalogCategory[]>({
    queryKey: ['catalogCategories'],
    queryFn: () => catalogApi.getCategories(),
    staleTime: 5 * 60 * 1000,
  })

  const [editingCell, setEditingCell] = useState<{ lineId: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [newLine, setNewLine] = useState<NewLineState>(emptyNewLine)
  const [showCatalogPicker, setShowCatalogPicker] = useState(false)

  const invalidateLines = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['lines', projectId, versionId, rubro.id] })
  }, [qc, projectId, versionId, rubro.id])

  const updateMutation = useMutation({
    mutationFn: (vars: { lineId: string; body: object }) =>
      linesApi.update(projectId, versionId, rubro.id, vars.lineId, vars.body),
    onSuccess: () => invalidateLines(),
    onError: () => toast.error('Error al actualizar la línea'),
  })

  const deleteMutation = useMutation({
    mutationFn: (lineId: string) =>
      linesApi.delete(projectId, versionId, rubro.id, lineId),
    onSuccess: () => {
      invalidateLines()
      toast.success('Línea eliminada')
    },
    onError: () => toast.error('Error al eliminar la línea'),
  })

  const createMutation = useMutation({
    mutationFn: (body: object) =>
      linesApi.create(projectId, versionId, rubro.id, body),
    onSuccess: () => {
      invalidateLines()
      setNewLine(emptyNewLine())
      toast.success('Línea agregada')
    },
    onError: () => toast.error('Error al crear la línea'),
  })

  // Mutation separada para agregar desde el catálogo (no limpia el form manual)
  const catalogAddMutation = useMutation({
    mutationFn: (body: object) =>
      linesApi.create(projectId, versionId, rubro.id, body),
    onSuccess: (_data, vars: any) => {
      invalidateLines()
      toast.success(`"${vars.description}" agregado`)
    },
    onError: () => toast.error('Error al agregar desde catálogo'),
  })

  const addFromCatalog = (item: CatalogItem) => {
    catalogAddMutation.mutate({
      description: item.name,
      unit: item.unit,
      quantity: 1,
      unit_price: item.unit_price,
      currency,
      order: lines.length,
    })
  }

  const startEdit = (lineId: string, field: string, currentValue: string | number) => {
    setEditingCell({ lineId, field })
    setEditValue(String(currentValue))
  }

  const commitEdit = (lineId: string, field: string) => {
    const numericFields = ['quantity', 'unit_price']
    const value = numericFields.includes(field) ? parseFloat(editValue) || 0 : editValue.trim()
    if (value !== '') {
      updateMutation.mutate({ lineId, body: { [field]: value } })
    }
    setEditingCell(null)
    setEditValue('')
  }

  const handleCellKeyDown = (e: React.KeyboardEvent, lineId: string, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitEdit(lineId, field)
    } else if (e.key === 'Escape') {
      setEditingCell(null)
      setEditValue('')
    }
  }

  const handleDeleteLine = (lineId: string) => {
    if (window.confirm('¿Eliminar esta línea?')) {
      deleteMutation.mutate(lineId)
    }
  }

  const handleAddLine = () => {
    const qty = parseFloat(newLine.quantity)
    const price = parseFloat(newLine.unit_price)
    if (!newLine.description.trim() || !newLine.unit.trim() || isNaN(qty) || isNaN(price)) {
      toast.error('Completá todos los campos de la nueva línea')
      return
    }
    createMutation.mutate({
      description: newLine.description.trim(),
      unit: newLine.unit.trim(),
      quantity: qty,
      unit_price: price,
      currency,
      order: lines.length,
    })
  }

  const handleNewLineKeyDown = (e: React.KeyboardEvent, field: keyof NewLineState) => {
    if (e.key === 'Enter' && field === 'unit_price') {
      handleAddLine()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-app-muted text-xs">
        <Loader2 size={12} className="animate-spin" /> Cargando líneas...
      </div>
    )
  }

  const renderCell = (line: BudgetLine, field: string, display: string | number) => {
    const isEditing =
      editingCell?.lineId === line.id && editingCell?.field === field
    if (isEditing) {
      return (
        <input
          autoFocus
          className={inputCls}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => commitEdit(line.id, field)}
          onKeyDown={(e) => handleCellKeyDown(e, line.id, field)}
        />
      )
    }
    return (
      <span
        className="cursor-pointer hover:text-app-text transition-colors"
        onClick={() => startEdit(line.id, field, display)}
      >
        {display}
      </span>
    )
  }

  return (
    <div className="border-t border-app-line">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-app-card border-b border-app-line">
            <th className="text-left px-4 py-2 text-app-muted uppercase tracking-wider font-medium">
              Descripción
            </th>
            <th className="text-center px-3 py-2 text-app-muted uppercase tracking-wider font-medium w-20">
              Unidad
            </th>
            <th className="text-right px-3 py-2 text-app-muted uppercase tracking-wider font-medium w-20">
              Cantidad
            </th>
            <th className="text-right px-3 py-2 text-app-muted uppercase tracking-wider font-medium w-24">
              P. Unit.
            </th>
            <th className="text-right px-4 py-2 text-app-muted uppercase tracking-wider font-medium w-28">
              Subtotal
            </th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr
              key={line.id}
              className="border-b border-app-line hover:bg-app-card/50 transition-colors group"
            >
              <td className="px-4 py-2 text-app-text3">
                {renderCell(line, 'description', line.description)}
              </td>
              <td className="px-3 py-2 text-center text-app-text3">
                {renderCell(line, 'unit', line.unit)}
              </td>
              <td className="px-3 py-2 text-right text-app-text3">
                {renderCell(line, 'quantity', line.quantity)}
              </td>
              <td className="px-3 py-2 text-right text-app-text3">
                {renderCell(line, 'unit_price', line.unit_price)}
              </td>
              <td className="px-4 py-2 text-right font-medium text-emerald-500 dark:text-emerald-400">
                {fmt(line.subtotal)}
              </td>
              <td className="pr-2 py-2 text-center">
                <button
                  onClick={() => handleDeleteLine(line.id)}
                  className="opacity-0 group-hover:opacity-100 text-app-faint hover:text-red-500 transition-all"
                >
                  <X size={13} />
                </button>
              </td>
            </tr>
          ))}

          {/* New line row — ingreso manual */}
          <tr className="border-b border-app-line bg-app-card/30">
            <td className="px-4 py-2">
              <input
                className={inputCls}
                placeholder="Descripción manual..."
                value={newLine.description}
                autoComplete="off"
                onChange={(e) => setNewLine((p) => ({ ...p, description: e.target.value }))}
              />
            </td>
            <td className="px-3 py-2">
              <input
                className={`${inputCls} text-center`}
                placeholder="m²"
                value={newLine.unit}
                onChange={(e) => setNewLine((p) => ({ ...p, unit: e.target.value }))}
              />
            </td>
            <td className="px-3 py-2">
              <input
                className={`${inputCls} text-right`}
                placeholder="0"
                type="number"
                min="0"
                value={newLine.quantity}
                onChange={(e) => setNewLine((p) => ({ ...p, quantity: e.target.value }))}
              />
            </td>
            <td className="px-3 py-2">
              <input
                className={`${inputCls} text-right`}
                placeholder="0"
                type="number"
                min="0"
                value={newLine.unit_price}
                onChange={(e) => setNewLine((p) => ({ ...p, unit_price: e.target.value }))}
                onKeyDown={(e) => handleNewLineKeyDown(e, 'unit_price')}
              />
            </td>
            <td className="px-4 py-2 text-right text-app-faint text-xs">
              {newLine.quantity && newLine.unit_price
                ? fmt((parseFloat(newLine.quantity) || 0) * (parseFloat(newLine.unit_price) || 0))
                : '—'}
            </td>
            <td className="pr-2 py-2 text-center">
              <button
                onClick={handleAddLine}
                disabled={createMutation.isPending}
                className="text-sky-500 hover:text-sky-400 disabled:opacity-50 transition-colors"
                title="Agregar línea"
              >
                {createMutation.isPending ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Plus size={13} />
                )}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Botón toggle catálogo */}
      <div className="flex items-center px-4 py-2 border-t border-app-line/50">
        <button
          onClick={() => setShowCatalogPicker((v) => !v)}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            showCatalogPicker
              ? 'bg-sky-500/10 text-sky-500 border-sky-500/30'
              : 'text-app-muted hover:text-sky-500 hover:bg-sky-500/10 border-transparent hover:border-sky-500/20'
          }`}
        >
          <BookOpen size={13} />
          {showCatalogPicker ? 'Cerrar catálogo' : 'Agregar del catálogo'}
        </button>
      </div>

      {/* Panel del catálogo */}
      {showCatalogPicker && (
        <CatalogPicker
          catalogItems={catalogItems}
          catalogCategories={catalogCategories}
          onAdd={addFromCatalog}
          onClose={() => setShowCatalogPicker(false)}
          adding={catalogAddMutation.isPending}
        />
      )}
    </div>
  )
}

// ─── Sub-component: RubroRow ──────────────────────────────────────────────────

interface RubroRowProps {
  projectId: string
  versionId: string
  rubro: Rubro
  currency: string
  onDeleted: () => void
}

function RubroRow({ projectId, versionId, rubro, currency, onDeleted }: RubroRowProps) {
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(rubro.name)

  const { data: lines = [] } = useQuery<BudgetLine[]>({
    queryKey: ['lines', projectId, versionId, rubro.id],
    queryFn: () => linesApi.list(projectId, versionId, rubro.id),
  })

  const rubroTotal = lines.reduce((sum, l) => sum + l.subtotal, 0)

  const renameMutation = useMutation({
    mutationFn: (name: string) =>
      rubrosApi.update(projectId, versionId, rubro.id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubros', projectId, versionId] })
      setEditing(false)
      toast.success('Rubro actualizado')
    },
    onError: () => toast.error('Error al renombrar el rubro'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => rubrosApi.delete(projectId, versionId, rubro.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubros', projectId, versionId] })
      toast.success('Rubro eliminado')
      onDeleted()
    },
    onError: () => toast.error('Error al eliminar el rubro'),
  })

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== rubro.name) {
      renameMutation.mutate(editName.trim())
    } else {
      setEditing(false)
    }
  }

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar el rubro "${rubro.name}" y todas sus líneas?`)) {
      deleteMutation.mutate()
    }
  }

  return (
    <div className="border border-app-line rounded-lg overflow-hidden">
      {/* Rubro header */}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-app-card cursor-pointer transition-colors group">
        {/* Color dot */}
        <span
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: rubro.color }}
        />

        {/* Name / edit */}
        {editing ? (
          <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              className="flex-1 bg-app-raised border border-app-line2 rounded px-2 py-0.5 text-sm text-app-text outline-none focus:border-sky-500"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setEditName(rubro.name); setEditing(false) }
              }}
            />
            <button
              onClick={handleRename}
              disabled={renameMutation.isPending}
              className="text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => { setEditName(rubro.name); setEditing(false) }}
              className="text-app-faint hover:text-app-text3 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            className="flex-1 text-left text-sm font-medium text-app-text2 hover:text-app-text transition-colors"
            onClick={() => setExpanded((p) => !p)}
          >
            {rubro.name}
          </button>
        )}

        {/* Rubro total */}
        {!editing && (
          <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400 ml-auto">
            {currency} {fmt(rubroTotal)}
          </span>
        )}

        {/* Action buttons (show on hover) */}
        {!editing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              className="p-1 rounded text-app-faint hover:text-sky-500 hover:bg-app-raised transition-colors"
              title="Renombrar"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
              disabled={deleteMutation.isPending}
              className="p-1 rounded text-app-faint hover:text-red-500 hover:bg-app-raised transition-colors disabled:opacity-50"
              title="Eliminar rubro"
            >
              {deleteMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            </button>
          </div>
        )}

        {/* Chevron */}
        {!editing && (
          <button onClick={() => setExpanded((p) => !p)} className="text-app-faint ml-1">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>

      {/* Lines table */}
      {expanded && (
        <BudgetLinesTable
          projectId={projectId}
          versionId={versionId}
          rubro={rubro}
          currency={currency}
        />
      )}
    </div>
  )
}

// ─── Sub-component: AddRubroForm ──────────────────────────────────────────────

interface AddRubroFormProps {
  projectId: string
  versionId: string
  currentCount: number
  onDone: () => void
}

function AddRubroForm({ projectId, versionId, currentCount, onDone }: AddRubroFormProps) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [color, setColor] = useState(RUBRO_COLORS[currentCount % RUBRO_COLORS.length])

  const createMutation = useMutation({
    mutationFn: () =>
      rubrosApi.create(projectId, versionId, { name: name.trim(), color, order: currentCount }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rubros', projectId, versionId] })
      toast.success('Rubro creado')
      onDone()
    },
    onError: () => toast.error('Error al crear el rubro'),
  })

  const handleSubmit = () => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return }
    createMutation.mutate()
  }

  return (
    <div className="border border-app-line2 rounded-lg p-3 bg-app-card space-y-3">
      <p className="text-xs font-semibold text-app-text2">Nuevo rubro</p>
      <input
        autoFocus
        className="w-full bg-app-canvas border border-app-line2 rounded px-3 py-1.5 text-sm text-app-text outline-none focus:border-sky-500 transition-colors"
        placeholder="Nombre del rubro..."
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onDone() }}
      />
      {/* Color picker */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {RUBRO_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => setColor(c)}
            className="w-5 h-5 rounded-full transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              outline: color === c ? `2px solid ${c}` : 'none',
              outlineOffset: '2px',
            }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors"
        >
          {createMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Guardar
        </button>
        <button
          onClick={onDone}
          className="text-xs text-app-muted hover:text-app-text px-3 py-1.5 rounded transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Sub-component: VersionContent ────────────────────────────────────────────

interface VersionContentProps {
  projectId: string
  versionId: string
  obraType: string | null | undefined
  currency: string
  aiResult?: AISuggestResponse | null
  onImportAI?: (versionId: string) => void
}

function VersionContent({
  projectId,
  versionId,
  obraType,
  currency,
  aiResult,
  onImportAI,
}: VersionContentProps) {
  const qc = useQueryClient()
  const [showAddRubro, setShowAddRubro] = useState(false)
  const [importingAI, setImportingAI] = useState(false)

  const { data: rubros = [], isLoading } = useQuery<Rubro[]>({
    queryKey: ['rubros', projectId, versionId],
    queryFn: () => rubrosApi.list(projectId, versionId),
  })

  // Suscribirse reactivamente a todas las líneas de todos los rubros
  // para que el total se actualice al agregar/editar/borrar líneas
  const lineResults = useQueries({
    queries: rubros.map((r) => ({
      queryKey: ['lines', projectId, versionId, r.id],
      queryFn: () => linesApi.list(projectId, versionId, r.id),
    })),
  })

  const totalLines = lineResults.reduce((sum, q) => sum + (q.data?.length ?? 0), 0)
  const grandTotal = lineResults.reduce(
    (sum, q) => sum + (q.data ?? []).reduce((s, l) => s + l.subtotal, 0),
    0,
  )

  const handleImportAI = async () => {
    if (!aiResult) return
    setImportingAI(true)
    try {
      for (let i = 0; i < aiResult.categories.length; i++) {
        const cat = aiResult.categories[i]
        const color = RUBRO_COLORS[i % RUBRO_COLORS.length]
        const rubro = await rubrosApi.create(projectId, versionId, {
          name: cat.name,
          color,
          order: i,
        })
        for (let j = 0; j < cat.items.length; j++) {
          const item = cat.items[j]
          await linesApi.create(projectId, versionId, rubro.id, {
            description: item.description,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency: 'USD',
            order: j,
          })
        }
      }
      await qc.invalidateQueries({ queryKey: ['rubros', projectId, versionId] })
      toast.success('Presupuesto IA importado correctamente')
      onImportAI?.(versionId)
    } catch {
      toast.error('Error al importar la sugerencia IA')
    } finally {
      setImportingAI(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-app-muted text-sm justify-center">
        <Loader2 size={16} className="animate-spin" /> Cargando rubros...
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* AI import banner */}
      {aiResult && (
        <div className="flex items-center gap-3 bg-violet-900/10 border border-violet-800/40 rounded-lg px-4 py-3">
          <Sparkles size={15} className="text-violet-400 flex-shrink-0" />
          <p className="text-xs text-violet-300 flex-1">
            Hay una sugerencia de presupuesto IA disponible con{' '}
            <strong>{aiResult.categories.length} categorías</strong> y un total estimado de{' '}
            <strong>USD {fmt(aiResult.total_usd)}</strong>.
          </p>
          <button
            onClick={handleImportAI}
            disabled={importingAI}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded transition-colors whitespace-nowrap"
          >
            {importingAI ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Sparkles size={12} />
            )}
            {importingAI ? 'Importando...' : 'Importar IA'}
          </button>
        </div>
      )}

      {/* Rubros list */}
      {rubros.length === 0 && !showAddRubro && (
        <div className="flex flex-col items-center justify-center py-10 text-app-muted border border-dashed border-app-line2 rounded-lg">
          <FileText size={28} className="mb-2 opacity-30" />
          <p className="text-sm font-medium">Sin rubros todavía</p>
          <p className="text-xs text-app-faint mt-1">
            Agregá rubros para organizar las líneas del presupuesto.
          </p>
          <button
            onClick={() => setShowAddRubro(true)}
            className="mt-4 flex items-center gap-1.5 text-sky-500 hover:text-sky-400 text-xs font-medium transition-colors"
          >
            <Plus size={14} /> Agregar primer rubro
          </button>
        </div>
      )}

      {rubros.length > 0 && (
        <div className="space-y-2">
          {rubros.map((rubro) => (
            <RubroRow
              key={rubro.id}
              projectId={projectId}
              versionId={versionId}
              rubro={rubro}
              currency={currency}
              onDeleted={() => {
                qc.invalidateQueries({ queryKey: ['rubros', projectId, versionId] })
              }}
            />
          ))}
        </div>
      )}

      {/* Add rubro form or button */}
      {showAddRubro ? (
        <AddRubroForm
          projectId={projectId}
          versionId={versionId}
          currentCount={rubros.length}
          onDone={() => setShowAddRubro(false)}
        />
      ) : (
        rubros.length > 0 && (
          <button
            onClick={() => setShowAddRubro(true)}
            className="flex items-center gap-1.5 text-xs text-app-muted hover:text-sky-500 transition-colors py-1"
          >
            <Plus size={13} /> Agregar rubro
          </button>
        )
      )}

      {/* Summary footer */}
      {rubros.length > 0 && (
        <div className="border-t border-app-line pt-4 mt-4 flex items-end justify-between">
          <div className="text-xs text-app-muted space-y-0.5">
            <p>
              <span className="font-medium text-app-text2">{rubros.length}</span>{' '}
              {rubros.length === 1 ? 'rubro' : 'rubros'} ·{' '}
              <span className="font-medium text-app-text2">{totalLines}</span>{' '}
              {totalLines === 1 ? 'línea' : 'líneas'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-app-muted mb-0.5">Total presupuestado</p>
            <p className="text-2xl font-bold text-emerald-500 dark:text-emerald-400">
              {currency} {fmt(grandTotal)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sub-component: CreateVersionForm ─────────────────────────────────────────

interface CreateVersionFormProps {
  projectId: string
  obraType: string | null | undefined
  onCreated: (version: BudgetVersion) => void
  onCancel: () => void
}

function CreateVersionForm({ projectId, obraType, onCreated, onCancel }: CreateVersionFormProps) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  // Fetch template rubros from DB
  const { data: obraTypeConfig } = useQuery({
    queryKey: ['obraTypes', 'key', obraType],
    queryFn: () => obraTypesApi.getByKey(obraType!),
    enabled: !!obraType,
  })
  const templateRubros = obraTypeConfig?.rubros ?? []

  const doCreate = async (withTemplate: boolean) => {
    if (!name.trim()) { toast.error('El nombre es requerido'); return }
    setCreating(true)
    try {
      const version = await versionsApi.create(projectId, {
        name: name.trim(),
        description: description.trim() || undefined,
      })

      if (withTemplate && templateRubros.length > 0) {
        for (let i = 0; i < templateRubros.length; i++) {
          await rubrosApi.create(projectId, version.id, {
            name: templateRubros[i].name,
            color: templateRubros[i].color ?? RUBRO_COLORS[i % RUBRO_COLORS.length],
            order: i,
          })
        }
        toast.success(`Versión creada con ${templateRubros.length} rubros de plantilla`)
      } else {
        toast.success('Versión creada')
      }

      await qc.invalidateQueries({ queryKey: ['versions', projectId] })
      onCreated(version)
    } catch {
      toast.error('Error al crear la versión')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-app-canvas border border-app-line2 rounded-xl p-5 space-y-4">
      <p className="text-sm font-semibold text-app-text">Nueva versión de presupuesto</p>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-app-muted mb-1">Nombre *</label>
          <input
            autoFocus
            className="w-full bg-app-raised border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text outline-none focus:border-sky-500 transition-colors"
            placeholder="ej. Versión 1, Propuesta inicial..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') onCancel() }}
          />
        </div>
        <div>
          <label className="block text-xs text-app-muted mb-1">Descripción (opcional)</label>
          <input
            className="w-full bg-app-raised border border-app-line2 rounded-lg px-3 py-2 text-sm text-app-text outline-none focus:border-sky-500 transition-colors"
            placeholder="Breve descripción de esta versión..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => doCreate(false)}
          disabled={creating}
          className="flex items-center gap-1.5 bg-app-card border border-app-line2 hover:bg-app-raised text-app-text2 text-xs font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60"
        >
          {creating ? <Loader2 size={13} className="animate-spin" /> : <FileText size={13} />}
          Desde cero
        </button>
        {templateRubros.length > 0 && (
          <button
            onClick={() => doCreate(true)}
            disabled={creating}
            className="flex items-center gap-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
          >
            {creating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
            Usar plantilla {obraTypeConfig ? `(${obraTypeConfig.label})` : obraType ? `(${obraType.replace(/_/g, ' ')})` : ''}
          </button>
        )}
        <button
          onClick={onCancel}
          disabled={creating}
          className="text-xs text-app-muted hover:text-app-text px-3 py-2 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ─── Sub-component: DeleteVersionModal ────────────────────────────────────────

interface DeleteVersionModalProps {
  version: BudgetVersion
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

function DeleteVersionModal({ version, onConfirm, onCancel, loading }: DeleteVersionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-app-canvas border border-app-line rounded-xl shadow-xl p-6 w-full max-w-sm mx-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-app-text text-sm">Eliminar versión</p>
            <p className="text-xs text-app-muted mt-1">
              ¿Eliminar <strong>"{version.name}"</strong>? Esta acción no se puede deshacer y
              borrará todos los rubros y líneas asociadas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="text-xs text-app-muted hover:text-app-text px-3 py-1.5 rounded transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component: BudgetEditor ─────────────────────────────────────────────

export default function BudgetEditor({
  projectId,
  obraType,
  currency,
  aiResult,
  onImportAI,
}: BudgetEditorProps) {
  const qc = useQueryClient()
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deletingVersion, setDeletingVersion] = useState<BudgetVersion | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const { data: versions = [], isLoading } = useQuery<BudgetVersion[]>({
    queryKey: ['versions', projectId],
    queryFn: () => versionsApi.list(projectId),
  })

  // Auto-select first version when versions load and none is selected
  useEffect(() => {
    if (versions.length > 0 && !selectedVersionId) {
      setSelectedVersionId(versions[0].id)
    }
  }, [versions, selectedVersionId])

  // Ensure selectedVersionId is valid after versions load
  const effectiveVersionId =
    selectedVersionId && versions.some((v) => v.id === selectedVersionId)
      ? selectedVersionId
      : versions[0]?.id ?? null

  const selectedVersion = versions.find((v) => v.id === effectiveVersionId) ?? null

  const handleVersionCreated = (version: BudgetVersion) => {
    setSelectedVersionId(version.id)
    setShowCreateForm(false)
  }

  const handleDeleteVersion = async () => {
    if (!deletingVersion) return
    setDeleteLoading(true)
    try {
      await versionsApi.delete(projectId, deletingVersion.id)
      await qc.invalidateQueries({ queryKey: ['versions', projectId] })
      toast.success('Versión eliminada')
      if (effectiveVersionId === deletingVersion.id) {
        const remaining = versions.filter((v) => v.id !== deletingVersion.id)
        setSelectedVersionId(remaining[0]?.id ?? null)
      }
    } catch {
      toast.error('Error al eliminar la versión')
    } finally {
      setDeleteLoading(false)
      setDeletingVersion(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-app-muted text-sm gap-2">
        <Loader2 size={18} className="animate-spin" /> Cargando presupuesto...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Delete version modal */}
      {deletingVersion && (
        <DeleteVersionModal
          version={deletingVersion}
          onConfirm={handleDeleteVersion}
          onCancel={() => setDeletingVersion(null)}
          loading={deleteLoading}
        />
      )}

      {/* ── No versions: prominent CTA ── */}
      {versions.length === 0 && !showCreateForm && (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-app-line2 rounded-xl bg-app-canvas">
          <FileText size={40} className="mb-3 text-app-faint opacity-50" />
          <p className="text-base font-semibold text-app-text mb-1">Sin versiones de presupuesto</p>
          <p className="text-sm text-app-muted max-w-xs">
            Creá la primera versión para empezar a organizar los rubros y las líneas de cotización.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-6 flex items-center gap-2 bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} /> Crear primer presupuesto
          </button>
        </div>
      )}

      {/* ── Create version form (no versions case) ── */}
      {versions.length === 0 && showCreateForm && (
        <CreateVersionForm
          projectId={projectId}
          obraType={obraType}
          onCreated={handleVersionCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* ── Versions exist: tabs ── */}
      {versions.length > 0 && (
        <>
          {/* Version tab bar */}
          <div className="flex items-center gap-2 flex-wrap">
            {versions.map((v) => {
              const isActive = v.id === effectiveVersionId
              return (
                <div key={v.id} className="flex items-center group">
                  <button
                    onClick={() => { setSelectedVersionId(v.id); setShowCreateForm(false) }}
                    className={`flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-sky-500 text-white border-sky-500'
                        : 'bg-app-canvas border-app-line text-app-muted hover:text-app-text hover:bg-app-card'
                    }`}
                  >
                    <span>{v.name}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        isActive ? 'bg-white/20 text-white' : AUTH_COLOR[v.auth_status]
                      }`}
                    >
                      {AUTH_LABEL[v.auth_status]}
                    </span>
                  </button>
                  {/* Delete tab button */}
                  <button
                    onClick={() => setDeletingVersion(v)}
                    className="ml-1 p-0.5 rounded text-app-faint opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    title="Eliminar versión"
                  >
                    <X size={12} />
                  </button>
                </div>
              )
            })}

            {/* Add version button */}
            {!showCreateForm && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1 border border-dashed border-app-line2 rounded-lg px-3 py-1.5 text-xs text-app-muted hover:text-sky-500 hover:border-sky-500 transition-colors"
              >
                <Plus size={12} /> Nueva versión
              </button>
            )}
          </div>

          {/* Create version form (inline, above content) */}
          {showCreateForm && (
            <CreateVersionForm
              projectId={projectId}
              obraType={obraType}
              onCreated={handleVersionCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {/* Selected version header */}
          {selectedVersion && !showCreateForm && (
            <div className="bg-app-canvas border border-app-line rounded-xl overflow-hidden">
              {/* Version meta bar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-app-line bg-app-card/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-app-text truncate">{selectedVersion.name}</p>
                  {selectedVersion.description && (
                    <p className="text-xs text-app-muted truncate">{selectedVersion.description}</p>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${AUTH_COLOR[selectedVersion.auth_status]}`}>
                  {AUTH_LABEL[selectedVersion.auth_status]}
                </span>
                <span className="text-xs text-app-faint">
                  {new Date(selectedVersion.created_at).toLocaleDateString('es-UY')}
                </span>
              </div>

              {/* Rubros & lines */}
              <div className="p-5">
                <VersionContent
                  projectId={projectId}
                  versionId={effectiveVersionId!}
                  obraType={obraType}
                  currency={currency}
                  aiResult={aiResult}
                  onImportAI={onImportAI}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
