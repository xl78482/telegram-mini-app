interface StatusBadgeProps {
  status: string;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  PENDING:    { label: '待付款', bg: '#FFF4E5', color: '#F59E0B' },
  PAID:       { label: '已支付', bg: '#EEF3FF', color: '#4F74E8' },
  PROCESSING: { label: '处理中', bg: '#EEF3FF', color: '#4F74E8' },
  COMPLETED:  { label: '已完成', bg: '#E8F7EE', color: '#2EA66F' },
  CANCELLED:  { label: '已取消', bg: '#F5F5F5', color: '#8A9690' },
  TIMEOUT:    { label: '超时取消', bg: '#F5F5F5', color: '#8A9690' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, bg: '#F5F5F5', color: '#8A9690' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: config.bg,
        color: config.color,
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  );
}
