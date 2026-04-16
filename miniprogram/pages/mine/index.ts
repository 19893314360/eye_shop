import { getMineMenu, MineItem } from '../../utils/mock-data'
import { ensureAuthReady } from '../../services/auth-session'
import { getModuleRoute } from '../../utils/module-route'
import { ROLE_LABEL } from '../../utils/role'

Component({
  data: {
    role: 'sales' as UserRole,
    roleLabel: ROLE_LABEL.sales,
    userName: '',
    storeName: '',
    menu: [] as MineItem[],
    loading: true,
  },
  lifetimes: {
    attached() {
      this.refreshPage()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshPage()
    },
  },
  methods: {
    async refreshPage() {
      this.setData({ loading: true })
      try {
        const state = await ensureAuthReady()
        this.setData({
          role: state.role,
          roleLabel: ROLE_LABEL[state.role],
          userName: state.userName,
          storeName: state.storeName,
          menu: getMineMenu(state.role),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '页面初始化失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTapMenu(e: WechatMiniprogram.TouchEvent) {
      const name = e.currentTarget.dataset.name as string
      const normalizedName = name.split('（')[0]
      const route = getModuleRoute(normalizedName)
      if (route) {
        wx.navigateTo({
          url: route,
        })
        return
      }
      wx.showToast({
        title: `${name} 待开发`,
        icon: 'none',
      })
    },
    switchRole() {
      wx.navigateTo({
        url: '/pages/entry/index',
      })
    },
  },
})
