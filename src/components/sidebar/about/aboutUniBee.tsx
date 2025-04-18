import UniBeeLogo from '@/assets/UniBeeLogo2.svg?react'
import { useLicense, useVersion } from '@/hooks/useVersion'
import { useMerchantMemberProfileStore } from '@/stores'
import { withWeakTextLoading, writeClipboardText } from '@/utils'
import { Alert, Button, ConfigProvider, Modal } from 'antd'
import React, { useState } from 'react'
import LogoWithAction from '../logoWithAction'
import { ContactCard } from './ContactCard'

const modalStyle = {
  mask: {
    backdropFilter: 'blur(10px)'
  }
}

const APP_PATH = import.meta.env.BASE_URL

export const AboutUniBee: React.FC<{ collapsed: boolean }> = ({
  collapsed
}) => {
  const [open, setOpen] = useState(false)
  const {
    loading: loadingVersion,
    data: version,
    error: fetchVersionError
  } = useVersion()
  const {
    loading: loadingLicense,
    license,
    licenseName,
    error: fetchLicenseError
  } = useLicense()
  const profile = useMerchantMemberProfileStore()

  return (
    <ConfigProvider modal={{ styles: modalStyle }}>
      <div className="mb-1 mt-4 w-full">
        <LogoWithAction
          collapsed={collapsed}
          clickHandler={() => setOpen(true)}
          text="About UniBee"
          logo={<UniBeeLogo />}
          // logoColor="text-gray-400"
        />
      </div>
      <Modal open={open} onCancel={() => setOpen(false)} footer={[]}>
        {(fetchVersionError || fetchLicenseError) && (
          <Alert
            className="mt-6"
            message="Please check your network and try again"
            type="error"
            showIcon
          />
        )}
        <div className="mt-6 flex flex-col items-center">
          <img src={`${APP_PATH}UniBeeLogo.png`} className="w-36" />
          <div className="mt-1 text-xs opacity-60">
            {withWeakTextLoading(version, loadingVersion)}
          </div>
          <div className="mt-1 text-xs opacity-60">{profile.email}</div>
          <div className="mt-1 text-xs opacity-60">
            {withWeakTextLoading(licenseName, loadingLicense)}
          </div>
        </div>
        <div className="mt-5 flex justify-center">
          {license && (
            <Button
              type="primary"
              ghost
              onClick={() => writeClipboardText(license)}
            >
              Copy LICENSE
            </Button>
          )}
        </div>
        <div className="my-6 flex justify-center">
          <ContactCard
            alt="Telegram"
            icon="telegram"
            link="https://t.me/+xncwy-uZFE1lMTI0"
          />
          <ContactCard
            alt="Official website"
            icon="roamresearch"
            link="https://unibee.dev"
          />
          <ContactCard
            alt="Documentation"
            icon="readthedocs"
            link="https://docs.unibee.dev"
          />
          <ContactCard
            alt="GitHub"
            icon="github"
            link="https://github.com/UniBee-Billing"
          />
        </div>
        <div className="mt-2 flex justify-center text-xs text-gray-500">
          Encounter any issues? Contact us at
          <a href={'mailto://help@unibee.dev'} className="ml-1">
            help@unibee.dev
          </a>
        </div>
      </Modal>
    </ConfigProvider>
  )
}
