import { Col, Row } from 'antd'
import { IProfile } from '../../../shared.types'

export interface UserInfoCardProps {
  user: IProfile
}

export const UserInfoCard = ({ user }: { user: IProfile }) => (
  <Row className="text-gray-600">
    <Col span={8}>
      <span>User Id: </span> <span>{user.id}</span>{' '}
    </Col>
    <Col span={8}>
      <span>Name: </span> <span>{`${user.firstName} ${user.lastName}`}</span>{' '}
    </Col>
    <Col span={8}>
      <span>Email: </span> <span>{user.email}</span>{' '}
    </Col>
  </Row>
)
