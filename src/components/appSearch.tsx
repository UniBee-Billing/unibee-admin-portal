import { showAmount } from '@/helpers'
import { appSearchReq } from '@/requests'
import { IProfile, InvoiceStatus, UserInvoice } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import { Col, Divider, Input, Row, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { CSSProperties, ChangeEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnClickOutside } from 'usehooks-ts'
import './appSearch.css'
import { InvoiceStatusTag, SubscriptionStatusTag } from './ui/statusTag'

const { Search } = Input

interface IAccountInfo extends IProfile {
  subscriptionId: string
  subscriptionStatus: number
}

const Index = () => {
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [searching, setSearching] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const resultWrapperRef = useRef(null)
  const [invoiceList, setInvoiceList] = useState<UserInvoice[] | null>(null)
  const [accountList, setAccountList] = useState<IAccountInfo[] | null>(null)

  const hide = () => setShowResult(false)
  const show = () => setShowResult(true)
  useOnClickOutside(resultWrapperRef, hide)

  const goToDetail = (pageId: string) => {
    hide()
    navigate(`/${pageId}`)
  }

  const onEnter = async () => {
    if (term.trim() == '') {
      return
    }

    setSearching(true)
    setShowResult(true)
    const [res, err] = await appSearchReq(term)
    setSearching(false)
    if (null != err) {
      setShowResult(false)
      message.error(err.message)
      return
    }
    // setShowResult(false)

    const { matchInvoice, matchUserAccounts } = res
    setInvoiceList(matchInvoice)
    setAccountList(matchUserAccounts)
    // d.precisionMatchObject != null &&
  }

  const onTermChange = (evt: ChangeEvent<HTMLInputElement>) => {
    setTerm(evt.target.value)
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        position: 'relative'
      }}
    >
      <Search
        value={term}
        onChange={onTermChange}
        onSearch={onEnter}
        onClick={show}
        onPressEnter={onEnter}
        allowClear={true}
        // prefix={<SearchOutlined />}
        placeholder="Search invoice Id, customer email"
        style={{ width: '320px' }}
      />
      <div
        ref={resultWrapperRef}
        style={{
          position: 'absolute',
          top: '52px',
          width: '640px',
          height: '500px',
          visibility: `${showResult ? 'visible' : 'hidden'}`,
          background: '#FAFAFA',
          zIndex: '800',
          border: '1px solid #E0E0E0',
          borderRadius: '6px',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px'
        }}
      >
        {searching ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            {' '}
            <Spin
              spinning={true}
              indicator={<LoadingOutlined style={{ fontSize: '32px' }} spin />}
            />
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* <div>precision match</div> */}
            <Divider
              orientation="left"
              style={{ margin: '8px 0', color: '#757575' }}
            >
              Invoices
            </Divider>
            <InvoiceMatch list={invoiceList} goToDetail={goToDetail} />
            <Divider
              orientation="left"
              style={{ margin: '8px 0', color: '#757575' }}
            >
              Customers
            </Divider>
            <AccountMatch list={accountList} goToDetail={goToDetail} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Index

const colStyle: CSSProperties = {
  fontWeight: 'bold',
  height: '32px',
  display: 'flex',
  alignItems: 'center'
}

const InvoiceMatch = ({
  list,
  goToDetail
}: {
  list: UserInvoice[] | null
  goToDetail: (url: string) => void
}) => {
  return (
    <>
      <Row
        align={'middle'}
        justify={'space-between'}
        style={{
          display: 'flex',
          width: '100%',
          height: '32px',
          padding: '0 6px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Col span={7} style={colStyle}>
          Title
        </Col>
        <Col span={3} style={colStyle}>
          Status
        </Col>
        <Col span={4} style={colStyle}>
          Amt
        </Col>
        <Col span={5} style={colStyle}>
          Start
        </Col>
        <Col span={5} style={colStyle}>
          End
        </Col>
      </Row>
      {list == null ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          No Match Found
        </div>
      ) : (
        <div
          style={{ maxHeight: '160px', minHeight: '48px', overflowY: 'auto' }}
        >
          {list.map((iv) => (
            <Row
              style={{
                display: 'flex',
                width: '100%',
                height: '32px',
                padding: '0 6px',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#757575'
              }}
              align={'middle'}
              // style={{ height: "32px", margin: "6px 0" }}
              className="clickable-item"
              key={iv.id}
              onClick={() => goToDetail(`invoice/${iv.invoiceId}`)}
            >
              <Col
                span={7}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span>{iv.invoiceName}</span>
              </Col>
              <Col
                span={3}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {InvoiceStatusTag(iv.status as InvoiceStatus)}
                </div>
              </Col>
              <Col
                span={4}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span>{showAmount(iv.totalAmount, iv.currency)}</span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span>
                  {dayjs(new Date(iv.periodStart * 1000)).format('YYYY-MMM-DD')}
                </span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span>
                  {dayjs(new Date(iv.periodEnd * 1000)).format('YYYY-MMM-DD')}
                </span>
              </Col>
            </Row>
          ))}
        </div>
      )}
    </>
  )
}

const AccountMatch = ({
  list,
  goToDetail
}: {
  list: IAccountInfo[] | null
  goToDetail: (url: string) => void
}) => {
  return (
    <>
      <Row
        align={'middle'}
        justify={'space-between'}
        style={{
          display: 'flex',
          width: '100%',
          height: '32px',
          padding: '0 6px',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Col span={5} style={colStyle}>
          Name
        </Col>
        <Col span={5} style={colStyle}>
          Email
        </Col>
        <Col span={4} style={colStyle}>
          Country
        </Col>
        <Col span={5} style={colStyle}>
          Subscription
        </Col>
        <Col span={5} style={colStyle}>
          Status
        </Col>
      </Row>
      {list == null ? (
        <div className="flex items-center justify-center">No Match Found</div>
      ) : (
        <div
          style={{ maxHeight: '160px', minHeight: '48px', overflowY: 'auto' }}
        >
          {list.map((u) => (
            <Row
              style={{
                display: 'flex',
                width: '100%',
                height: '32px',
                padding: '0 6px',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#757575'
              }}
              align={'middle'}
              // style={{ height: "32px", margin: "6px 0" }}
              className="clickable-item"
              key={u.id}
              onClick={() => goToDetail(`user/${u.id}`)}
            >
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{u.firstName}</span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {u.email}
                </div>
              </Col>
              <Col
                span={4}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {u.countryName}
                </div>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    width: '128px',
                    overflowX: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {u.subscriptionId}
                </span>
              </Col>
              <Col
                span={5}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <span>{SubscriptionStatusTag(u.subscriptionStatus)}</span>
              </Col>
            </Row>
          ))}
        </div>
      )}
    </>
  )
}
