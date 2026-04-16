export interface LoginRequest {
  code: string
  desiredRole: UserRole
}

export interface LoginResult {
  token: string
  refreshToken: string
  expiresAt: number
}

export interface UserContext {
  userId: string
  userName: string
  role: UserRole
  permissions: string[]
  storeId: string
  storeName: string
  mobile: string
}
