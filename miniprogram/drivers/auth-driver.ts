import { getRuntimeConfig } from '../services/runtime-config'
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
  const fields: Array<{ snake: string; camel: string; value: unknown }> = [
    { snake: 'code', camel: 'code', value: payload.code },
  ]

  if (payload.desiredRole) {
    fields.push({
      snake: 'desired_role',
      camel: 'desiredRole',
      value: payload.desiredRole,
    })
  }

  return buildRequestPayload(fields)
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

function mockLoginByCode(payload: LoginRequest): LoginResult {
  const role = payload.desiredRole || 'sales'
  const now = Date.now()

  return {
    token: `mock-token-${role}-${now}`,
    refreshToken: `mock-refresh-${role}-${now}`,
    expiresAt: now + 2 * 60 * 60 * 1000,
  }
}

function mockFetchProfile(): UserContext {
  const storedState = wx.getStorageSync('yanjing-app-state')
  const desiredRole = wx.getStorageSync('yanjing-desired-role')
  let role: UserRole = 'customer'

  if (storedState && typeof storedState === 'object') {
    const state = storedState as Record<string, unknown>
    if (state.role === 'manager' || state.role === 'sales' || state.role === 'customer') {
      role = state.role
    }
  } else if (desiredRole === 'manager' || desiredRole === 'sales' || desiredRole === 'customer') {
    role = desiredRole
  }

  if (role === 'manager') {
    return {
      userId: 'U-M001',
      userName: '店长',
      role,
      permissions: [
        'member:create',
        'member:read',
        'order:create',
        'order:pay',
        'order:deliver',
        'report:read:all',
        'inventory:manage',
        'purchase:manage',
        'setting:manage',
      ],
      storeId: 'STORE-001',
      storeName: '大锤配镜伊宁店',
      mobile: '13800000001',
    }
  }

  if (role === 'sales') {
    return {
      userId: 'U-S001',
      userName: '吴家伟',
      role,
      permissions: [
        'member:create',
        'member:read',
        'order:create',
        'order:pay',
        'order:deliver',
        'report:read:self',
      ],
      storeId: 'STORE-001',
      storeName: '大锤配镜伊宁店',
      mobile: '13800000002',
    }
  }

  return {
    userId: 'U-C001',
    userName: '张先生',
    role,
    permissions: [],
    storeId: '',
    storeName: '',
    mobile: '13900001234',
  }
}

export async function loginByCodeDriver(payload: LoginRequest): Promise<LoginResult> {
  const runtime = getRuntimeConfig()

  if (runtime.useMockApi) {
    if (payload.desiredRole) {
      wx.setStorageSync('yanjing-desired-role', payload.desiredRole)
    }
    return mockLoginByCode(payload)
  }

  const raw = await http.post<unknown, Record<string, unknown>>('/auth/login', toLoginDTO(payload), {
    withAuth: false,
  })

  return toLoginResult(raw)
}

export async function fetchCurrentProfileDriver(): Promise<UserContext> {
  const runtime = getRuntimeConfig()

  if (runtime.useMockApi) {
    return mockFetchProfile()
  }

  const raw = await http.get<unknown>('/auth/profile')
  return toUserContext(raw)
}
