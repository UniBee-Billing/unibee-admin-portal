export const getSystemTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone

export const getTimezoneList = () => Intl.supportedValuesOf('timeZone')

export const nextTick = (delay?: number) =>
  new Promise((resolve) => setTimeout(resolve, delay ?? 0))
