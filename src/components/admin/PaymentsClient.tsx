'use client'

import { useState, useTransition } from 'react'
import { createPaymentMethod, togglePaymentMethod, deletePaymentMethod } from '@/app/actions/adminActions'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'

interface PaymentMethod {
  id: string, name: string, type: string, instructions?: string | null,
  country?: string | null, isActive: boolean, createdAt: Date
}

const TYPES = ['MOBILE_MONEY', 'BANK', 'CRYPTO', 'OTHER']

export function PaymentsClient({ initialMethods }: { initialMethods: PaymentMethod[] }) {
  const [methods, setMethods] = useState<PaymentMethod[]>(initialMethods)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', type: 'MOBILE_MONEY', instructions: '', country: '' })
  const [showForm, setShowForm] = useState(false)

  const handleCreate = () => {
    if (!form.name) return
    startTransition(async () => {
      await createPaymentMethod(form)
      setForm({ name: '', type: 'MOBILE_MONEY', instructions: '', country: '' })
      setShowForm(false)
      // Optimistic — reload by refreshing
      window.location.reload()
    })
  }

  const handleToggle = (id: string, current: boolean) => {
    startTransition(async () => {
      await togglePaymentMethod(id, !current)
      setMethods(prev => prev.map(m => m.id === id ? { ...m, isActive: !current } : m))
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deletePaymentMethod(id)
      setMethods(prev => prev.filter(m => m.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      {/* Add Method */}
      <div className="flex justify-end">
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-[var(--text-inverse)] font-black text-xs uppercase tracking-widest rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Method
        </button>
      </div>

      {showForm && (
        <div className="p-6 bg-[var(--surface)] border border-[var(--accent)]/20 rounded-xl space-y-4">
          <h3 className="text-sm font-black text-[var(--text-primary)]">New Payment Method</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-black mb-1.5">Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. MTN Mobile Money"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--border-focus)]" />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-black mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none">
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-black mb-1.5">Country (optional)</label>
              <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                placeholder="e.g. RW, NG, KE"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--border-focus)]" />
            </div>
            <div>
              <label className="block text-[10px] text-[var(--text-tertiary)] uppercase tracking-widest font-black mb-1.5">Instructions</label>
              <input value={form.instructions} onChange={e => setForm(p => ({ ...p, instructions: e.target.value }))}
                placeholder="Payment details shown to users"
                className="w-full px-3 py-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--border-focus)]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={isPending || !form.name}
              className="px-5 py-2 bg-[var(--accent)] text-[var(--text-inverse)] font-black text-xs uppercase tracking-widest rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity">
              {isPending ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-5 py-2 bg-[var(--surface-2)] text-[var(--text-secondary)] font-black text-xs uppercase tracking-widest rounded-lg hover:bg-[var(--surface-3)] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Methods List */}
      <div className="space-y-3">
        {methods.map(method => (
          <div key={method.id} className={`flex items-center justify-between p-5 rounded-xl border transition-all ${
            method.isActive ? 'bg-[var(--surface)] border-[var(--border)]' : 'bg-[var(--surface-2)] border-[var(--border)] opacity-60'
          }`}>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <p className="font-bold text-[var(--text-primary)] text-sm">{method.name}</p>
                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[var(--surface-3)] text-[var(--text-tertiary)]">{method.type}</span>
                {method.country && <span className="text-[10px] text-[var(--text-tertiary)]">· {method.country}</span>}
              </div>
              {method.instructions && <p className="text-xs text-[var(--text-tertiary)]">{method.instructions}</p>}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button onClick={() => handleToggle(method.id, method.isActive)} disabled={isPending}
                className="p-2 rounded-lg hover:bg-[var(--surface-3)] text-[var(--text-tertiary)] transition-colors">
                {method.isActive ? <Eye className="w-4 h-4 text-[var(--accent)]" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => handleDelete(method.id)} disabled={isPending}
                className="p-2 rounded-lg hover:bg-[var(--error)]/10 text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {methods.length === 0 && (
          <div className="py-16 text-center border border-dashed border-[var(--border)] rounded-xl">
            <p className="text-sm text-[var(--text-tertiary)]">No payment methods configured yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
