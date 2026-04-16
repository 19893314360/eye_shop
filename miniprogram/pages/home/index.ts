import { ensureAuthReady } from '../../services/auth-session'
import { MetricItem, ModuleSection, getHomeMetrics, getHomeNotice, getHomeSections } from '../../utils/mock-data'
import { getModuleRoute } from '../../utils/module-route'

function setPageChrome(title: string) {
  wx.setNavigationBarTitle({ title })
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
    storeName: '',
    notice: '',
    metrics: [] as MetricItem[],
    sections: [] as ModuleSection[],
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
        setPageChrome(state.storeName || '门店首页')

        this.setData({
          role: state.role,
          storeName: state.storeName,
          notice: getHomeNotice(state.role),
          metrics: getHomeMetrics(state.role),
          sections: getHomeSections(state.role),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '首页初始化失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },

    onTapNotice() {
      const route = getModuleRoute('软件更新日志')
      if (!route) {
        return
      }

      wx.navigateTo({ url: route })
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
  },
})
