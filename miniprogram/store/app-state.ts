import { LoginResult, UserContext } from '../types/auth'

const STATE_STORAGE_KEY = 'yanjing-app-state'
const LEGACY_ROLE_STORAGE_KEY = 'yanjing-role'

export interface AppState {
  token: string
  refreshToken: string
  expiresAt: number
  role: UserRole
  userId: string
  userName: string
  storeId: string
  storeName: string
  mobile: string
  permissions: string[]
  ready: boolean
}

const defaultState: AppState = {
  token: '',
  refreshToken: '',
  expiresAt: 0,
  role: 'sales',
  userId: '',
  userName: '',
  storeId: '',
  storeName: '',
  mobile: '',
  permissions: [],
  ready: false,
}

let state: AppState = { ...defaultState }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUserRole(value: unknown): value is UserRole {
  return value === 'customer' || value === 'sales' || value === 'manager'
}

function cloneState(): AppState {
  return {
    ...state,
    permissions: [...state.permissions],
  }
}

function saveState() {
  wx.setStorageSync(STATE_STORAGE_KEY, state)
}

export function hydrateAppState(): AppState {
  const raw = wx.getStorageSync(STATE_STORAGE_KEY)
  const legacyRole = wx.getStorageSync(LEGACY_ROLE_STORAGE_KEY)
  const next: AppState = { ...defaultState }

  if (isObject(raw)) {
    const role = raw.role
    if (isUserRole(role)) {
      next.role = role
    }
    if (typeof raw.token === 'string') {
      next.token = raw.token
    }
    if (typeof raw.refreshToken === 'string') {
      next.refreshToken = raw.refreshToken
    }
    if (typeof raw.expiresAt === 'number') {
      next.expiresAt = raw.expiresAt
    }
    if (typeof raw.userId === 'string') {
      next.userId = raw.userId
    }
    if (typeof raw.userName === 'string') {
      next.userName = raw.userName
    }
    if (typeof raw.storeId === 'string') {
      next.storeId = raw.storeId
    }
    if (typeof raw.storeName === 'string') {
      next.storeName = raw.storeName
    }
    if (typeof raw.mobile === 'string') {
      next.mobile = raw.mobile
    }
    if (Array.isArray(raw.permissions)) {
      next.permissions = raw.permissions.filter((item): item is string => typeof item === 'string')
    }
    if (typeof raw.ready === 'boolean') {
      next.ready = raw.ready
    }
  } else if (isUserRole(legacyRole)) {
    next.role = legacyRole
  }

  state = next
  saveState()
  return cloneState()
}

export function getAppState(): AppState {
  return cloneState()
}

export function isSessionValid(now = Date.now()): boolean {
  return Boolean(state.token) && state.expiresAt > now + 30_000
}

export function setSession(session: LoginResult) {
  state.token = session.token
  state.refreshToken = session.refreshToken
  state.expiresAt = session.expiresAt
  saveState()
}

export function clearSession(keepRole = true) {
  const role = keepRole ? state.role : 'sales'
  state = {
    ...defaultState,
    role,
  }
  saveState()
}

export function setUserContext(user: UserContext) {
  state.role = user.role
  state.userId = user.userId
  state.userName = user.userName
  state.storeId = user.storeId
  state.storeName = user.storeName
  state.mobile = user.mobile
  state.permissions = [...user.permissions]
  saveState()
}

export function setRole(role: UserRole) {
  state.role = role
  saveState()
}

export function setReady(ready: boolean) {
  state.ready = ready
  saveState()
}

export function hasPermission(permission: string): boolean {
  return state.permissions.includes(permission)
}
