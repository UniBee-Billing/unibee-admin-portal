import { request } from '../requests/client'
import { TExportDataType } from '../shared.types'
import { useAxiosFetch } from './useFetch'

interface ExportColumnsRes {
  columns: string[]
  groupColumns: Record<string, ExportColumnsRes['columns']>
}

export const useExportColumnList = (task: TExportDataType) => {
  const { data, ...fetchStates } = useAxiosFetch(
    '/merchant/task/export_column_list',
    (url) => request.post(url, { task })
  )

  const cols: ExportColumnsRes = data?.data ?? { columns: [], groupColumns: [] }

  return { ...fetchStates, ...cols }
}
