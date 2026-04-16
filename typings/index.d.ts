/// <reference path="./types/index.d.ts" />

type UserRole = 'customer' | 'sales' | 'manager'

interface IAppOption {
  globalData: {
    role: UserRole,
    token: string,
    userId: string,
    storeId: string,
    storeName: string,
    userName: string,
    permissions: string[],
    isAuthReady: boolean,
  }
}
