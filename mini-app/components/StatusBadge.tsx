const statusMap: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: '待付款',  bg: '#FFF3E8', color: '#E07B2A' },
  PAID:       { label: '已支付',  bg: '#EBF3FF', color: '#3B6FE0' },
  PROCESSING: { label: '处理中',  bg: '#EBF3FF', color: '#3B6FE0' },
  COMPLETED:  { label: '已完成',  bg: '#E8F7F0', color: '#2EA66F' },
  CANCELLED:  { label: '已取消',  bg: '#F2F2F2', color: '#8A9690' },
  TIMEOUT:    { label: '超时取消', bg: '#F2F2F2', color: '#8A9690' },
  USER_CANCEL: { label: '用户取消', bg: '#F2F2F2', color: '#8A9690' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = statusMap[status] ?? { label: status, bg: '#F2F2F2', color: '#8A9690' }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: s.bg,
      color: s.color,
      fontSize: 12,
      fontWeight: 700,
      padding: '4px 11px',
      borderRadius: 999,
      letterSpacing: 0.2,
    }}>
      {s.label}
    </span>
  )
}
