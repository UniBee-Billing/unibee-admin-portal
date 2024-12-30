import {
  LoadingOutlined,
  MinusOutlined,
  SearchOutlined
} from '@ant-design/icons'
import type { TableColumnType, TableProps } from 'antd'
import {
  Button,
  Input,
  InputRef,
  message,
  Pagination,
  Skeleton,
  Space
} from 'antd'
import Table, { ColumnsType } from 'antd/es/table'
import type { FilterDropdownProps } from 'antd/es/table/interface'
import { useEffect, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { useNavigate } from 'react-router-dom'
import { CREDIT_TX_TYPE } from '../../constants'
import { formatDate, numberWithComma, showAmount } from '../../helpers'
import { usePagination } from '../../hooks'
import {
  exportDataReq,
  getCreditTxListReq,
  getCreditUsageStatReq,
  TCreditTxParams
} from '../../requests'
import {
  CreditTxType,
  CreditType,
  IProfile,
  TCreditTx
} from '../../shared.types'
// import { nextTick } from '../../utils'
import { useAppConfigStore } from '../../stores'
import CopyToClipboard from '../ui/copyToClipboard'

const PAGE_SIZE = 10

const Index = ({
  userDetail,
  refreshTxHistory, // when used in user detail -> promoCredit tab, after admin updated credit amt, this component need to re-render to get the latest list
  // when this props passed as true, run fetchCreditTxList
  setRefreshTxHist,
  embeddingMode
}: {
  userDetail?: IProfile
  refreshTxHistory: boolean
  setRefreshTxHist?: (v: boolean) => void
  embeddingMode?: boolean
}) => {
  const navigate = useNavigate()
  const [creditTxList, setCreditTxList] = useState<TCreditTx[]>([])
  const [loading, setLoading] = useState(refreshTxHistory)
  const { page, onPageChange, onPageChangeNoParams } = usePagination()
  const [total, setTotal] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef<InputRef>(null)
  const [sortFilter, setSortFilter] = useState<{
    sortField: 'gmt_modify'
    sortType: 'desc' | 'asc'
  } | null>(null)

  type DataIndex = keyof TCreditTx

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: DataIndex
  ) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex)
  }

  /*
  const handleReset = (clearFilters: () => void) => {
    clearFilters()
    if (searchInput.current?.input) {
      searchInput.current.input.value = ''
    }
    setSearchText('')
    fetchCreditTxList()
  }
    */

  const getColumnSearchProps = (
    dataIndex: DataIndex
  ): TableColumnType<TCreditTx> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => {
              if (clearFilters) {
                clearFilters()
              }
              setSearchText('')
              if (searchInput.current?.input) {
                searchInput.current.input.value = ''
              }
              confirm()
            }}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false })
              setSearchText((selectedKeys as string[])[0])
              setSearchedColumn(dataIndex)
            }}
          >
            Filter
          </Button>*/}
          <Button
            type="link"
            size="small"
            onClick={() => {
              close()
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    filterDropdownProps: {
      onOpenChange(open) {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100)
        }
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      )
  })

  const columns: ColumnsType<TCreditTx> = [
    {
      title: 'Amount changed',
      dataIndex: 'deltaAmount',
      key: 'deltaAmount',
      render: (amt, tx) =>
        `${amt} (${showAmount(tx.deltaCurrencyAmount, tx.currency)})`
    },
    {
      title: 'User Email',
      dataIndex: ['user', 'email'],
      key: 'user',
      hidden: embeddingMode,
      ...getColumnSearchProps('user')
    },
    {
      title: 'Transaction Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      render: (type: CreditTxType) => CREDIT_TX_TYPE[type]
    },
    {
      title: 'By',
      dataIndex: 'adminMember',
      key: 'adminMember',
      render: (by) =>
        by != undefined ? `${by.firstName} ${by.lastName}` : <MinusOutlined />
    },
    {
      title: 'At',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (d) => formatDate(d, true),
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.createTime - b.createTime
    },
    {
      title: 'Invoice Applied',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (ivId) =>
        ivId == null || ivId == '' ? (
          <MinusOutlined />
        ) : (
          <div className="flex items-center">
            <Button
              type="link"
              onClick={() => navigate(`/invoice/${ivId}`)}
              style={{ padding: 0, fontFamily: 'monospace' }}
            >
              {ivId}
            </Button>
            <CopyToClipboard content={ivId} />
          </div>
        )
    }
  ]

  const fetchCreditTxList = async () => {
    const body: TCreditTxParams = {
      accountType: CreditType.PROMO_CREDIT,
      userId: userDetail == undefined ? undefined : (userDetail.id as number),
      email: searchText,
      page,
      count: PAGE_SIZE
    }
    if (sortFilter != null) {
      body.sortField = sortFilter.sortField
      body.sortType = sortFilter.sortType
    }
    setLoading(true)
    const [res, err] = await getCreditTxListReq(body)
    setLoading(false)
    if (setRefreshTxHist != undefined) {
      setRefreshTxHist(false)
    }
    if (err != null) {
      message.error(err.message)
      return
    }
    const { creditTransactions, total } = res
    setCreditTxList(creditTransactions ?? [])
    setTotal(total)
  }

  const onTableChange: TableProps<TCreditTx>['onChange'] = (
    _,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    filters,
    sorter
  ) => {
    if (Array.isArray(sorter)) {
      return // Handle array case if needed
    }
    if (sorter.columnKey == undefined) {
      setSortFilter(null)
    }
    if (sorter.columnKey === 'createTime') {
      onPageChange(1, PAGE_SIZE)
      setSortFilter({
        sortField: 'gmt_modify',
        sortType: sorter.order === 'descend' ? 'desc' : 'asc'
      })
    }
  }

  useEffect(() => {
    fetchCreditTxList()
  }, [page, sortFilter, searchedColumn, searchText])

  useEffect(() => {
    if (refreshTxHistory) {
      fetchCreditTxList()
    }
  }, [refreshTxHistory])

  return (
    <>
      {!embeddingMode && (
        <ExtraInfo
          exportPayload={{
            email: searchText,
            sortFilter,
            accountType: CreditType.PROMO_CREDIT
          }}
        />
      )}
      <Table
        columns={columns}
        dataSource={creditTxList}
        onChange={onTableChange}
        rowKey={'id'}
        rowClassName="clickable-tbl-row"
        pagination={false}
        loading={{
          spinning: loading,
          indicator: <LoadingOutlined style={{ fontSize: 32 }} spin />
        }}
      />

      <div className="mx-0 my-4 flex items-center justify-end">
        <Pagination
          current={page + 1} // back-end starts with 0, front-end starts with 1
          pageSize={PAGE_SIZE}
          total={total}
          size="small"
          onChange={embeddingMode ? onPageChangeNoParams : onPageChange}
          disabled={loading}
          showSizeChanger={false}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} of ${total} items`
          }
        />
      </div>
    </>
  )
}

export default Index

const ExtraInfo = ({ exportPayload }: { exportPayload: unknown }) => {
  const appConfigStore = useAppConfigStore()
  const [creditUsageStat, setCreditUsageStat] = useState<{
    totalIncrementAmount: number | null
    totalDecrementAmount: number | null
  }>({ totalIncrementAmount: null, totalDecrementAmount: null })
  const [loadingStat, setLoadingStat] = useState(true)
  // accountType: 2, email,
  const onExport = async () => {
    const [_, err] = await exportDataReq({
      task: 'CreditTransactionExport',
      payload: exportPayload
    })
    if (err != null) {
      message.error(err.message)
      return
    }
    message.success('Credit transaction list is being exported.')
    appConfigStore.setTaskListOpen(true)
  }

  const getCreditUsageStat = async () => {
    setLoadingStat(true)
    const [res, err] = await getCreditUsageStatReq('EUR') // hard-coded here
    setLoadingStat(false)
    if (err != null) {
      message.error(err.message)
      return
    }
    const { totalIncrementAmount, totalDecrementAmount } = res
    setCreditUsageStat({ totalIncrementAmount, totalDecrementAmount })
  }

  useEffect(() => {
    getCreditUsageStat()
  }, [])

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="flex" style={{ width: 240 }}>
          <TotalAddedCreditsSVG />
          &nbsp;&nbsp; Total added credits:&nbsp;&nbsp;
          {loadingStat ? (
            <LoadingOutlined spin />
          ) : creditUsageStat.totalIncrementAmount == null ? (
            <MinusOutlined />
          ) : (
            numberWithComma(Math.abs(creditUsageStat.totalIncrementAmount))
          )}
        </div>
        <div className="flex" style={{ width: 240 }}>
          <TotalUsedCreditsSVG />
          &nbsp;&nbsp; Total used credits:&nbsp;&nbsp;
          {loadingStat ? (
            <LoadingOutlined spin />
          ) : creditUsageStat.totalDecrementAmount == null ? (
            <MinusOutlined />
          ) : (
            numberWithComma(Math.abs(creditUsageStat.totalDecrementAmount))
          )}
        </div>
      </div>
      <div>
        <Button onClick={onExport}>Export</Button>
      </div>
    </div>
  )
}

const TotalAddedCreditsSVG = () => (
  <svg
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.99922 15.3195C4.14141 15.3195 1.00391 12.2668 1.00391 8.51328C1.00391 4.75973 4.14141 1.70703 7.99922 1.70703V2.64656C4.67422 2.64656 1.96953 5.27815 1.96953 8.51328C1.96953 11.7484 4.67422 14.38 7.99922 14.38C11.3242 14.38 14.0289 11.7484 14.0289 8.51328H14.9945C14.9945 12.2668 11.8555 15.3195 7.99922 15.3195Z"
      fill="#6C6C6C"
    />
    <path
      d="M10.8613 9.37226H7.00195V5.61719H7.96602V8.43273H10.8613V9.37226Z"
      fill="#6C6C6C"
    />
    <path
      d="M7.30859 8.40906L12.7665 3.09863L13.4493 3.76298L7.99139 9.07339L7.30859 8.40906Z"
      fill="#6C6C6C"
    />
  </svg>
)

const TotalUsedCreditsSVG = () => (
  <svg
    width="16"
    height="17"
    viewBox="0 0 16 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M7.99922 15.3195C4.14141 15.3195 1.00391 12.2668 1.00391 8.51328C1.00391 4.75973 4.14141 1.70703 7.99922 1.70703V2.64656C4.67422 2.64656 1.96953 5.27815 1.96953 8.51328C1.96953 11.7484 4.67422 14.38 7.99922 14.38C11.3242 14.38 14.0289 11.7484 14.0289 8.51328H14.9945C14.9945 12.2668 11.8555 15.3195 7.99922 15.3195Z"
      fill="#6C6C6C"
    />
    <path
      d="M9.58984 3.09845H13.4492V6.85352H12.4852V4.03797H9.58984V3.09845Z"
      fill="#6C6C6C"
    />
    <path
      d="M13.1426 4.06165L7.68464 9.37207L7.00184 8.70773L12.4598 3.39732L13.1426 4.06165Z"
      fill="#6C6C6C"
    />
  </svg>
)
