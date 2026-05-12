import { cookies } from 'next/headers'
import { verifyToken, SESSION_COOKIE } from '@/lib/session'
import { getUserById, type User } from '@/lib/db/users'

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = verifyToken(token)
  if (!userId) return null
  return getUserById(userId)
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getSession()
  if (!user?.is_admin) return null
  return user
}
