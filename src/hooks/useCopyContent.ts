export const useCopyContent = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return null
  } catch (err) {
    const e = err instanceof Error ? err : new Error('Unknown copy error')
    return e
  }
}
