import { FilterValue } from 'antd/es/table/interface'

type MapFunction = (value: FilterValue | null) => unknown

type MapFunctionConfig = {
  mapFunction: MapFunction
  isSpread: boolean
}

const isMapFunctionConfig = (
  mapFunctionOrConfig: MapFunctionConfig | MapFunction
): mapFunctionOrConfig is MapFunctionConfig => 'isSpread' in mapFunctionOrConfig

export const parseFilters = (
  filters: Record<string, FilterValue | null>,
  mapper: Record<string, MapFunctionConfig | MapFunction>
): Record<string, FilterValue | null> =>
  Object.keys(filters).reduce((acc, cur) => {
    const filterValue = filters[cur]
    const mapFunctionOrConfig = mapper[cur]

    if (!mapFunctionOrConfig) {
      return {
        [cur]: filterValue,
        ...acc
      }
    }

    const { mapFunction, isSpread } = isMapFunctionConfig(mapFunctionOrConfig)
      ? mapFunctionOrConfig
      : { mapFunction: mapFunctionOrConfig, isSpread: false }
    const mappedObj = (
      isSpread ? mapFunction(filterValue) : { [cur]: mapFunction(filterValue) }
    ) as Record<string, unknown>

    return {
      ...mappedObj,
      ...acc
    }
  }, {})
