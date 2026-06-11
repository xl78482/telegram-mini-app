const statusMap: Record<string, { label: string; className: string }> = {
  PENDING:    { label: '待支付',  className: 'bg-yellow-500/15 text-yellow-400' },
  PAID:       { label: '已支付',  className: 'bg-blue-500/15 text-blue-400' },
  PROCESSING: { label: '处理中',  className: 'bg-purple-500/15 text-purple-400' },
  COMPLETED:  { label: '已完成',  className: 'bg-green-500/15 text-green-400' },
  CANCELLED:  { label: '已取消',  className: 'bg-gray-500/15 text-gray-400' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, className: 'bg-gray-500/15 text-gray-400' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>
      {s.label}
    </span>
  )
}
