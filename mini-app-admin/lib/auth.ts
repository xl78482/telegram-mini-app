import { getSession } from './session'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/login')
  return session
}
