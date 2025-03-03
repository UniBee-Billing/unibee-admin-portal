import { showAmount } from '@/helpers'
import { appSearchReq } from '@/requests'
import { IProfile, InvoiceStatus, UserInvoice } from '@/shared.types'
import { LoadingOutlined } from '@ant-design/icons'
import { Col, Divider, Empty, Input, Row, Spin, message } from 'antd'
import dayjs from 'dayjs'
import { CSSProperties, ChangeEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnClickOutside } from 'usehooks-ts'
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

  // when admin is on /user/123, if appSearch return 2 results(id: 456, 789), click 456 go to /user/456,
  // on userDetail page, don't forget to check userId change using:
  // const params = useParams()
  // const userId = Number(params.userId), add userId in useEffect depArray, if changed, refresh the userProfile
  // otherwise, click /user/456, has no effect.
  // Other pages should follow this pattern.
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
    <div className="relative flex h-full items-center">
      <Search
        value={term}
        onChange={onTermChange}
        onSearch={onEnter}
        onClick={show}
        onPressEnter={onEnter}
        allowClear={true}
        placeholder="Search invoice Id, customer email"
        style={{ width: '320px' }}
      />
      <div
        ref={resultWrapperRef}
        className="z-800 h-max-[520px] absolute top-[52px] w-[640px] rounded-lg border border-[#E0E0E0] bg-[#FAFAFA] px-4 py-2 drop-shadow-lg"
        style={{
          zIndex: 800,
          visibility: `${showResult ? 'visible' : 'hidden'}`,
          border: '1px solid #E0E0E0'
        }}
      >
        {searching ? (
          <div className="flex h-full w-full items-center justify-center">
            {' '}
            <Spin
              spinning={true}
              indicator={<LoadingOutlined style={{ fontSize: '32px' }} spin />}
            />
          </div>
        ) : (
          <div className="relative">
            {/* <div>precision match</div> */}
            <Divider
              orientation="left"
              style={{ margin: '12px 0', color: '#757575' }}
            >
              Invoices
            </Divider>
            <InvoiceMatch list={invoiceList} goToDetail={goToDetail} />
            <Divider
              orientation="left"
              style={{ margin: '12px 0', color: '#757575' }}
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

const colSpan = [6, 5, 3, 5, 5]
const header = ['Title', 'Status', 'Amt', 'Start', 'End']
const InvoiceMatch = ({
  list,
  goToDetail
}: {
  list: UserInvoice[] | null
  goToDetail: (url: string) => void
}) => {
  return (
    <>
      <Row className="mb-3 flex h-8 w-full items-center justify-between py-2">
        {header.map((h, i) => (
          <Col key={i} span={colSpan[i]} style={colStyle}>
            {h}
          </Col>
        ))}
      </Row>
      {list == null || list.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No Invoice Found"
        />
      ) : (
        <div
          style={{ maxHeight: '160px', minHeight: '48px', overflowY: 'auto' }}
        >
          {list.map((iv) => (
            <Row
              className="flex h-8 w-full items-center justify-between hover:cursor-pointer hover:bg-gray-200"
              key={iv.id}
              onClick={() => goToDetail(`invoice/${iv.invoiceId}`)}
            >
              <Col span={colSpan[0]} className="flex h-8 items-center">
                <span>{iv.invoiceName}</span>
              </Col>
              <Col span={colSpan[1]} className="flex h-8 items-center">
                <span>{InvoiceStatusTag(iv.status as InvoiceStatus)}</span>
              </Col>
              <Col span={colSpan[2]} className="flex h-8 items-center">
                <span>{showAmount(iv.totalAmount, iv.currency)}</span>
              </Col>
              <Col span={colSpan[3]} className="flex h-8 items-center">
                <span>
                  {dayjs(new Date(iv.periodStart * 1000)).format('YYYY-MMM-DD')}
                </span>
              </Col>
              <Col span={colSpan[4]} className="flex h-8 items-center">
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

const colSpan2 = [5, 5, 4, 6, 4]
const header2 = ['Name', 'Email', 'Country', 'Sub', 'Sub Status']
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
        className="mb-3 flex h-8 w-full items-center justify-between py-2"
      >
        {header2.map((h, i) => (
          <Col key={i} span={colSpan2[i]} style={colStyle}>
            {h}
          </Col>
        ))}
      </Row>
      {list == null || list.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No Customer Found"
        />
      ) : (
        <div style={{ maxHeight: '160px', overflowY: 'auto' }}>
          {list.map((u) => (
            <Row
              style={{
                width: '100%',
                height: '32px',
                padding: '0 6px',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#757575'
              }}
              align={'middle'}
              // style={{ height: "32px", margin: "6px 0" }}
              className="flex h-8 w-full items-center justify-between py-2 hover:cursor-pointer hover:bg-gray-200"
              key={u.id}
              onClick={() => goToDetail(`user/${u.id}`)}
            >
              <Col
                span={colSpan2[0]}
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
                span={colSpan2[1]}
                style={{
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    // width: '64px',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {u.email}
                </div>
              </Col>
              <Col
                span={colSpan2[2]}
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
                span={colSpan2[3]}
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
                span={colSpan2[4]}
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
