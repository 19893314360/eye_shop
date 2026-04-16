import { ensureAuthReady } from '../../services/auth-session'
import { buildFinanceSummary, FinanceSummary } from '../../services/finance'
import { listOrders } from '../../services/sales'
import { SalesOrder } from '../../types/sales'
import { formatTime } from '../../utils/util'

type FinanceTab = 'all' | 'receivable' | 'received'

interface OrderViewItem extends SalesOrder {
  statusLabel: string
  statusTone: 'warning' | 'info' | 'success'
  createdText: string
}

const tabOptions: Array<{ key: FinanceTab; label: string }> = [
  { key: 'all', label: '全部订单' },
  { key: 'receivable', label: '待收款' },
  { key: 'received', label: '已收款' },
]

const emptySummary: FinanceSummary = {
  totalAmount: 0,
  receivedAmount: 0,
  receivableAmount: 0,
  completedCount: 0,
  awaitingPaymentCount: 0,
}

function toStatusLabel(status: SalesOrder['status']): string {
  if (status === 'awaiting_payment') {
    return '待收款'
  }
  if (status === 'ready_delivery') {
    return '待取件'
  }
  return '已完成'
}

function toStatusTone(status: SalesOrder['status']): 'warning' | 'info' | 'success' {
  if (status === 'awaiting_payment') {
    return 'warning'
  }
  if (status === 'ready_delivery') {
    return 'info'
  }
  return 'success'
}

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    currentTab: 'all' as FinanceTab,
    tabOptions,
    summary: { ...emptySummary },
    list: [] as OrderViewItem[],
  },
  lifetimes: {
    attached() {
      this.refreshData()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshData()
    },
  },
  methods: {
    async ensureAccess(): Promise<boolean> {
      try {
        const auth = await ensureAuthReady()
        if (auth.role === 'customer') {
          wx.showToast({
            title: '客户端无此权限',
            icon: 'none',
          })
          wx.navigateBack({ delta: 1 })
          return false
        }
        this.setData({ role: auth.role })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    mapOrders(orders: SalesOrder[], tab: FinanceTab): OrderViewItem[] {
      let filtered = orders
      if (tab === 'receivable') {
        filtered = orders.filter((item) => item.status === 'awaiting_payment')
      } else if (tab === 'received') {
        filtered = orders.filter((item) => item.status !== 'awaiting_payment')
      }
      return filtered
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((item) => ({
          ...item,
          statusLabel: toStatusLabel(item.status),
          statusTone: toStatusTone(item.status),
          createdText: formatTime(new Date(item.createdAt)),
        }))
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const orders = await listOrders()
        this.setData({
          summary: buildFinanceSummary(orders),
          list: this.mapOrders(orders, this.data.currentTab),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载财务数据失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as FinanceTab
      if (!tab || tab === this.data.currentTab) {
        return
      }
      this.setData({ currentTab: tab })
      this.refreshData()
    },
    goOrderDetail(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }
      wx.navigateTo({
        url: `/pages/order-detail/index?orderId=${id}`,
      })
    },
    goPayment(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }
      wx.navigateTo({
        url: `/pages/payment/index?orderId=${id}`,
      })
    },
    goStats() {
      wx.navigateTo({
        url: '/pages/stats/index',
      })
    },
  },
})
