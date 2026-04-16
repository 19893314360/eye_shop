import { ensureAuthReady } from '../../services/auth-session'
import { listOrders } from '../../services/sales'
import { SalesOrder } from '../../types/sales'
import { formatTime } from '../../utils/util'

type StatusFilter = 'all' | 'awaiting_payment' | 'ready_delivery' | 'completed'
type StatusTone = 'warning' | 'info' | 'success'

interface OrderViewItem extends SalesOrder {
  statusLabel: string
  statusTone: StatusTone
  createdText: string
}

const tabOptions: Array<{ key: StatusFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'awaiting_payment', label: '待收款' },
  { key: 'ready_delivery', label: '待取件' },
  { key: 'completed', label: '已完成' },
]

function toStatusLabel(status: SalesOrder['status']): string {
  if (status === 'awaiting_payment') {
    return '待收款'
  }
  if (status === 'ready_delivery') {
    return '待取件'
  }
  return '已完成'
}

function toStatusTone(status: SalesOrder['status']): StatusTone {
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
    keyword: '',
    currentTab: 'all' as StatusFilter,
    tabOptions,
    orders: [] as OrderViewItem[],
  },
  lifetimes: {
    attached() {
      this.refreshOrders()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshOrders()
    },
  },
  methods: {
    async ensureAccess(): Promise<boolean> {
      try {
        const state = await ensureAuthReady()
        this.setData({
          role: state.role,
        })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    mapToViewItems(list: SalesOrder[]): OrderViewItem[] {
      return list.map((item) => ({
        ...item,
        statusLabel: toStatusLabel(item.status),
        statusTone: toStatusTone(item.status),
        createdText: formatTime(new Date(item.createdAt)),
      }))
    },
    async refreshOrders() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const status = this.data.currentTab === 'all' ? undefined : this.data.currentTab
        const orders = await listOrders({
          status,
          keyword: this.data.keyword.trim(),
        })
        this.setData({
          orders: this.mapToViewItems(orders),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载配镜记录失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        keyword: e.detail.value || '',
      })
    },
    onSearch() {
      this.refreshOrders()
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const key = e.currentTarget.dataset.key as StatusFilter
      if (!key || key === this.data.currentTab) {
        return
      }
      this.setData({ currentTab: key })
      this.refreshOrders()
    },
    goCreateOrder() {
      wx.navigateTo({
        url: '/pages/order-create/index',
      })
    },
    goDetailById(orderId: string) {
      wx.navigateTo({
        url: `/pages/order-detail/index?orderId=${orderId}`,
      })
    },
    goDetail(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId) {
        return
      }
      this.goDetailById(orderId)
    },
    goPayment(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId) {
        return
      }
      wx.navigateTo({
        url: `/pages/payment/index?orderId=${orderId}`,
      })
    },
    goDelivery(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId) {
        return
      }
      wx.navigateTo({
        url: '/pages/delivery/index',
      })
    },
    onActionTap(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      const status = e.currentTarget.dataset.status as SalesOrder['status']
      if (!orderId) {
        return
      }
      if (status === 'awaiting_payment') {
        wx.navigateTo({
          url: `/pages/payment/index?orderId=${orderId}`,
        })
        return
      }
      if (status === 'ready_delivery') {
        wx.navigateTo({
          url: '/pages/delivery/index',
        })
        return
      }
      this.goDetailById(orderId)
    },
  },
})
