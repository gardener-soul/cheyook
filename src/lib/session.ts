import { createHmac } from 'crypto'
import { SESSION_COOKIE } from '@/lib/constants'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

export function signToken(userId: string): string {
  const sig = createHmac('sha256', getSecret()).update(userId).digest('hex')
  return `${userId}.${sig}`
}

export function verifyToken(token: string): string | null {
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return null
  const userId = token.slice(0, dotIndex)
  const sig = token.slice(dotIndex + 1)
  const expected = createHmac('sha256', getSecret()).update(userId).digest('hex')
  if (sig !== expected) return null
  return userId
}

export { SESSION_COOKIE }
