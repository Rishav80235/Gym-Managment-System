import type { AccountRole } from '../firebase/services'

const STORAGE_KEY = 'gym-management-auth'

export type AuthSession = {
  id: string
  accountId: string
  email: string
  firstName: string
  lastName: string
  role: AccountRole
}

const isBrowser = () => typeof window !== 'undefined'

export const setSession = (session: AuthSession) => {
  if (!isBrowser()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export const getSession = (): AuthSession | null => {
  if (!isBrowser()) return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed || typeof parsed !== 'object' || !parsed.role) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export const clearSession = () => {
  if (!isBrowser()) return
  localStorage.removeItem(STORAGE_KEY)
}

export const updateSession = (updates: Partial<AuthSession>) => {
  if (!isBrowser()) return
  const current = getSession()
  if (!current) return
  const next = { ...current, ...updates }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

// Clear all locally stored client data to ensure a fresh state on load
export const resetClientState = () => {
  if (!isBrowser()) return
  localStorage.clear()
}
