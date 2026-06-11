'use client'
import { useEffect, useState, useCallback } from 'react'
import { Plus, RefreshCw, Ban, CheckCircle, Search, X } from 'lucide-react'

interface CardItem {
  id: number; productId: number; productName: string
  specId: number | null; specName: string | null
  content: string; status: string
  lockedOrderId: number | null; soldOrderId: number | null
  lockedAt: string | null; soldAt: string | null; createdAt: string
}
interface ProductOption { id: number; name: string; specs: { id: number; name: string }[] }

const STATUS_LABEL: Record<string, string> = {
  AVAILABLE: '可用', LOCKED: '锁定', SOLD: '已售', DISABLED: '禁用',
}
const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: 'text-green-400 bg-green-500/15',
  LOCKED: 'text-yellow-400 bg-yellow-500/15',
  SOLD: 'text-blue-400 bg-blue-500/15',
  DISABLED: 'text-gray-500 bg-gray-500/15',
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg">
      {msg}
    </div>
  )
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [products, setProducts] = useState<ProductOption[]>([])
  const [filterProduct, setFilterProduct] = useState('')
  const [filterSpec, setFilterSpec] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importProduct, setImportProduct] = useState('')
  const [importSpec, setImportSpec] = useState('')
  const [importContent, setImportContent] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; total: number } | null>(null)
  const [toast, setToast] = useState('')
  const [confirmId, setConfirmId] = useState<{ id: number; action: 'disable' | 'enable' } | null>(null)
  const [loading, setLoading] = useState(false)

  const showToast = (msg: string) => setToast(msg)

  async function loadProducts() {
    const data = await fetch('/api/admin/products').then(r => r.json())
    if (Array.isArray(data)) setProducts(data)
  }

  const loadCards = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (filterProduct) params.set('productId', filterProduct)
      if (filterSpec) params.set('specId', filterSpec)
      if (filterStatus) params.set('status', filterStatus)
      if (keyword) params.set('keyword', keyword)
      const data = await fetch(`/api/admin/cards?${params}`).then(r => r.json())
      setCards(data.list ?? [])
      setTotal(data.total ?? 0)
    } finally { setLoading(false) }
  }, [page, filterProduct, filterSpec, filterStatus, keyword])

  useEffect(() => { loadProducts() }, [])
  useEffect(() => { loadCards() }, [loadCards])

  const selectedProductSpecs = products.find(p => String(p.id) === filterProduct)?.specs ?? []
  const importProductSpecs = products.find(p => String(p.id) === importProduct)?.specs ?? []

  async function handleImport() {
    if (!importProduct) { showToast('请选择商品'); return }
    if (!importContent.trim()) { showToast('请填写卡密内容'); return }
    setImporting(true)
    setImportResult(null)
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: Number(importProduct),
          specId: importSpec ? Number(importSpec) : null,
          content: importContent,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error ?? '导入失败'); return }
      setImportResult(data)
      setImportContent('')
      showToast(`导入成功：${data.imported} 条，跳过重复 ${data.skipped} 条`)
      await loadCards()
      await loadProducts()
    } finally { setImporting(false) }
  }

  async function handleToggleStatus(id: number, action: 'disable' | 'enable') {
    const res = await fetch(`/api/admin/cards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action === 'disable' ? 'DISABLED' : 'AVAILABLE' }),
    })
    const data = await res.json()
    if (!res.ok) { showToast(data.error ?? '操作失败'); return }
    showToast(action === 'disable' ? '卡密已禁用' : '卡密已恢复')
    setConfirmId(null)
    await loadCards()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      {toast && <Toast msg={toast} onClose={() => setToast('')} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">卡密库存</h1>
          <p className="text-xs text-gray-500 mt-0.5">共 {total} 条卡密</p>
        </div>
        <button onClick={() => { setImportOpen(true); setImportResult(null) }}
          className="flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600">
          <Plus size={16} /> 批量导入
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-2">
        <select value={filterProduct} onChange={e => { setFilterProduct(e.target.value); setFilterSpec(''); setPage(1) }}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none min-w-[120px]">
          <option value="">全部商品</option>
          {products.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
        </select>
        <select value={filterSpec} onChange={e => { setFilterSpec(e.target.value); setPage(1) }}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none min-w-[100px]">
          <option value="">全部规格</option>
          {selectedProductSpecs.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
        </select>
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none">
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
          <Search size={14} className="text-gray-500" />
          <input value={keywordInput} onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { setKeyword(keywordInput); setPage(1) } }}
            placeholder="搜索卡密内容 Enter确认"
            className="bg-transparent text-sm text-white outline-none w-44 placeholder:text-gray-600" />
          {keywordInput && (
            <button onClick={() => { setKeywordInput(''); setKeyword(''); setPage(1) }}>
              <X size={12} className="text-gray-500" />
            </button>
          )}
        </div>
        <button onClick={() => loadCards()} className="rounded-xl bg-white/5 border border-white/10 p-2 text-gray-400 hover:text-white">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* 卡密列表 */}
      <div className="rounded-2xl border border-white/10 bg-[#111] overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10 text-gray-500">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">商品</th>
              <th className="px-4 py-3 text-left">规格</th>
              <th className="px-4 py-3 text-left">卡密内容</th>
              <th className="px-4 py-3 text-center">状态</th>
              <th className="px-4 py-3 text-left">导入时间</th>
              <th className="px-4 py-3 text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">加载中...</td></tr>
            ) : cards.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-600">暂无卡密</td></tr>
            ) : cards.map(c => (
              <tr key={c.id} className="hover:bg-white/3">
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{c.id}</td>
                <td className="px-4 py-3 text-gray-300 max-w-[120px] truncate">{c.productName}</td>
                <td className="px-4 py-3 text-gray-400">{c.specName ?? '-'}</td>
                <td className="px-4 py-3 font-mono text-xs text-white max-w-[240px] truncate" title={c.content}>{c.content}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_COLOR[c.status] ?? ''}`}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.createdAt).toLocaleString('zh-CN')}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    {c.status === 'AVAILABLE' && (
                      <button onClick={() => setConfirmId({ id: c.id, action: 'disable' })}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-500/10 hover:text-red-400" title="禁用">
                        <Ban size={14} />
                      </button>
                    )}
                    {c.status === 'DISABLED' && (
                      <button onClick={() => setConfirmId({ id: c.id, action: 'enable' })}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-green-500/10 hover:text-green-400" title="恢复">
                        <CheckCircle size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="rounded-lg px-3 py-1.5 text-sm bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10">上一页</button>
          <span className="text-sm text-gray-500">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="rounded-lg px-3 py-1.5 text-sm bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10">下一页</button>
        </div>
      )}

      {/* 批量导入弹窗 */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">批量导入卡密</h2>
              <button onClick={() => setImportOpen(false)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">选择商品 *</label>
                <select value={importProduct} onChange={e => { setImportProduct(e.target.value); setImportSpec('') }}
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none">
                  <option value="">请选择商品</option>
                  {products.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
                </select>
              </div>
              {importProductSpecs.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">选择规格（商品有规格时建议选择）</label>
                  <select value={importSpec} onChange={e => setImportSpec(e.target.value)}
                    className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none">
                    <option value="">不指定规格</option>
                    {importProductSpecs.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-500 mb-1 block">卡密内容（一行一个）</label>
                <textarea rows={8} value={importContent} onChange={e => setImportContent(e.target.value)}
                  placeholder="一行一个卡密，系统会自动去重，重复卡密会跳过"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-gray-600" />
              </div>
              {importResult && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm">
                  <p className="text-green-400 font-medium">导入完成</p>
                  <p className="text-gray-400 mt-1">成功导入 <span className="text-white">{importResult.imported}</span> 条，跳过重复 <span className="text-yellow-400">{importResult.skipped}</span> 条，共处理 <span className="text-white">{importResult.total}</span> 条</p>
                </div>
              )}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setImportOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">关闭</button>
              <button onClick={handleImport} disabled={importing}
                className="flex-1 rounded-xl bg-blue-500 py-2.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50">
                {importing ? '导入中...' : '开始导入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 危险操作确认弹窗 */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] p-6">
            <h2 className="mb-2 text-lg font-semibold text-red-400">⚠️ 确认操作</h2>
            <p className="text-sm text-gray-400 mb-5">
              {confirmId.action === 'disable' ? '确认禁用该卡密？禁用后将无法被购买。' : '确认恢复该卡密为可用状态？'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm text-gray-400 hover:bg-white/5">取消</button>
              <button onClick={() => handleToggleStatus(confirmId.id, confirmId.action)}
                className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/30">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
