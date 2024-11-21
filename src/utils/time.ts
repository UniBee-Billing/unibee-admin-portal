export const getSystemTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone

export const getTimezoneList = () => Intl.supportedValuesOf('timeZone')
