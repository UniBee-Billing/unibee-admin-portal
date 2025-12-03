import { create } from 'zustand'
import { getPlanList } from '../requests'
import { IPlan, PlanStatus } from '../shared.types'

type PlanOption = { value: number; text: string }

interface PlanListSlice {
  plans: IPlan[]
  planOptions: PlanOption[]
  internalPlanNameOptions: PlanOption[]
  planTypeToIds: { [key: number]: number[] }
  loading: boolean
  loaded: boolean

  fetchAllPlans: (forceRefresh?: boolean) => Promise<void>
  getPlanOptions: () => PlanOption[]
  reset: () => void
}

const MAX_PAGES = 30
const PAGE_SIZE = 100

export const usePlanListStore = create<PlanListSlice>()((set, get) => ({
  plans: [],
  planOptions: [],
  internalPlanNameOptions: [],
  planTypeToIds: {},
  loading: false,
  loaded: false,

  fetchAllPlans: async (forceRefresh = false) => {
    // 锁保护：加载中则跳过
    if (get().loading) return
    // 非强制刷新且已加载则跳过
    if (!forceRefresh && get().loaded) return

    set({ loading: true })

    let allPlans: IPlan[] = []
    let page = 0

    while (page < MAX_PAGES) {
      const [res, err] = await getPlanList({
        status: [
          PlanStatus.EDITING,
          PlanStatus.ACTIVE,
          PlanStatus.INACTIVE,
          PlanStatus.SOFT_ARCHIVED,
          PlanStatus.HARD_ARCHIVED
        ],
        page,
        count: PAGE_SIZE
      })

      if (err || !res?.plans?.length) break

      allPlans = [...allPlans, ...res.plans]

      if (res.plans.length < PAGE_SIZE) break
      page++
    }

    // Sort by status: ACTIVE(2) -> EDITING(1) -> INACTIVE(3) -> SOFT_ARCHIVED(4) -> HARD_ARCHIVED(5)
    const statusOrder: { [key: number]: number } = {
      [PlanStatus.ACTIVE]: 0,
      [PlanStatus.EDITING]: 1,
      [PlanStatus.INACTIVE]: 2,
      [PlanStatus.SOFT_ARCHIVED]: 3,
      [PlanStatus.HARD_ARCHIVED]: 4
    }
    allPlans.sort((a, b) => {
      const orderA = statusOrder[a.plan?.status ?? 99] ?? 99
      const orderB = statusOrder[b.plan?.status ?? 99] ?? 99
      return orderA - orderB
    })

    const planOptions = allPlans
      .map((p) => ({
        value: p.plan?.id as number,
        text: `#${p.plan?.id} ${p.plan?.planName}`
      }))
      .filter((p) => p.value && p.text)

    const internalPlanNameOptions = allPlans
      .filter(
        (p) => p.plan?.internalName != null && p.plan?.internalName.trim() !== ''
      )
      .map((p) => ({
        value: p.plan?.id as number,
        text: `#${p.plan?.id} ${p.plan?.internalName}`
      }))
      .filter((p) => p.value)

    const planTypeToIds: { [key: number]: number[] } = {}
    allPlans.forEach((p) => {
      if (p.plan?.type != null && p.plan?.id != null) {
        if (!planTypeToIds[p.plan.type]) {
          planTypeToIds[p.plan.type] = []
        }
        planTypeToIds[p.plan.type].push(p.plan.id)
      }
    })

    set({
      plans: allPlans,
      planOptions,
      internalPlanNameOptions,
      planTypeToIds,
      loading: false,
      loaded: true
    })
  },

  getPlanOptions: () => get().planOptions,

  reset: () =>
    set({
      plans: [],
      planOptions: [],
      internalPlanNameOptions: [],
      planTypeToIds: {},
      loading: false,
      loaded: false
    })
}))
