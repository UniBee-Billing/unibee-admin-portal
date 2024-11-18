declare global {
  interface Window {
    redirectToLogin: unknown
  }

  declare namespace Intl {
    type Key =
      | 'calendar'
      | 'collation'
      | 'currency'
      | 'numberingSystem'
      | 'timeZone'
      | 'unit'

    // https://github.com/microsoft/TypeScript/issues/49231
    // The supportedValuesOf is not yet supported in TypeScript current version
    function supportedValuesOf(input: Key): string[]
  }
}

export {}
