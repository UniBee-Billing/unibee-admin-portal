import { numBoolConvert, showAmount } from '@/helpers'
import { getMerchantInfoReq, toggleUserCreditReq } from '@/requests'
import { IProfile, TPromoAccount } from '@/shared.types'
import { useAppConfigStore } from '@/stores'
import { InfoCircleOutlined, MinusOutlined } from '@ant-design/icons'
import { Button, Col, Row, Select, Switch, Tooltip, message } from 'antd'
import { Currency } from 'dinero.js'
import { useEffect, useState } from 'react'
import CreditSwitchConfirmModal from '../settings/creditConfig/creditSwitchConfirmModal'
import PromoCreditTxHistory from './promoCreditTxHist'
import UpdatePromoCreditModal from './updatePromoCreditModal'

const Index = ({
  userDetail,
  refreshUser
}: {
  userDetail: IProfile | undefined
  refreshUser: () => void
}) => {
  const appConfig = useAppConfigStore()
  const [selectedCurrency, setSelectedCurrency] = useState<string>('EUR')
  
  const normalizePromoAcc = (currency: string = selectedCurrency) => {
    let promoAcc: TPromoAccount | undefined = undefined
    if (
      userDetail != undefined &&
      userDetail.promoCreditAccounts != undefined &&
      userDetail.promoCreditAccounts.length > 0
    ) {
      promoAcc = userDetail.promoCreditAccounts.find(
        (p) => p.currency === currency
      )
    }
    if (promoAcc != undefined) {
      promoAcc.payoutEnable = numBoolConvert(promoAcc.payoutEnable)
      promoAcc.rechargeEnable = numBoolConvert(promoAcc.rechargeEnable)
    }

    return promoAcc
  }

  const [promoAccount, setPromoAccount] = useState<TPromoAccount | undefined>(
    normalizePromoAcc()
  )
  const [modalOpen, setModalOpen] = useState(false)
  const toggleModal = () => setModalOpen(!modalOpen)

  const [creditSwitchModalOpen, setCreditSwitchModalOpen] = useState(false)
  const toggleCreditSwitchModal = () =>
    setCreditSwitchModalOpen(!creditSwitchModalOpen)
  // if current is enabled, then the Modal is to disable it
  const modalTitle = promoAccount?.payoutEnable
    ? 'Disable Promo Credits usage'
    : 'Enable Promo Credits usage'
  const modalContent = promoAccount?.payoutEnable
    ? 'If you choose this option, this user cannot apply the promo credits in the future invoices, until you re-activate promo credit again.'
    : 'If you choose this option, this user can apply the promo credits in the future invoices.'

  const [refreshTxHist, setRefreshTxHist] = useState(false)

  const fetchMerchantInfo = async () => {
    const [merchantData, error] = await getMerchantInfoReq()
    
    if (error === null && merchantData) {
      const defaultCurrency = merchantData.defaultCurrency || 'EUR'
      setSelectedCurrency(defaultCurrency)
      const account = normalizePromoAcc(defaultCurrency)
      setPromoAccount(account)
    }
  }

  const onCreditSwitchChange = async () => {
    if (promoAccount == undefined) {
      return
    }
    const [UserCreditAccount, err] = await toggleUserCreditReq(
      promoAccount.id,
      (promoAccount.payoutEnable as boolean) ? 0 : 1
    )
    if (err != null) {
      message.error(err.message)
      return
    }
    toggleCreditSwitchModal()
    UserCreditAccount.payoutEnable = numBoolConvert(
      UserCreditAccount.payoutEnable
    )
    UserCreditAccount.rechargeEnable = numBoolConvert(
      UserCreditAccount.rechargeEnable
    )
    setPromoAccount(UserCreditAccount)
  }
  
  const handleCurrencyChange = (value: string) => {
    setSelectedCurrency(value)
    const account = normalizePromoAcc(value)
    setPromoAccount(account)
    setRefreshTxHist(true)
  }

  useEffect(() => {
    fetchMerchantInfo()
  }, [])

  useEffect(() => {
    const account = normalizePromoAcc()
    setPromoAccount(account)
    if (userDetail != undefined) {
      setRefreshTxHist(true)
    }
  }, [userDetail, selectedCurrency])

  return (
    <div>
      {modalOpen && userDetail != undefined && (
        <UpdatePromoCreditModal
          refreshUser={refreshUser}
          promoCreditAccount={promoAccount}
          closeModal={toggleModal}
          updatePromoAccount={setPromoAccount}
          refreshTxList={setRefreshTxHist}
          userId={userDetail.id as number}
          currency={selectedCurrency}
        />
      )}
      {creditSwitchModalOpen && promoAccount != undefined && (
        <CreditSwitchConfirmModal
          items={promoAccount}
          title={modalTitle}
          content={modalContent}
          onSave={onCreditSwitchChange}
          onCancel={toggleCreditSwitchModal}
        />
      )}
      <div className="flex flex-col gap-4">
        <Row align="middle" className="mb-4">
          <Col span={6}>Currency</Col>
          <Col span={8}>
            <Select
              value={selectedCurrency}
              style={{ width: '100%' }}
              onChange={handleCurrencyChange}
              options={appConfig.supportCurrency.map((c) => ({
                label: `${c.Currency}(${c.Symbol})`,
                value: c.Currency
              }))}
            />
          </Col>
        </Row>
        
        <Row>
          <Col span={6}>Enable Promo credit usage&nbsp; </Col>
          <Col span={4}>
            <Switch
              disabled={promoAccount == undefined}
              checked={promoAccount?.payoutEnable as boolean}
              onChange={toggleCreditSwitchModal}
            />
          </Col>
        </Row>

        <Row>
          <Col span={6}>Total Added</Col>
          <Col span={4}>{promoAccount?.totalIncrementAmount}</Col>
        </Row>

        <Row>
          <Col span={6}>Total Deducted</Col>
          <Col span={4}>
            {promoAccount != undefined
              ? Math.abs(promoAccount?.totalDecrementAmount)
              : ''}
          </Col>
        </Row>

        <Row>
          <Col span={6}>Promo Credit Balance </Col>
          <Col span={4}>
            {promoAccount?.amount == undefined ? (
              <MinusOutlined />
            ) : (
              <>
                {promoAccount?.amount} (
                {showAmount(
                  promoAccount?.currencyAmount,
                  promoAccount?.currency
                )}
                ) &nbsp;
                {promoAccount != undefined && (
                  <Tooltip
                    title={`1 credit = ${appConfig.currency[promoAccount.currency as Currency]?.Symbol}${promoAccount?.exchangeRate / 100}`}
                  >
                    <InfoCircleOutlined />
                  </Tooltip>
                )}
              </>
            )}
          </Col>
          <Col span={4}>
            <Button onClick={toggleModal}>Update Promo Credit</Button>
          </Col>
        </Row>
      </div>
      <div className="my-6 text-lg text-gray-600">
        Promo credit transaction history
      </div>
      <PromoCreditTxHistory
        userDetail={userDetail}
        refreshTxHistory={refreshTxHist}
        setRefreshTxHist={setRefreshTxHist}
        embeddingMode={true}
        currency={selectedCurrency}
      />
    </div>
  )
}
export default Index
