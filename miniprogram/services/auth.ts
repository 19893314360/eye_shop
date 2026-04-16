import { fetchCurrentProfileDriver, loginByCodeDriver } from '../drivers/auth-driver'
import { LoginRequest, LoginResult, UserContext } from '../types/auth'

export function loginByCode(payload: LoginRequest): Promise<LoginResult> {
  return loginByCodeDriver(payload)
}

export function fetchCurrentProfile(): Promise<UserContext> {
  return fetchCurrentProfileDriver()
}
