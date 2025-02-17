import { Col, Divider, Form, Radio, Row, Space, Switch } from 'antd'
import {
  DiscountCode,
  DiscountCodeStatus,
  DiscountCodeUserScope
} from '../../../shared.types'
import { DISCOUNT_CODE_UPGRADE_SCOPE } from '../helpers'

const Index = ({
  code,
  watchAdvancedConfig,
  canActiveItemEdit
}: {
  code: DiscountCode
  watchAdvancedConfig: boolean
  canActiveItemEdit: (status?: DiscountCodeStatus) => boolean
}) => {
  return (
    <div className="w-2/3 pt-4">
      <Row
        className="border-1 mb-3 flex h-16 items-center rounded-lg border-solid border-[#D9D9D9] bg-[#FAFAFA]"
        gutter={[8, 8]}
      >
        <Col span={20}>
          <div className="ml-2">
            Enable advanced configuration with one click
          </div>
        </Col>
        <Col span={4} style={{ textAlign: 'right' }}>
          {' '}
          <Form.Item name="advance" noStyle={true}>
            <Switch disabled={!canActiveItemEdit(code?.status)} />
          </Form.Item>
        </Col>
      </Row>
      <div className="mb-2 mt-6">Discount Code Applicable Scope</div>
      <Form.Item name="userScope">
        <Radio.Group
          disabled={!watchAdvancedConfig || !canActiveItemEdit(code?.status)}
        >
          <Space direction="vertical">
            <Radio value={DiscountCodeUserScope.ALL_USERS}>Apply for all</Radio>
            <Radio value={DiscountCodeUserScope.NEW_USERS}>
              Apply only for new users
            </Radio>
            <Radio value={DiscountCodeUserScope.RENEWAL_USERS}>
              Apply only for renewals
            </Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
      <Divider style={{ margin: '24px 0' }} />{' '}
      <div className="mb-2 mt-6">Applicable Subscription Limits</div>
      <Form.Item name="upgradeScope">
        <Radio.Group
          disabled={!watchAdvancedConfig || !canActiveItemEdit(code?.status)}
        >
          <Space direction="vertical">
            <Radio value={DISCOUNT_CODE_UPGRADE_SCOPE.ALL}>Apply for all</Radio>
            <Radio value={DISCOUNT_CODE_UPGRADE_SCOPE.UPGRADE_ONLY}>
              Apply only for upgrades (same recurring cycle)
            </Radio>
            <Radio value={DISCOUNT_CODE_UPGRADE_SCOPE.LONGER_ONLY}>
              Apply only for switching to any long subscriptions
            </Radio>
          </Space>
        </Radio.Group>
      </Form.Item>
      <Divider style={{ margin: '24px 0' }} />{' '}
      <Row>
        <Col span={20} className="flex items-center">
          Same user cannot use the same discount code again
        </Col>
        <Col span={4} className="flex items-center justify-end">
          <Form.Item name="userLimit" noStyle={true}>
            <Switch
              disabled={
                !watchAdvancedConfig || !canActiveItemEdit(code?.status)
              }
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  )
}

export default Index
