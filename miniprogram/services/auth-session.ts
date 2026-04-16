import { fetchCurrentProfile, loginByCode } from './auth'
import {
  AppState,
  clearSession,
  getAppState,
  hydrateAppState,
  isSessionValid,
  setReady,
  setRole,
  setSession,
  setUserContext,
} from '../store/app-state'
import { getRuntimeConfig } from './runtime-config'

let bootTask: Promise<AppState> | null = null

function isMockToken(token: string): boolean {
  return token.startsWith('mock-token-')
}

function isSessionModeMatched(token: string, useMockApi: boolean): boolean {
  if (!token) {
    return false
  }
  return useMockApi ? isMockToken(token) : !isMockToken(token)
}

function syncGlobalData(state: AppState) {
  const app = getApp<IAppOption>()
  app.globalData.role = state.role
  app.globalData.token = state.token
  app.globalData.userId = state.userId
  app.globalData.userName = state.userName
  app.globalData.storeId = state.storeId
  app.globalData.storeName = state.storeName
  app.globalData.permissions = [...state.permissions]
  app.globalData.isAuthReady = state.ready
}

function getLoginCode(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) {
          reject(new Error('wx.login 未返回 code'))
          return
        }
        resolve(res.code)
      },
      fail(err) {
        reject(new Error(err.errMsg || 'wx.login 失败'))
      },
    })
  })
}

async function runBootstrap(forceLogin: boolean): Promise<AppState> {
  const current = hydrateAppState()
  const runtime = getRuntimeConfig()
  const sessionValid = isSessionValid() && Boolean(current.userId)
  const modeMatched = isSessionModeMatched(current.token, runtime.useMockApi)

  if (!forceLogin && sessionValid && modeMatched) {
    setReady(true)
    const readyState = getAppState()
    syncGlobalData(readyState)
    return readyState
  }

  setReady(false)
  try {
    const desiredRole = getAppState().role
    const code = await getLoginCode()
    const session = await loginByCode({ code, desiredRole })
    setSession(session)

    const profile = await fetchCurrentProfile()
    setUserContext(profile)
    setReady(true)
    const readyState = getAppState()
    syncGlobalData(readyState)
    return readyState
  } catch (error) {
    clearSession(true)
    setReady(true)
    const readyState = getAppState()
    syncGlobalData(readyState)
    throw error
  }
}

function enqueueBootstrap(forceLogin: boolean): Promise<AppState> {
  if (bootTask) {
    if (!forceLogin) {
      return bootTask
    }
    return bootTask.then(
      () => enqueueBootstrap(true),
      () => enqueueBootstrap(true)
    )
  }
  bootTask = runBootstrap(forceLogin).finally(() => {
    bootTask = null
  })
  return bootTask
}

export function initializeAuthContext(): Promise<AppState> {
  return enqueueBootstrap(false)
}

export function ensureAuthReady(): Promise<AppState> {
  const current = getAppState()
  if (current.ready && isSessionValid() && current.userId) {
    syncGlobalData(current)
    return Promise.resolve(current)
  }
  return enqueueBootstrap(false)
}

export async function switchRole(nextRole: UserRole): Promise<AppState> {
  setRole(nextRole)
  clearSession(true)
  return enqueueBootstrap(true)
}

export function getCurrentAuthState(): AppState {
  const current = getAppState()
  syncGlobalData(current)
  return current
}
