'use client'
import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp } from 'lucide-react'

interface Spec {
  id: number; productId: number; name: string; price: string
  stock: number; sortOrder: number; isActive: boolean
}
interface CardStats { total: number; available: number; locked: number; sold: number; disabled: number }
interface Product {
  id: number; name: string; price: string; stock: number; category?: string | null
  sales: number; description?: string | null; images?: string | null
  isActive: boolean; sortOrder: number; specs: Spec[]; cardStats: CardStats
}

const emptyProduct = {
  name: '', price: '', stock: '0', description: '', images: '',
  sortOrder: '0', isActive: true, category: '',
}
const emptySpec = { name: '', price: '', sortOrder: '0', isActive: true }

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
      {msg}
    </div>
  )
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState<(typeof emptyProduct & { id?: number }) | null>(null)
  const [saving, setSaving] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [specForm, setSpecForm] = useState<(typeof emptySpec & { id?: number; productId?: number }) | null>(null)
  const [savingSpec, setSavingSpec] = useState(false)
  const [toast, setToast] = useState('')
  const [confirmDisable, setConfirmDisable] = useState<{ type: 'product' | 'spec'; id: number; productId?: number } | null>(null)

  const showToast = (msg: string) => setToast(msg)

  async function load() {
    const data = await fetch('/api/admin/products').then(r => r.json())
    if (Array.isArray(data)) setProducts(data)
  }
  useEffect(() => { load() }, [])

  async function handleSaveProduct() {
    if (!form) return
    setSaving(true)
    try {
      const isEdit = 'id' in form && form.id
      const res = await fetch(isEdit ? `/api/admin/products/${form.id}` : '/api/admin/products', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const e = await res.json(); showToast(e.error ?? '保存失败'); return }
      showToast(isEdit ? '商品已更新' : '商品已创建')
      setForm(null)
      await load()
    } finally { setSaving(false) }
  }

  async function handleDeleteProduct(id: number) {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    showToast('商品已下架')
    await load()
  }

  async function handleSaveSpec() {
    if (!specForm) return
    setSavingSpec(true)
    try {
      const isEdit = 'id' in specForm && specForm.id
      const url = isEdit ? `/api/admin/specs/${specForm.id}` : `/api/admin/products/${specForm.productId}/specs`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(specForm),
      })
      if (!res.ok) { const e = await res.json(); showToast(e.error ?? '保存失败'); return }
      showToast(isEdit ? '规格已更新' : '规格已添加')
      setSpecForm(null)
      await load()
    } finally { setSavingSpec(false) }
  }

  async function handleDisableSpec(specId: number, productId: number) {
    const res = await fetch(`/api/admin/specs/${specId}`, { method: 'DELETE' })
    if (!res.ok) { const e = await res.json(); showToast(e.error ?? '操作失败'); return }
    showToast('规格已停用')
    setConfirmDisable(null)
    await load()
  }

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">商品管理</h1>
        <button onClick={() => setForm(emptyProduct)}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={16} /> 新增商品
        </button>
      </div>

      {/* 商品表格 */}
      <div className="rounded-2xl border border-white/10 bg-[#111] overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-white/10 text-gray-500">
              <th className="px-4 py-3 text-left">商品名</th>
              <th className="px-4 py-3 text-left">分类</th>
              <th className="px-4 py-3 text-right">价格</th>
              <th className="px-4 py-3 text-right">总库存</th>
              <th className="px-4 py-3 text-right">销量</th>
              <th className="px-4 py-3 text-center">规格数</th>
              <th className="px-4 py-3 text-center">可用卡密</th>
              <th className="px-4 py-3 text-center">已售卡密</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map(p => (
              <>
                <tr key={p.id} className="hover:bg-white/3">
                  <td className="px-4 py-3 text-white">{p.name}</td>
                  <td className="px-4 py-3 text-gray-400">{p.category ?? '-'}</td>
                  <td className="px-4 py-3 text-right">¥{Number(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{p.stock}</td>
                  <td className="px-4 py-3 text-right">{p.sales}</td>
                  <td className="px-4 py-3 text-center">{p.specs.length}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-green-400 font-medium">{p.cardStats.available}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-gray-400">{p.cardStats.sold}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                      p.isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'
                    }`}>
                      {p.isActive ? <Check size={10} /> : <X size={10} />}
                      {p.isActive ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white" title="规格管理">
                        {expandedId === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => setForm({ ...p, price: p.price, stock: String(p.stock), sortOrder: String(p.sortOrder), category: p.category ?? '' } as never)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setConfirmDisable({ type: 'product', id: p.id })}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
                {/* 规格展开区 */}
                {expandedId === p.id && (
                  <tr key={`spec-${p.id}`}>
                    <td colSpan={10} className="px-6 py-4 bg-white/2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 font-medium">规格管理</span>
                          <button onClick={() => setSpecForm({ ...emptySpec, productId: p.id })}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
                            <Plus size={12} /> 添加规格
                          </button>
                        </div>
                        {p.specs.length === 0 ? (
                          <p className="text-xs text-gray-600">暂无规格，可直接用商品主价格。</p>
                        ) : (
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-gray-600 border-b border-white/5">
                                <th className="py-1.5 text-left">规格名</th>
                                <th className="py-1.5 text-right">价格</th>
                                <th className="py-1.5 text-right">可用库存</th>
                                <th className="py-1.5 text-right">排序</th>
                                <th className="py-1.5 text-center">状态</th>
                                <th className="py-1.5 text-center">操作</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/3">
                              {p.specs.map(s => (
                                <tr key={s.id} className="hover:bg-white/3">
                                  <td className="py-1.5 text-white">{s.name}</td>
                                  <td className="py-1.5 text-right">¥{Number(s.price).toFixed(2)}</td>
                                  <td className="py-1.5 text-right text-green-400">{s.stock}</td>
                                  <td className="py-1.5 text-right text-gray-500">{s.sortOrder}</td>
                                  <td className="py-1.5 text-center">
                                    <span className={`rounded-full px-1.5 py-0.5 ${
                                      s.isActive ? 'bg-green-500/15 text-green-400' : 'bg-gray-500/15 text-gray-500'
                                    }`}>
                                      {s.isActive ? '启用' : '停用'}
                                    </span>
                                  </td>
                                  <td className="py-1.5">
                                    <div className="flex items-center justify-center gap-1">
                                      <button onClick={() => setSpecForm({ ...s, price: s.price, sortOrder: String(s.sortOrder) })}
                                        className="rounded p-1 text-gray-400 hover:text-white hover:bg-white/5">
                                        <Pencil size={12} />
                                      </button>
                                      <button onClick={() => setConfirmDisable({ type: 'spec', id: s.id, productId: p.id })}
                                        className="rounded p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10">
                                        <X size={12} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* 商品表单弹层 */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="mb-4 text-lg font-semibold">{'id' in form && form.id ? '编辑商品' : '新增商品'}</h2>
            <div className="space-y-3">
              {([
                ['name', '商品名', 'text'],
                ['category', '分类', 'text'],
                ['price', '价格', 'number'],
                ['sortOrder', '排序', 'number'],
              ] as [keyof typeof emptyProduct, string, string][]).map(([key, label, type]) => (
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
                <label className="text-xs text-gray-500 mb-1 block">图片 URL（JSON 数组）</label>
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
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">取消</button>
              <button onClick={handleSaveProduct} disabled={saving}
                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 规格表单弹层 */}
      {specForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] p-6">
            <h2 className="mb-4 text-lg font-semibold">{'id' in specForm && specForm.id ? '编辑规格' : '添加规格'}</h2>
            <div className="space-y-3">
              {([
                ['name', '规格名', 'text'],
                ['price', '价格', 'number'],
                ['sortOrder', '排序', 'number'],
              ] as [keyof typeof emptySpec, string, string][]).map(([key, label, type]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input type={type} value={(specForm as Record<string, unknown>)[key] as string}
                    onChange={e => setSpecForm(f => ({ ...f!, [key]: e.target.value }))}
                    className="w-full rounded-xl bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
              ))}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={specForm.isActive}
                  onChange={e => setSpecForm(f => ({ ...f!, isActive: e.target.checked }))}
                  className="rounded" />
                <span className="text-sm text-gray-300">启用</span>
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setSpecForm(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">取消</button>
              <button onClick={handleSaveSpec} disabled={savingSpec}
                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {savingSpec ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 危险操作确认弹窗 */}
      {confirmDisable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] p-6">
            <h2 className="mb-2 text-lg font-semibold text-red-400">⚠️ 确认操作</h2>
            <p className="text-sm text-gray-400 mb-5">
              {confirmDisable.type === 'product' ? '确认下架该商品？商品将对用户隐藏。' : '确认停用该规格？如果规格下有可用卡密将无法完成操作。'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDisable(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">取消</button>
              <button onClick={async () => {
                if (confirmDisable.type === 'product') await handleDeleteProduct(confirmDisable.id)
                else await handleDisableSpec(confirmDisable.id, confirmDisable.productId!)
              }}
                className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/30">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
