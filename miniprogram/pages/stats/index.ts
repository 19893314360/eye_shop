import { getRank, getSummary, RankItem, StatSummary } from '../../utils/mock-data'
import { ensureAuthReady } from '../../services/auth-session'
import { ROLE_LABEL } from '../../utils/role'

Component({
  data: {
    role: 'sales' as UserRole,
    roleLabel: ROLE_LABEL.sales,
    canView: true,
    summary: [] as StatSummary[],
    rank: [] as RankItem[],
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
        const canView = state.role !== 'customer'
        this.setData({
          role: state.role,
          roleLabel: ROLE_LABEL[state.role],
          canView,
          summary: canView ? getSummary(state.role) : [],
          rank: canView ? getRank(state.role) : [],
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
  },
})
