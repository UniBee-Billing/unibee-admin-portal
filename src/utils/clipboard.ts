import { message } from 'antd'

export interface WriteClipboardTextOptions {
  errMsg: string
  successMsg: string
}

export const writeClipboardText = async (
  text: string,
  options?: Partial<WriteClipboardTextOptions>
) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success(options?.successMsg ?? 'Copied to clipboard')
  } catch (err) {
    message.error(options?.errMsg ?? `Failed to copy: ${err}`)
  }
}
