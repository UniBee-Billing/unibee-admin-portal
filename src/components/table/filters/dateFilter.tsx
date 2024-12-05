import { SearchOutlined } from '@ant-design/icons'
import { Button, DatePicker, TableColumnType } from 'antd'
import { FilterValue } from 'antd/es/table/interface'
import dayjs, { type Dayjs } from 'dayjs'
import { parseFilters } from './common'

const convertDateString2Dayjs = (dateStrings: [start: number, end: number]) =>
  (dateStrings
    ? dateStrings.map((dateString) => dayjs.unix(dateString))
    : null) as [start: Dayjs, end: Dayjs] | null

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const useTableDateFilter = <D extends Record<string, any>>() => {
  return (): TableColumnType<D> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close
    }) => {
      return (
        <div className="p-2">
          <DatePicker.RangePicker
            showTime
            value={convertDateString2Dayjs(selectedKeys as [number, number])}
            onChange={(value) => {
              const [start, end] = value!

              setSelectedKeys([start!.unix(), end!.unix()])
            }}
          />
          <div className="mt-2 flex justify-between">
            <div>
              <Button
                type="primary"
                onClick={() => {
                  confirm()
                }}
                icon={<SearchOutlined />}
                size="small"
                className="mr-1 w-[90px]"
              >
                Search
              </Button>
              <Button
                onClick={() => {
                  clearFilters?.()
                  confirm()
                }}
                size="small"
                className="w-[90px]"
              >
                Reset
              </Button>
            </div>

            <Button type="link" size="small" onClick={() => close()}>
              close
            </Button>
          </div>
        </div>
      )
    }
  })
}

interface ToKeys {
  start: string
  end: string
}

export const formatDateRange = (
  filters: Record<string, FilterValue | null>,
  fromKey: string,
  { start, end }: ToKeys
) =>
  parseFilters(filters, {
    [fromKey]: {
      mapFunction: (value) => {
        if (!value) {
          return null
        }

        const [startTimestamp, endTimeStamp] = value

        return {
          [start]: startTimestamp,
          [end]: endTimeStamp
        }
      },
      isSpread: true
    }
  })
