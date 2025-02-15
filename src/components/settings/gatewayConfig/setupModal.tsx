import { Badge, Modal, Tabs, TabsProps } from 'antd'
import { useState } from 'react'
import { TGateway } from '../../../shared.types'
import EssentialSetup from './EssentialSetup'
import PubPriKeySetup from './PubPriKeySetup'
import WebHookSetup from './WebHookSetup'

const PaymentGatewaySetupModal = ({
  gatewayConfig,
  closeModal,
  refresh,
  updateGatewayInStore
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  refresh: () => void
  updateGatewayInStore: () => void
}) => {
  const [activeTab, setActiveTab] = useState('Essentials')
  const needWebHook = ['changelly', 'unitpay', 'payssion'] // these 3 gateways need webhook config
  const tabItems: TabsProps['items'] = [
    {
      key: 'Essentials',
      label: (
        <span>
          {' '}
          <Badge
            count={1}
            color={`#1890ff${activeTab == 'Essentials' ? '' : '90'}`}
          />{' '}
          Essentials
        </span>
      ),
      children: (
        <EssentialSetup
          gatewayConfig={gatewayConfig}
          closeModal={closeModal}
          refresh={refresh}
          updateGatewayInStore={updateGatewayInStore}
        />
      )
    },
    {
      key: 'Public/Private Keys',
      label: (
        <span>
          <Badge
            count={2}
            color={`#1890ff${activeTab == 'Public/Private Keys' ? '' : '90'}`}
          />{' '}
          Public/Private Keys
        </span>
      ),
      children: (
        <PubPriKeySetup
          gatewayConfig={gatewayConfig}
          closeModal={closeModal}
          refresh={refresh}
          updateGatewayInStore={updateGatewayInStore}
        />
      )
    },
    {
      key: 'Webhook Keys',
      label: (
        <span>
          <Badge
            count={3}
            color={`#1890ff${activeTab == 'Webhook Keys' ? '' : '90'}`}
          />
          &nbsp; Webhook Keys{' '}
        </span>
      ),
      children: (
        <WebHookSetup
          gatewayConfig={gatewayConfig}
          closeModal={closeModal}
          refresh={refresh}
          updateGatewayInStore={updateGatewayInStore}
        />
      )
    }
  ]

  return (
    <Modal
      title={
        gatewayConfig.IsSetupFinished
          ? `Editing keys for ${gatewayConfig.name}`
          : `New keys for ${gatewayConfig.name}`
      }
      width={'680px'}
      open={true}
      footer={null}
      closeIcon={null}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems.filter(
          (t) =>
            t.key != 'Webhook Keys' ||
            needWebHook.find((w) => w == gatewayConfig.gatewayName) != undefined
        )}
      />
    </Modal>
  )
}

export default PaymentGatewaySetupModal
