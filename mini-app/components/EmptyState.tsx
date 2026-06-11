import { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon = '📦', title, description, action }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      gap: 12,
    }}>
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 24,
        background: '#F0F0F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 38,
        marginBottom: 4,
      }}>{icon}</div>
      <p style={{ fontSize: 17, fontWeight: 700, color: '#10201A' }}>{title}</p>
      {description && (
        <p style={{ fontSize: 14, color: '#8A9690', textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>{description}</p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
