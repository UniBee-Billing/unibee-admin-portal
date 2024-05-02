import { LoadingOutlined } from '@ant-design/icons'
import {
  Button,
  Checkbox,
  Col,
  Form,
  FormInstance,
  Input,
  Pagination,
  Row,
  Select,
  Table,
  Tag,
  message
} from 'antd'
import { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import React, { ReactElement, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CURRENCY,
  DISCOUNT_CODE_BILLING_TYPE,
  DISCOUNT_CODE_STATUS,
  DISCOUNT_CODE_TYPE
} from '../../constants'
import { showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import { getDiscountCodeListReq, getInvoiceListReq } from '../../requests'
import '../../shared.css'
import { DiscountCode, UserInvoice } from '../../shared.types.d'

const PAGE_SIZE = 10
const APP_PATH = import.meta.env.BASE_URL
const STATUS: { [key: number]: ReactElement } = {
  1: <Tag color="blue">{DISCOUNT_CODE_STATUS[1]}</Tag>,
  2: <Tag color="#87d068">{DISCOUNT_CODE_STATUS[2]}</Tag>,
  3: <Tag color="purple">{DISCOUNT_CODE_STATUS[3]}</Tag>,
  4: <Tag color="red">{DISCOUNT_CODE_STATUS[4]}</Tag>
}

const Index = () => {
  const { page, onPageChange } = usePagination()
  const navigate = useNavigate()
  // const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [codeList, setCodeList] = useState<DiscountCode[]>([])

  const columns: ColumnsType<DiscountCode> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code'
      // render: (text) => <a>{text}</a>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (s) => STATUS[s]
    },
    {
      title: 'Billing Type',
      dataIndex: 'billingType',
      key: 'billingType',
      render: (s) => DISCOUNT_CODE_BILLING_TYPE[s]
    },
    {
      title: 'Discount Type',
      dataIndex: 'discountType',
      key: 'discountType',
      render: (s) => DISCOUNT_CODE_TYPE[s]
    },
    {
      title: 'Amount',
      dataIndex: 'discountAmount',
      key: 'discountAmount',
      render: (amt, code) =>
        code.discountType == 1 ? '' : showAmount(amt, code.currency)
    },
    {
      title: 'Percentage',
      dataIndex: 'discountPercentage',
      key: 'discountPercentage',
      render: (percent, code) =>
        code.discountType == 1 ? `${percent / 100} %` : ''
    },
    {
      title: 'Cycle Limit',
      dataIndex: 'cycleLimit',
      key: 'cycleLimit',
      render: (lim, code) => {
        if (code.billingType == 1) {
          // one-time use
          return '1'
        } else if (code.billingType == 2) {
          // recurring
          return lim === 0 ? 'Unlimited' : lim
        } else {
          return lim
        }
      }
    },
    {
      title: 'Validity Range',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (start, code) =>
        dayjs(start * 1000).format('YYYY-MMM-DD') +
        ' ~ ' +
        dayjs(code.endTime * 1000).format('YYYY-MMM-DD')
    }
  ]

  const onNewCode = () => {
    onPageChange(1, 100)
    navigate(`${APP_PATH}discount-code/new`)
  }
  const fetchData = async () => {
    setLoading(true)
    const [list, err] = await getDiscountCodeListReq(fetchData)
    console.log('code list: ', list)
    setLoading(false)
    if (null != err) {
      message.error(err.message)
      return
    }
    setCodeList(list || [])
  }

  /*
  useEffect(() => {
    fetchData()
  }, [])
  */
  useEffect(() => {
    fetchData()
  }, [page])

  return (
    <div>
      {/* <Search form={form} goSearch={fetchData} searching={loading} /> */}
      <div className="my-4 flex justify-end">
        <Button type="primary" onClick={onNewCode}>
          New Discount Code
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={codeList}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
        onRow={(code, rowIndex) => {
          return {
            onClick: (evt) => {
              navigate(`${APP_PATH}discount-code/${code.id}`, {
                state: codeList[rowIndex as number]
              })
            }
          }
        }}
      />
      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={500}
          size="small"
          onChange={onPageChange}
          disabled={loading}
          showSizeChanger={false}
        />
      </div>
    </div>
  )
}

export default Index
