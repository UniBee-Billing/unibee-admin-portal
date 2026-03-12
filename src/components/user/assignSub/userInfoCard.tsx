import { IProfile } from '../../../shared.types'

export interface UserInfoCardProps {
  user: IProfile
}

export const UserInfoCard = ({ user }: { user: IProfile }) => (
  <div
    style={{
      background: '#e5e7eb',
      border: '1px solid #e5e7eb',
      borderRadius: 8,
      padding: '16px 24px',
      display: 'flex',
      gap: 24
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 2 }}>User ID</div>
      <div style={{ color: '#1f2937', fontSize: 14, fontWeight: 500 }}>{user.id}</div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 2 }}>Name</div>
      <div style={{ color: '#1f2937', fontSize: 14, fontWeight: 500 }}>{`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || '-'}</div>
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ color: '#9ca3af', fontSize: 12, marginBottom: 2 }}>Email</div>
      <div style={{ color: '#1f2937', fontSize: 14, fontWeight: 500 }}>{user.email}</div>
    </div>
  </div>
)
