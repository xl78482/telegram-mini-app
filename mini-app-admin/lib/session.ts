import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface AdminSession {
  isLoggedIn?: boolean
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET ?? 'change-me-to-a-32-char-secret!!',
  cookieName: 'admin_session',
  cookieOptions: { secure: process.env.NODE_ENV === 'production' },
}

export async function getSession() {
  return getIronSession<AdminSession>(await cookies(), sessionOptions)
}
