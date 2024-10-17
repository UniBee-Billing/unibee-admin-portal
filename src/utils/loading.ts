export const withTextLoading = (text: string, isLoading: boolean) =>
  isLoading ? 'Loading...' : text

export const withWeakTextLoading = (
  text: string | undefined,
  isLoading: boolean
) => withTextLoading(text ?? 'Unknown', isLoading)
