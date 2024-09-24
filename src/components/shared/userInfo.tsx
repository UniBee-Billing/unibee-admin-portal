import { Col, Row } from 'antd'
import { CSSProperties } from 'react'
import { IProfile } from '../../shared.types'
import { useAppConfigStore } from '../../stores'
import { UserStatus } from '../ui/statusTag'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  height: '24px',
  color: '#757575'
}
const Index = ({ user }: { user: IProfile | undefined }) => {
  const appConfig = useAppConfigStore()
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
              {`${user?.id} / ${user?.externalUserId == '' ? '―' : user?.externalUserId}`}
              &nbsp;&nbsp;
              {UserStatus(user.status)}
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
          <span style={{ fontWeight: 'bold' }}>Payment Method</span>
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
