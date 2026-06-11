interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📦', title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: '#F0F0F0', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 36, marginBottom: 16,
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 16, fontWeight: 700, color: '#10201A', marginBottom: 6 }}>{title}</p>
      {description && <p style={{ fontSize: 13, color: '#8A9690', lineHeight: 1.5, maxWidth: 220 }}>{description}</p>}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  )
}
