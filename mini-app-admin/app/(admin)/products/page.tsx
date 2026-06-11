'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

interface Product {
  id: number; name: string; price: string; stock: number
  description?: string | null; images?: string | null; isActive: boolean; sortOrder: number
}

const empty = { name: '', price: '', stock: '0', description: '', images: '', sortOrder: '0', isActive: true }

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<typeof empty | (typeof empty & { id?: number }) | null>(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await fetch('/api/admin/products').then(r => r.json())
    if (Array.isArray(data)) setProducts(data)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    if (!form) return
    setSaving(true)
    try {
      const isEdit = 'id' in form && form.id
      await fetch(isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setForm(null)
      await load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm('确认下架该商品？')) return
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">商品管理</h1>
        <button onClick={() => setForm(empty)}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={16} /> 新增商品
        </button>
      </div>

      {/* 商品表格 */}
      <div className="rounded-2xl border border-white/10 bg-[#111] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-500">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">商品名</th>
              <th className="px-4 py-3 text-right">价格</th>
              <th className="px-4 py-3 text-right">库存</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-white/3">
                <td className="px-4 py-3 text-gray-500">{p.id}</td>
                <td className="px-4 py-3 text-white">{p.name}</td>
                <td className="px-4 py-3 text-right">¥{Number(p.price).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">{p.stock}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                    p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'
                  }`}>
                    {p.isActive ? <Check size={10} /> : <X size={10} />}
                    {p.isActive ? '上架' : '下架'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setForm({ ...p, price: p.price, stock: String(p.stock), sortOrder: String(p.sortOrder) } as never)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(p.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 表单弹层 */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] p-6">
            <h2 className="mb-4 text-lg font-semibold">{'id' in form && form.id ? '编辑商品' : '新增商品'}</h2>
            <div className="space-y-3">
              {([
                ['name', '商品名', 'text'],
                ['price', '价格', 'number'],
                ['stock', '库存', 'number'],
                ['sortOrder', '排序', 'number'],
              ] as [keyof typeof empty, string, string][]).map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input type={type} value={(form as Record<string, unknown>)[key] as string}
                    onChange={e => setForm(f => ({ ...f!, [key]: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">描述</label>
                <textarea rows={3} value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f!, description: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">图片 URL（JSON 数组，如 ["url1","url2"]）</label>
                <input value={form.images ?? ''}
                  onChange={e => setForm(f => ({ ...f!, images: e.target.value }))}
                  className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f!, isActive: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm text-gray-300">上架状态</span>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setForm(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">
                取消
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
