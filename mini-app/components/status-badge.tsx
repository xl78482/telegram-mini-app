const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: '待付款',  bg: '#FFF3E8', color: '#E07B2A' },
  PAID:       { label: '已支付',  bg: '#E8F0FF', color: '#3B6FE0' },
  PROCESSING: { label: '处理中',  bg: '#E8F0FF', color: '#3B6FE0' },
  COMPLETED:  { label: '已完成',  bg: '#E8F7F0', color: '#2EA66F' },
  CANCELLED:  { label: '已取消',  bg: '#F0F0F0', color: '#8A9690' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, bg: '#F0F0F0', color: '#8A9690' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: s.bg, color: s.color,
      fontSize: 12, fontWeight: 600,
      padding: '4px 10px', borderRadius: 999,
    }}>
      {s.label}
    </span>
  )
}
