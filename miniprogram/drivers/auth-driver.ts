import { LoginRequest, LoginResult, UserContext } from '../types/auth'
import { http } from '../utils/request'
import { asDict, readNumber, readString, readStringArray } from './codec'
import { buildRequestPayload } from './payload'

function normalizeRole(value: string): UserRole {
  if (value === 'customer' || value === 'sales' || value === 'manager') {
    return value
  }
  return 'sales'
}

function toLoginDTO(payload: LoginRequest): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'code', camel: 'code', value: payload.code },
    { snake: 'desired_role', camel: 'desiredRole', value: payload.desiredRole },
  ])
}

function toLoginResult(raw: unknown): LoginResult {
  return {
    token: readString(raw, ['token', 'access_token']),
    refreshToken: readString(raw, ['refreshToken', 'refresh_token']),
    expiresAt: readNumber(raw, ['expiresAt', 'expires_at']),
  }
}

function toUserContext(raw: unknown): UserContext {
  const source = asDict(raw)
  return {
    userId: readString(source, ['userId', 'user_id']),
    userName: readString(source, ['userName', 'user_name']),
    role: normalizeRole(readString(source, ['role'])),
    permissions: readStringArray(source, ['permissions', 'permission_list']),
    storeId: readString(source, ['storeId', 'store_id']),
    storeName: readString(source, ['storeName', 'store_name']),
    mobile: readString(source, ['mobile', 'phone']),
  }
}

export async function loginByCodeDriver(payload: LoginRequest): Promise<LoginResult> {
  const raw = await http.post<unknown, Record<string, unknown>>('/auth/login', toLoginDTO(payload), {
    withAuth: false,
  })
  return toLoginResult(raw)
}

export async function fetchCurrentProfileDriver(): Promise<UserContext> {
  const raw = await http.get<unknown>('/auth/profile')
  return toUserContext(raw)
}
