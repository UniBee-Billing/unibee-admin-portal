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
import { formatDate, showAmount } from '../../helpers'
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
          Total added credits:{' '}
          {loadingStat ? (
            <Skeleton.Input
              active={loadingStat}
              style={{ width: 20, height: 20 }}
            />
          ) : creditUsageStat.totalIncrementAmount == undefined ? (
            <MinusOutlined />
          ) : (
            Math.abs(creditUsageStat.totalIncrementAmount)
          )}
        </div>
        <div className="flex" style={{ width: 240 }}>
          Total used credits:{' '}
          {loadingStat ? (
            <Skeleton.Input
              active={loadingStat}
              style={{ width: 20, height: 20 }}
            />
          ) : creditUsageStat.totalDecrementAmount == undefined ? (
            <MinusOutlined />
          ) : (
            Math.abs(creditUsageStat.totalDecrementAmount)
          )}
        </div>
      </div>
      <div>
        <Button onClick={onExport}>Export</Button>
      </div>
    </div>
  )
}
