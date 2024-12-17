import {
  InfoCircleOutlined,
  LoadingOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  Button,
  Col,
  Empty,
  Modal,
  Popover,
  Row,
  Spin,
  Switch,
  Tooltip,
  message
} from 'antd'
import dayjs from 'dayjs'
import { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { normalizeSub, showAmount } from '../../helpers'
import { getSubDetailInProductReq } from '../../requests'
import { IProfile, ISubscriptionType, TPromoAccount } from '../../shared.types'
import { SubscriptionStatus } from '../ui/statusTag'
import { AssignSubscriptionModal } from './assignSub/assignSubModal'

const Index = ({ userDetail }: { userDetail: IProfile | undefined }) => {
  const [promoAccount, setPromoAccount] = useState<TPromoAccount[]>(
    userDetail == undefined ||
      userDetail.promoCreditAccounts == undefined ||
      userDetail.promoCreditAccounts.length == 0
      ? []
      : userDetail.promoCreditAccounts
  )
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const toggleModal = () => setModalOpen(!modalOpen)
  const getUserProfile = () => {}

  return (
    <>
      {modalOpen && (
        <UpdatePromoCreditModal
          closeModal={toggleModal}
          refresh={getUserProfile}
        />
      )}
      <div className="flex flex-col gap-4">
        <Row>
          <Col span={6}>Enable Promo credit usage</Col>
          <Col span={4}>
            <Switch />
          </Col>
        </Row>

        <Row>
          <Col span={6}>Total Added</Col>
          <Col span={4}> </Col>
        </Row>

        <Row>
          <Col span={6}>Total Used</Col>
          <Col span={4}> </Col>
        </Row>

        <Row>
          <Col span={6}>Promo Credit Balance</Col>
          <Col span={4}></Col>
          <Col span={4}>
            <Button onClick={toggleModal}>Update Promo Credit</Button>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default Index
const UpdatePromoCreditModal = ({
  closeModal,
  refresh
}: {
  closeModal: () => void
  refresh: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const onOK = () => {
    closeModal()
  }

  return (
    <Modal
      title="Update promo credits quantity"
      open={true}
      width={'640px'}
      footer={null}
      closeIcon={null}
    >
      <div
        className="flex items-center justify-end gap-4"
        style={{
          marginTop: '24px'
        }}
      >
        <Button onClick={closeModal} disabled={loading}>
          Cancel
        </Button>
        <Button
          type="primary"
          onClick={onOK}
          loading={loading}
          disabled={loading}
        >
          OK
        </Button>
      </div>
    </Modal>
  )
}
