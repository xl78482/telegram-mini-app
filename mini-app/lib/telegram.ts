import crypto from 'crypto'

export function validateTelegramData(initData: string): Record<string, string> | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    params.delete('hash')
    const entries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest()

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (expectedHash !== hash) return null

    const result: Record<string, string> = {}
    params.forEach((v, k) => { result[k] = v })
    return result
  } catch {
    return null
  }
}

export function parseTelegramUser(initData: string) {
  const data = validateTelegramData(initData)
  if (!data?.user) return null
  try {
    return JSON.parse(data.user)
  } catch {
    return null
  }
}
