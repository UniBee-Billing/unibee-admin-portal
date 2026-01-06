import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Select } from 'antd'
import AuthAppIcons from '../../assets/AuthApp.svg'

interface AuthenticatorOption {
  value: number
  label: string
}

interface TwoFactorQRCodeProps {
  value: string
  secretKey: string
  accountName?: string
  authenticatorOptions?: AuthenticatorOption[]
  selectedAuthenticator?: number
  onAuthenticatorChange?: (value: number) => void
}

const TwoFactorQRCode = ({
  value,
  secretKey,
  accountName = 'your.email@example.com',
  authenticatorOptions = [],
  selectedAuthenticator = 1,
  onAuthenticatorChange
}: TwoFactorQRCodeProps) => {
  const [showManualEntry, setShowManualEntry] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p
        style={{
          color: '#374151',
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: '26px',
          marginBottom: '12px',
          marginTop: '72px'
        }}
      >
        Use the following app to scan the QR code shown on the right
      </p>
      <div
        style={{
          height: '134px',
          maxWidth: '468px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <img
          src={AuthAppIcons}
          alt="Authentication Apps"
          style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
        />
      </div>

      {!showManualEntry ? (
        <>
          <div
            style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <QRCodeSVG value={value} size={200} level="H" includeMargin={true} />
          </div>
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              Can't scan?{' '}
              <button
                style={{
                  color: '#1677ff',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setShowManualEntry(true)}
              >
                Use Manual Entry
              </button>
            </p>
          </div>
        </>
      ) : (
        <div style={{ width: '100%', maxWidth: '400px', marginTop: '21px' }}>
          <p style={{ marginBottom: '16px' }}>
            Manually enter the following information in your authenticator app:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                Account Name
              </p>
              <div
                style={{
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  backgroundColor: '#F9FAFB'
                }}
              >
                {accountName}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                Key
              </p>
              <div
                style={{
                  padding: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  backgroundColor: '#F9FAFB',
                  wordBreak: 'break-all'
                }}
              >
                {secretKey}
              </div>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: '#6B7280', marginBottom: '4px' }}>
                Type
              </p>
              {authenticatorOptions && authenticatorOptions.length > 0 ? (
                <Select
                  style={{ width: '100%' }}
                  value={selectedAuthenticator}
                  onChange={onAuthenticatorChange}
                  options={authenticatorOptions}
                />
              ) : (
                <div
                  style={{
                    padding: '12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  Time Based (TOTP)
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', color: '#6B7280' }}>
              Prefer QR code?{' '}
              <button
                style={{
                  color: '#1677ff',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onClick={() => setShowManualEntry(false)}
              >
                Use QR Code
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default TwoFactorQRCode
