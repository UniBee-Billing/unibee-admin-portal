import { TGateway } from '@/shared.types'
import { Badge, Modal, Tabs, TabsProps } from 'antd'
import { useState } from 'react'
import EssentialSetup from './essentialSetup'
import PubPriKeySetup from './pubPriKeySetup'
import WebHookSetup from './webHookSetup'

const PaymentGatewaySetupModal = ({
  gatewayConfig,
  closeModal,
  refresh,
  updateGatewayInStore,
  isDuplicateMode = false
}: {
  gatewayConfig: TGateway
  closeModal: () => void
  refresh: () => void
  updateGatewayInStore: () => void
  isDuplicateMode?: boolean
}) => {
  const [activeTab, setActiveTab] = useState('Essentials')
  // Shared state for display name across all tabs
  const [sharedDisplayName, setSharedDisplayName] = useState(
    isDuplicateMode ? `${gatewayConfig.displayName} (Copy)` : gatewayConfig.displayName
  )

  // Shared state for invoice configuration across all tabs
  // In duplicate mode, clear all invoice fields
  const [sharedIssueCompanyName, setSharedIssueCompanyName] = useState(
    isDuplicateMode ? '' : (gatewayConfig.companyIssuer?.issueCompanyName || '')
  )
  const [sharedIssueAddress, setSharedIssueAddress] = useState(
    isDuplicateMode ? '' : (gatewayConfig.companyIssuer?.issueAddress || '')
  )
  const [sharedIssueRegNumber, setSharedIssueRegNumber] = useState(
    isDuplicateMode ? '' : (gatewayConfig.companyIssuer?.issueRegNumber || '')
  )
  const [sharedIssueVatNumber, setSharedIssueVatNumber] = useState(
    isDuplicateMode ? '' : (gatewayConfig.companyIssuer?.issueVatNumber || '')
  )
  const [sharedIssueLogo, setSharedIssueLogo] = useState(
    isDuplicateMode ? '' : (gatewayConfig.companyIssuer?.issueLogo || '')
  )

  // Shared state for keys/secrets across all tabs
  // In duplicate mode, clear keys so user can input new ones
  const [sharedGatewayKey, setSharedGatewayKey] = useState(
    isDuplicateMode ? '' : (gatewayConfig.gatewayKey || '')
  )
  const [sharedGatewaySecret, setSharedGatewaySecret] = useState(
    isDuplicateMode ? '' : (gatewayConfig.gatewaySecret || '')
  )
  const [sharedSubGateway, setSharedSubGateway] = useState(
    isDuplicateMode ? '' : (gatewayConfig.subGateway || '')
  )
  const [sharedPaymentTypes, setSharedPaymentTypes] = useState(
    isDuplicateMode ? undefined : gatewayConfig.gatewayPaymentTypes
  )
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
          isDuplicateMode={isDuplicateMode}
          sharedDisplayName={sharedDisplayName}
          setSharedDisplayName={setSharedDisplayName}
          sharedIssueCompanyName={sharedIssueCompanyName}
          setSharedIssueCompanyName={setSharedIssueCompanyName}
          sharedIssueAddress={sharedIssueAddress}
          setSharedIssueAddress={setSharedIssueAddress}
          sharedIssueRegNumber={sharedIssueRegNumber}
          setSharedIssueRegNumber={setSharedIssueRegNumber}
          sharedIssueVatNumber={sharedIssueVatNumber}
          setSharedIssueVatNumber={setSharedIssueVatNumber}
          sharedIssueLogo={sharedIssueLogo}
          setSharedIssueLogo={setSharedIssueLogo}
          sharedGatewayKey={sharedGatewayKey}
          sharedGatewaySecret={sharedGatewaySecret}
          sharedSubGateway={sharedSubGateway}
          sharedPaymentTypes={sharedPaymentTypes}
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
          isDuplicateMode={isDuplicateMode}
          sharedDisplayName={sharedDisplayName}
          sharedIssueCompanyName={sharedIssueCompanyName}
          sharedIssueAddress={sharedIssueAddress}
          sharedIssueRegNumber={sharedIssueRegNumber}
          sharedIssueVatNumber={sharedIssueVatNumber}
          sharedIssueLogo={sharedIssueLogo}
          sharedGatewayKey={sharedGatewayKey}
          setSharedGatewayKey={setSharedGatewayKey}
          sharedGatewaySecret={sharedGatewaySecret}
          setSharedGatewaySecret={setSharedGatewaySecret}
          sharedSubGateway={sharedSubGateway}
          setSharedSubGateway={setSharedSubGateway}
          sharedPaymentTypes={sharedPaymentTypes}
          setSharedPaymentTypes={setSharedPaymentTypes}
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
          isDuplicateMode={isDuplicateMode}
          sharedDisplayName={sharedDisplayName}
        />
      )
    }
  ]

  return (
    <Modal
      title={
        isDuplicateMode
          ? `Duplicate gateway configuration for ${gatewayConfig.name}`
          : gatewayConfig.IsSetupFinished
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
            (gatewayConfig.gatewayWebhookIntegrationLink != '' &&
              gatewayConfig.gatewayWebhookIntegrationLink != undefined)
        )}
      />
    </Modal>
  )
}

export default PaymentGatewaySetupModal
