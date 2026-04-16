import { getCurrentAuthState, initializeAuthContext, isSessionValid } from './services/auth-session'

function reLaunchToHome(role: UserRole) {
  const targetMap: Record<UserRole, string> = {
    customer: '/pages/home/index',
    sales: '/pages/home/index',
    manager: '/pages/home/index',
  }

  const target = targetMap[role] || '/pages/home/index'
  const pages = getCurrentPages()
  const currentPage = pages.length > 0 ? pages[pages.length - 1] : null
  const currentRoute = currentPage ? `/${currentPage.route}` : ''

  if (currentRoute === target) {
    return
  }

  wx.reLaunch({ url: target })
}

App<IAppOption>({
  globalData: {
    role: 'sales',
    token: '',
    userId: '',
    storeId: '',
    storeName: '大锤配镜伊宁店',
    userName: '吴家伟',
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

    if (state.ready && isSessionValid() && state.userId) {
      reLaunchToHome(state.role)
      return
    }

    initializeAuthContext()
      .then((authState) => {
        reLaunchToHome(authState.role)
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : '登录初始化失败'
        console.error('auth bootstrap failed:', message)
      })
  },
})
