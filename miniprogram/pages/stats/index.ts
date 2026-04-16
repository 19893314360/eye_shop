import { ensureAuthReady } from '../../services/auth-session'
import { ManagerStats, SalesDashboard, getManagerStats, getSalesDashboard } from '../../utils/mock-data'

type Period = 'today' | 'month'
type BusinessTab = 'overview' | 'detail' | 'collection' | 'arrears'

function setPageChrome() {
  wx.setNavigationBarTitle({ title: '统计报表' })
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
    userName: '',
    isManager: false,
    isSales: false,
    period: 'today' as Period,
    businessTab: 'overview' as BusinessTab,
    managerStats: null as ManagerStats | null,
    salesDashboard: null as SalesDashboard | null,
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
    syncStats(role: UserRole, userName: string) {
      if (role === 'manager') {
        this.setData({
          managerStats: getManagerStats(this.data.period, userName),
          salesDashboard: null,
        })
        return
      }

      if (role === 'sales') {
        this.setData({
          managerStats: null,
          salesDashboard: getSalesDashboard(this.data.period, userName),
        })
        return
      }

      this.setData({
        managerStats: null,
        salesDashboard: null,
      })
    },

    async refreshPage() {
      this.setData({ loading: true })

      try {
        const state = await ensureAuthReady()
        setPageChrome()

        this.setData({
          role: state.role,
          userName: state.userName,
          isManager: state.role === 'manager',
          isSales: state.role === 'sales',
        })

        this.syncStats(state.role, state.userName)
      } catch (error) {
        const message = error instanceof Error ? error.message : '统计页初始化失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },

    onPeriodChange(e: WechatMiniprogram.TouchEvent) {
      const period = e.currentTarget.dataset.period as Period
      if (!period || period === this.data.period) {
        return
      }

      this.setData({ period }, () => {
        this.syncStats(this.data.role, this.data.userName)
      })
    },

    onBusinessTabChange(e: WechatMiniprogram.TouchEvent) {
      const businessTab = e.currentTarget.dataset.tab as BusinessTab
      if (!businessTab || businessTab === this.data.businessTab) {
        return
      }

      this.setData({ businessTab })
    },
  },
})
