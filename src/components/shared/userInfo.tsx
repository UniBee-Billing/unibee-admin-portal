import { Button, Col, Row } from 'antd'
import { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { IProfile } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { UserStatusTag } from '../ui/statusTag'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '30px',
  color: '#757575'
}
const Index = ({ user }: { user: IProfile | undefined }) => {
  const appConfig = useAppConfigStore()
  const navigate = useNavigate()
  const goToUserProfile = () => {
    if (user != undefined) {
      navigate(`/user/${user?.id}`)
    }
  }
  return (
    <div style={{ marginBottom: '24px' }}>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>User Id/External Id</span>
        </Col>
        <Col span={20}>
          {user == undefined ? (
            ''
          ) : (
            <>
              <Button
                type="link"
                onClick={goToUserProfile}
                style={{ padding: 0 }}
              >
                {`${user?.id} / ${user?.externalUserId == '' ? '―' : user?.externalUserId}`}
              </Button>{' '}
              {UserStatusTag(user.status)}
            </>
          )}
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>First/Last Name</span>
        </Col>
        <Col span={6}>
          {user == undefined ? '' : `${user?.firstName} ${user?.lastName}`}
        </Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Email</span>
        </Col>
        <Col span={6}>
          <a href={`mailto:${user?.email}`}>{user?.email} </a>
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Phone</span>
        </Col>
        <Col span={6}>{user?.phone}</Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Country</span>
        </Col>
        <Col span={6}>{user?.countryName}</Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Billing Address</span>
        </Col>
        <Col span={6}>{user?.address}</Col>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>Default Payment Method</span>
        </Col>
        <Col span={6}>
          {
            appConfig.gateway.find((g) => g.gatewayId == user?.gatewayId)
              ?.displayName
          }
        </Col>
      </Row>
      <Row style={rowStyle}>
        <Col span={4}>
          <span style={{ fontWeight: 'bold' }}>VAT Number</span>
        </Col>
        <Col span={6}>{user?.vATNumber}</Col>
      </Row>
    </div>
  )
}

export default Index
