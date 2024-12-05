import { SorterResult } from 'antd/es/table/interface'

const SORT_TYPE_MAP = {
  ascend: 'asc',
  descend: 'desc'
}

export const parseAntDSorter2SpecData = <T>(
  sorter: SorterResult<T>,
  mapKey: Record<string, string>
) =>
  sorter.order
    ? {
        sortField: mapKey[sorter.columnKey as string],
        sortType: SORT_TYPE_MAP[sorter.order]
      }
    : undefined
