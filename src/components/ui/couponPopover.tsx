import { InfoCircleOutlined } from '@ant-design/icons'
import { Col, Popover, Row } from 'antd'
import dayjs from 'dayjs'
import { isEmpty } from 'lodash'
import { useNavigate } from 'react-router-dom'
import { showAmount } from '../../helpers'
import {
  DiscountCode,
  DiscountCodeBillingType,
  DiscountType
} from '../../shared.types'
import { getDiscountCodeStatusTagById } from '../ui/statusTag'

const Index = ({ coupon }: { coupon?: DiscountCode }) => {
  if (isEmpty(coupon)) {
    return null
  }

  const navigate = useNavigate()
  const goToDetail = () => {
    navigate(`/discount-code/${coupon.id}`)
  }
  return (
    <Popover
      placement="top"
      overlayStyle={{ width: '360px' }}
      title="Discount code detail"
      content={
        <div>
          <Row>
            <Col span={10} className="font-bold text-gray-800">
              Code
            </Col>
            <Col span={14}>
              <span
                onClick={goToDetail}
                className="text-blue-500 hover:cursor-pointer"
              >
                {coupon.code}
              </span>
            </Col>
          </Row>
          <Row>
            <Col span={10} className="font-bold text-gray-800">
              Status
            </Col>
            <Col span={14}>
              {getDiscountCodeStatusTagById(coupon.status as number)}
            </Col>
          </Row>
          <Row>
            <Col span={10} className="font-bold text-gray-800">
              Billing type
            </Col>
            <Col span={14}>
              {coupon.billingType === DiscountCodeBillingType.ONE_TIME
                ? 'One-time'
                : 'Recurring'}
            </Col>
          </Row>
          <Row>
            <Col span={10} className="font-bold text-gray-800">
              Discount type
            </Col>
            <Col span={14}>
              {coupon.discountType === DiscountType.PERCENTAGE
                ? 'Percentage'
                : 'Fixed amount'}
            </Col>
          </Row>
          <Row>
            <Col span={10} className="font-bold text-gray-800">
              Cycle limit
            </Col>
            <Col span={14}>{coupon.cycleLimit}</Col>
          </Row>
          <Row>
            <Col span={10} className="font-bold text-gray-800">
              Discount amt
            </Col>
            <Col span={14}>
              {coupon.discountType === DiscountType.PERCENTAGE
                ? `${coupon.discountPercentage / 100}%`
                : showAmount(coupon.discountAmount, coupon.currency)}
            </Col>
          </Row>
          <Row>
            <Col span={10} className="font-bold text-gray-800">
              Valid range
            </Col>
            <Col span={14}>
              {`${dayjs(coupon.startTime * 1000).format(
                'YYYY-MMM-DD'
              )} ~ ${dayjs(coupon.endTime * 1000).format('YYYY-MMM-DD')} `}
            </Col>
          </Row>
        </div>
      }
    >
      <span style={{ marginLeft: '8px', cursor: 'pointer' }}>
        <InfoCircleOutlined />
      </span>
    </Popover>
  )
}

export default Index
