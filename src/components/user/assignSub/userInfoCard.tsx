import { IProfile, WithStyle } from '../../../shared.types'
import { formatUserName } from '../../../utils'

export interface UserInfoCardProps {
  user: IProfile
}

interface UserInfoItemProps {
  title: string
  value?: number | string | null
}

const UserInfoItem = ({ title, value = '' }: UserInfoItemProps) => (
  <div className="flex items-center">
    <div className="w-16 font-bold">{title}</div>
    <div>{value}</div>
  </div>
)

export const UserInfoCard = ({
  user,
  className
}: WithStyle<UserInfoCardProps>) => (
  <div className={className}>
    <UserInfoItem title="User Id" value={user.id} />
    <UserInfoItem title="Name" value={formatUserName(user)} />
    <UserInfoItem title="Email" value={user.email} />
  </div>
)
