import { getCurrentAuthState, initializeAuthContext } from './services/auth-session'

App<IAppOption>({
  globalData: {
    role: 'sales',
    token: '',
    userId: '',
    storeId: '',
    storeName: '徐记眼镜店',
    userName: '徐明',
    permissions: [],
    isAuthReady: false,
  },
  onLaunch() {
    const state = getCurrentAuthState()
    this.globalData.role = state.role
    this.globalData.token = state.token
    this.globalData.userId = state.userId
    this.globalData.userName = state.userName
    this.globalData.storeId = state.storeId
    this.globalData.storeName = state.storeName || this.globalData.storeName
    this.globalData.permissions = [...state.permissions]
    this.globalData.isAuthReady = state.ready

    initializeAuthContext().catch((error) => {
      const message = error instanceof Error ? error.message : '登录初始化失败'
      console.error('auth bootstrap failed:', message)
      wx.showToast({
        title: '登录初始化失败',
        icon: 'none',
      })
    })
  },
})
