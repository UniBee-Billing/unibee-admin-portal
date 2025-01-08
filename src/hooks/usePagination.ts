import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

export const usePagination = (pageName?: string) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageNum = parseInt(searchParams.get(pageName ?? 'page') ?? '0')
  const [page, setPage] = useState(
    isNaN(pageNum) || pageNum <= 0 ? 0 : pageNum - 1
  )
  const onPageChange: (page: number, pageSize: number) => void = (
    page: number
  ) => {
    setPage(page - 1)
    searchParams.set(pageName ?? 'page', page + '')
    setSearchParams(searchParams)
  }

  // some tables are part of a page, no need to set searchParams on URL
  const onPageChangeNoParams: (page: number, pageSize: number) => void = (
    page: number
  ) => {
    setPage(page - 1)
  }

  return { page, onPageChange, onPageChangeNoParams }
}
