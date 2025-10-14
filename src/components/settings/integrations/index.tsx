import ExchangeRateLogo from '@/assets/integrationsKeysIcon/ExchangeRateService.svg?react'
import SegmentLogo from '@/assets/integrationsKeysIcon/Segment.svg?react'
import SendGridLogo from '@/assets/integrationsKeysIcon/SendGrid.svg?react'
import UniBeeLogo from '@/assets/integrationsKeysIcon/UniBeeKeys.svg?react'
import VATsenseLogo from '@/assets/integrationsKeysIcon/VATsense.svg?react'
import { useAppConfigStore } from '@/stores'
import { CheckOutlined, ExclamationOutlined } from '@ant-design/icons'
import { Avatar, Button, List, Tag } from 'antd'
import { ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import UniBeeAPIKeyModal from './UniBeeAPIKeyModal'
import ExchangeRateModal from './exchangeRateKeyModal'
import SegmentModal from './segmentModal'
import SendGridModal from './sendGridKeyModal'
import VATModal from './vatKeyModal'

type TAPP_Integration = {
  IsSetupFinished: boolean
  name: string
  description: string
  logo: ReactNode
  gatewayWebsiteLink: string
  keyName: string | string[]
  keyValue: string | string[]
  compositeKey?: boolean
}

const Index = () => {
  const [itemIndex, setItemIndex] = useState(-1)
  const [openSetupModal, setOpenSetupModal] = useState(false)
  const navigate = useNavigate()
  
  const toggleSetupModal = (itemIndex?: number) => {
    setOpenSetupModal(!openSetupModal)
    if (typeof itemIndex == 'number') {
      setItemIndex(itemIndex)
    }
  }

  const integration_items: TAPP_Integration[] = [
    {
      IsSetupFinished: false,
      name: 'UniBee API Key',
      description:
        'Use public and private keys to secure the bank card payment.',
      logo: <UniBeeLogo />,
      gatewayWebsiteLink: '',
      keyName: 'openApiKey',
      keyValue: ''
    },
    {
      IsSetupFinished: false,
      name: 'VAT Sense Key',
      description: 'Use this key to calculate VAT for your payment.',
      logo: <VATsenseLogo />,
      gatewayWebsiteLink: 'https://vatsense.com',
      keyName: 'vatSenseKey',
      keyValue: ''
    },
    {
      IsSetupFinished: false,
      name: 'SendGrid Email Key',
      description: 'Use this key to send email to your customers.',
      logo: <SendGridLogo />,
      gatewayWebsiteLink: 'https://sendgrid.com/',
      keyName: 'sendGridKey',
      keyValue: ''
    },
    {
      IsSetupFinished: false,
      name: 'Segment setup',
      description: 'Use these server/client keys to track user behavior.',
      logo: <SegmentLogo />,
      gatewayWebsiteLink: 'https://segment.com/',
      keyName: ['segmentServerSideKey', 'segmentUserPortalKey'],
      keyValue: ['', ''],
      compositeKey: true
    },
    // Exchange API key - commented out as requested
    // {
    //   IsSetupFinished: false,
    //   name: 'Exchange API key',
    //   description:
    //     'Use it to access Exchange, allowing for secure ops and user behavior tracking.',
    //   logo: <ExchangeRateLogo />,
    //   gatewayWebsiteLink: '',
    //   keyName: 'exchangeRateApiKey',
    //   keyValue: ''
    // }
  ]

  const initializeKeys = (keyName: string, keyValue: string) => {
    if (
      keyName == 'segmentServerSideKey' &&
      keyValue != '' &&
      keyValue != null
    ) {
      const keyIdx = integration_items.findIndex((i) => i.compositeKey)
      if (keyIdx >= 0) {
        integration_items[keyIdx].IsSetupFinished = true
        ;(integration_items[keyIdx].keyValue as string[])[0] = keyValue
      }
      return
    }

    if (
      keyName == 'segmentUserPortalKey' &&
      keyValue != '' &&
      keyValue != null
    ) {
      const keyIdx = integration_items.findIndex((i) => i.compositeKey)
      if (keyIdx >= 0) {
        integration_items[keyIdx].IsSetupFinished = true
        ;(integration_items[keyIdx].keyValue as string[])[1] = keyValue
      }
      return
    }

    if (keyValue != '' && keyValue != null) {
      const keyIdx = integration_items.findIndex((i) => i.keyName == keyName)
      integration_items[keyIdx].IsSetupFinished = true
      integration_items[keyIdx].keyValue = keyValue
    }
  }

  const appConfigStore = useAppConfigStore()
  const {
    openApiKey,
    sendGridKey,
    vatSenseKey,
    segmentServerSideKey,
    segmentUserPortalKey,
    exchangeRateApiKey
  } = appConfigStore.integrationKeys

  initializeKeys('openApiKey', openApiKey)
  initializeKeys('sendGridKey', sendGridKey)
  initializeKeys('vatSenseKey', vatSenseKey)
  // initializeKeys('exchangeRateApiKey', exchangeRateApiKey) // Commented out
  initializeKeys('segmentServerSideKey', segmentServerSideKey)
  initializeKeys('segmentUserPortalKey', segmentUserPortalKey)

  const [integrationList] = useState<TAPP_Integration[]>(integration_items)

  return (
    <div>
      {openSetupModal && integrationList[itemIndex].keyName == 'openApiKey' && (
        <UniBeeAPIKeyModal closeModal={toggleSetupModal} />
      )}
      {openSetupModal &&
        integrationList[itemIndex].keyName == 'vatSenseKey' && (
          <VATModal closeModal={toggleSetupModal} />
        )}
      {openSetupModal && integrationList[itemIndex].compositeKey && (
        <SegmentModal
          serverSideKey=""
          refresh={() => {}}
          closeModal={toggleSetupModal}
        />
      )}

      {openSetupModal &&
        integrationList[itemIndex].keyName == 'sendGridKey' && (
          <SendGridModal closeModal={toggleSetupModal} />
        )}

      {/* Exchange API key modal - commented out */}
      {/* {openSetupModal &&
        integrationList[itemIndex].keyName == 'exchangeRateApiKey' && (
          <ExchangeRateModal closeModal={toggleSetupModal} />
        )} */}

      <List
        itemLayout="horizontal"
        dataSource={integrationList}
        renderItem={(item, index) => (
          <List.Item className="rounded-md hover:bg-gray-100">
            <div className="flex w-full items-center gap-4">
              {/* Logo */}
              <div className="ml-3 flex items-center">
                {item.gatewayWebsiteLink == '' ? (
                  <Avatar shape="square" src={item.logo} size={48} />
                ) : (
                  <a href={item.gatewayWebsiteLink} target="_blank">
                    <Avatar shape="square" src={item.logo} size={48} />
                  </a>
                )}
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col gap-1">
                {item.IsSetupFinished ? (
                  <Tag icon={<CheckOutlined />} color="#34C759" className="w-fit">
                    Ready
                  </Tag>
                ) : (
                  <Tag icon={<ExclamationOutlined />} color="#AEAEB2" className="w-fit">
                    Not Set
                  </Tag>
                )}
                <div className="text-base font-medium">
                  {item.gatewayWebsiteLink == '' ? (
                    <span>{item.name}</span>
                  ) : (
                    <a href={item.gatewayWebsiteLink} target="_blank" className="text-blue-600 hover:text-blue-700">
                      {item.name}
                    </a>
                  )}
                </div>
                <div className="text-sm text-gray-500">{item.description}</div>
              </div>

              {/* Buttons */}
              <div className="mr-3 flex items-center justify-end gap-2">
                {item.name === 'SendGrid Email Key' && item.IsSetupFinished && (
                  <Button
                    onClick={() => navigate('/configuration/integrations/sendgrid/records')}
                    type="default"
                  >
                    View Records
                  </Button>
                )}
                {item.name === 'VAT Sense Key' && item.IsSetupFinished && (
                  <Button
                    onClick={() => navigate('/configuration/integrations/vat-sense')}
                    type="default"
                  >
                    Manage
                  </Button>
                )}
                <Button
                  onClick={() => toggleSetupModal(index)}
                  type={item.IsSetupFinished ? 'default' : 'primary'}
                >
                  {item.IsSetupFinished ? 'Edit' : 'Set up'}
                </Button>
              </div>
            </div>
          </List.Item>
        )}
      />
    </div>
  )
}
export default Index
