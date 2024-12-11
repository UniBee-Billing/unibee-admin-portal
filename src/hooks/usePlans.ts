import { request } from '../requests/client'
import { IPlan } from '../shared.types'
import { useAxiosFetch } from './useFetch'

export enum PlanType {
  MAIN = 1,
  ADDON
}

export enum PlanStatus {
  EDITING = 1,
  ACTIVE,
  INACTIVE,
  EXPIRED
}

export enum PublishStatus {
  UNPUBLISHED = 1,
  PUBLISHED
}

export interface UsePlansOptions {
  productIds?: string[]
  type: PlanType
  status?: PlanStatus
  publishStatus?: PublishStatus
  currency?: string
  sortField?: 'gmt_create' | 'gmt_modify'
  sortType?: 'asc' | 'desc'
  page?: number
  count?: number
  onError?: (err: Error) => void
}

export const usePlans = ({ onError, ...requestParams }: UsePlansOptions) => {
  const res = useAxiosFetch(
    '/merchant/plan/list',
    (url) => request.get(url, { params: requestParams }),
    { onError }
  )

  const plans: IPlan[] = res.data?.data?.plans ?? []

  return { ...res, data: plans }
}
