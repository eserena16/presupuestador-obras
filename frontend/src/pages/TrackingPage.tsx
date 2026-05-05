import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  ArrowLeft, Plus, Trash2, Loader2, TrendingDown, TrendingUp, DollarSign, Activity, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { projectsApi } from '../api/projects'
import { trackingApi } from '../api/tracking'
import { providersApi } from '../api/providers'
import type { ExpenseCreate } from '../types'

const CATEGORIES = [
  'Materiales', 'Mano de obra', 'Equipos', 'Transporte',
  'Servicios profesionales', 'Subcontratos', 'Gastos generales', 'Otro',
]

const fmt = (n: number) =>
  n.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

export default function TrackingPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!),
    enabled: !!id,
  })

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses', id],
    queryFn: () => trackingApi.listExpenses(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => trackingApi.deleteExpense(id!, expenseId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses', id] })
      toast.success('Gasto eliminado')
    },
    onError: () => toast.error('Error al eliminar gasto'),
  })

  // KPIs
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)

  // Datos para el gráfico por categoría
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    const key = e.rubro_name || e.category || 'Sin categoría'
    acc[key] = (acc[key] ?? 0) + e.amount
    return acc
  }, {})

  const chartData = Object.entries(byCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8) // top 8

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/proyectos/${id}`)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-white">
            Seguimiento — {project?.name ?? '...'}
          </h2>
          <p className="text-sm text-slate-500">Control de gastos reales</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Registrar gasto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={16} className="text-blue-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Total gastado</span>
          </div>
          <p className="text-2xl font-bold text-white">${fmt(totalSpent)}</p>
          <p className="text-xs text-slate-500 mt-1">{expenses.length} registros</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Categorías</span>
          </div>
          <p className="text-2xl font-bold text-white">{Object.keys(byCategory).length}</p>
          <p className="text-xs text-slate-500 mt-1">rubros con gastos</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-amber-400" />
            <span className="text-xs text-slate-500 uppercase tracking-wide">Mayor gasto</span>
          </div>
          {chartData[0] ? (
            <>
              <p className="text-2xl font-bold text-white">${fmt(chartData[0].amount)}</p>
              <p className="text-xs text-slate-500 mt-1 truncate">{chartData[0].name}</p>
            </>
          ) : (
            <p className="text-2xl font-bold text-slate-600">—</p>
          )}
        </div>
      </div>

      {/* Gráfico */}
      {chartData.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Gastos por categoría</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `$${fmt(v)}`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                formatter={(v: number) => [`$${fmt(v)}`, 'Monto']}
              />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabla de gastos */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800">
          <h3 className="text-sm font-medium text-slate-300">Gastos registrados</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <Loader2 size={20} className="animate-spin mr-2" /> Cargando...
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-600">
            <TrendingDown size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No hay gastos registrados</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800">
                <th className="text-left px-4 py-3">Fecha</th>
                <th className="text-left px-4 py-3">Descripción</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Categoría</th>
                <th className="text-left px-4 py-3 hidden lg:table-cell">Proveedor</th>
                <th className="text-right px-4 py-3">Monto</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 group">
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {format(new Date(e.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-4 py-3 text-slate-200">{e.description}</td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">{e.category}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">
                    {e.provider_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-100">
                    ${fmt(e.amount)}
                    <span className="text-xs text-slate-500 ml-1">{e.currency}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => deleteMutation.mutate(e.id)}
                      disabled={deleteMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-700">
                <td colSpan={4} className="px-4 py-3 text-xs text-slate-500 font-medium uppercase">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono font-bold text-white">
                  ${fmt(totalSpent)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Modal nuevo gasto */}
      {showModal && (
        <AddExpenseModal
          projectId={id!}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            qc.invalidateQueries({ queryKey: ['expenses', id] })
            setShowModal(false)
          }}
        />
      )}
    </div>
  )
}

// ─── Modal agregar gasto ──────────────────────────────────────────────────────

function AddExpenseModal({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string
  onClose: () => void
  onSaved: () => void
}) {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState<ExpenseCreate>({
    date: today,
    description: '',
    category: 'Materiales',
    amount: 0,
    currency: 'USD',
    provider_name: '',
    invoice_ref: '',
    notes: '',
  })
  const [selectedProviderId, setSelectedProviderId] = useState('')

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => providersApi.list(true),
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: ExpenseCreate = {
        ...form,
        provider_id: selectedProviderId || undefined,
        provider_name:
          selectedProviderId
            ? providers.find((p) => p.id === selectedProviderId)?.name
            : form.provider_name || undefined,
        invoice_ref: form.invoice_ref || undefined,
        notes: form.notes || undefined,
      }
      return trackingApi.createExpense(projectId, payload)
    },
    onSuccess: () => {
      toast.success('Gasto registrado')
      onSaved()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail ?? 'Error al registrar gasto'
      toast.error(msg)
    },
  })

  const set = (k: keyof ExpenseCreate) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))

  const inputCls =
    'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="font-semibold text-white">Registrar gasto</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Fecha *</label>
              <input type="date" value={form.date} onChange={set('date')} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Moneda</label>
              <select value={form.currency} onChange={set('currency')} className={inputCls}>
                <option>USD</option>
                <option>CLP</option>
                <option>UF</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Descripción *</label>
            <input value={form.description} onChange={set('description')} placeholder="Ej: Compra de cemento Portland" className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Categoría *</label>
              <select value={form.category} onChange={set('category')} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Monto *</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                className={inputCls}
              />
            </div>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Proveedor</label>
            {providers.length > 0 ? (
              <select
                value={selectedProviderId}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className={inputCls}
              >
                <option value="">Seleccionar proveedor (opcional)</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
                <option value="__free__">Otro (escribir nombre)</option>
              </select>
            ) : (
              <input
                value={form.provider_name}
                onChange={set('provider_name')}
                placeholder="Nombre del proveedor"
                className={inputCls}
              />
            )}
            {selectedProviderId === '__free__' && (
              <input
                value={form.provider_name}
                onChange={set('provider_name')}
                placeholder="Nombre del proveedor"
                className={`${inputCls} mt-2`}
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">N° Factura / Ref.</label>
              <input value={form.invoice_ref} onChange={set('invoice_ref')} placeholder="FAC-001" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Notas</label>
              <input value={form.notes} onChange={set('notes')} placeholder="Observaciones" className={inputCls} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg">
            Cancelar
          </button>
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.description || !form.amount}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-medium rounded-lg flex items-center gap-2"
          >
            {saveMutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Registrar gasto
          </button>
        </div>
      </div>
    </div>
  )
}
