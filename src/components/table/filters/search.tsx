import { SearchOutlined } from '@ant-design/icons'
import { Button, Input, InputRef, Space, TableColumnType } from 'antd'
import { FilterDropdownProps, FilterValue } from 'antd/es/table/interface'
import { ReactNode, useRef, useState } from 'react'
import Highlighter from 'react-highlight-words'
import { nextTick } from '../../../utils'
import { parseFilters } from './common'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTableSearchBox = <D extends Record<string, any>>() => {
  type DataIndex = keyof D

  const [searchText, setSearchText] = useState('')
  const [searchedColumn, setSearchedColumn] = useState('')
  const searchInput = useRef<InputRef>(null)

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps['confirm'],
    dataIndex: keyof D
  ) => {
    confirm()
    setSearchText(selectedKeys[0])
    setSearchedColumn(dataIndex as string)
  }

  return <T extends DataIndex>(
    dataIndex: T,
    render?: (
      data: D[T],
      highlighter: (highlightText: string) => ReactNode
    ) => string | ReactNode
  ): TableColumnType<D> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close
    }) => (
      <div className="p-2" onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex.toString()}`}
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
            className="w-[90px]"
          >
            Search
          </Button>
          <Button
            onClick={() => {
              clearFilters?.()
              setSearchText('')
              confirm()
            }}
            size="small"
            className="w-[90px]"
          >
            Reset
          </Button>
          <Button type="link" size="small" onClick={() => close()}>
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    filterDropdownProps: {
      async onOpenChange(open) {
        if (!open) {
          return
        }

        await nextTick()
        searchInput.current?.select()
      }
    },
    render: (data) => {
      const highlight = (text: string) =>
        searchedColumn === dataIndex ? (
          <Highlighter
            highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={text ?? ''}
          />
        ) : (
          text
        )
      const parsedTextOrElement = render?.(data, highlight) ?? data

      return typeof parsedTextOrElement === 'string'
        ? highlight(parsedTextOrElement)
        : parsedTextOrElement
    }
  })
}

const convertDataIndexes2Mapper = (searchDataIndexes: string[]) =>
  searchDataIndexes.reduce(
    (acc, dataIndex) => ({
      [dataIndex]: (value: FilterValue) => value?.[0] ?? value,
      ...acc
    }),
    {}
  )

export const parseSearchFilters = (
  filters: Record<string, FilterValue | null>,
  searchDataIndexes: string[]
): Record<string, FilterValue | null> =>
  parseFilters(filters, convertDataIndexes2Mapper(searchDataIndexes))
