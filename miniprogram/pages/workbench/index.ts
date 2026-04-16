import { ensureAuthReady } from '../../services/auth-session'
import {
  ModuleSection,
  QuickActionItem,
  getWorkbenchQuickActions,
  getWorkbenchSections,
} from '../../utils/mock-data'
import { getModuleRoute } from '../../utils/module-route'

function setPageChrome() {
  wx.setNavigationBarTitle({ title: '全部功能' })
  wx.setNavigationBarColor({
    frontColor: '#ffffff',
    backgroundColor: '#f57c00',
    animation: {
      duration: 0,
      timingFunc: 'linear',
    },
  })
}

Component({
  data: {
    role: 'sales' as UserRole,
    sections: [] as ModuleSection[],
    quickActions: [] as QuickActionItem[],
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
        setPageChrome()

        this.setData({
          role: state.role,
          sections: getWorkbenchSections(state.role),
          quickActions: getWorkbenchQuickActions(state.role),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '功能页初始化失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },

    onTapModule(e: WechatMiniprogram.TouchEvent) {
      const name = e.currentTarget.dataset.name as string
      const route = getModuleRoute(name)

      if (route) {
        wx.navigateTo({ url: route })
        return
      }

      wx.showToast({
        title: `${name} 暂未接入页面`,
        icon: 'none',
      })
    },

    onTapQuick(e: WechatMiniprogram.TouchEvent) {
      const name = e.currentTarget.dataset.name as string
      const route = getModuleRoute(name)

      if (route) {
        wx.navigateTo({ url: route })
        return
      }

      wx.showToast({
        title: `${name} 暂未接入页面`,
        icon: 'none',
      })
    },
  },
})
