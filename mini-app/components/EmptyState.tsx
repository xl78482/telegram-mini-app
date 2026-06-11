interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          background: '#F0F4F2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {icon || (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7Z" stroke="#32B579" strokeWidth="1.5" />
            <path d="M16 7V5C16 3.9 15.1 3 14 3H10C8.9 3 8 3.9 8 5V7" stroke="#32B579" strokeWidth="1.5" />
            <path d="M12 13V17M10 15H14" stroke="#32B579" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#10201A', marginBottom: 8 }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, color: '#8A9690', lineHeight: 1.6, maxWidth: 240 }}>{description}</div>
      )}
      {action && <div style={{ marginTop: 20 }}>{action}</div>}
    </div>
  );
}
