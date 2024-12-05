const serializeArray = (array: unknown[]) => `[${array.toString()}]`

export const serializeSearchParams = (search: Record<string, unknown>) =>
  new URLSearchParams(
    Object.keys(search).reduce(
      (acc, key) => ({
        [key]: Array.isArray(search[key])
          ? serializeArray(search[key])
          : search[key],
        ...acc
      }),
      {}
    )
  ).toString()
