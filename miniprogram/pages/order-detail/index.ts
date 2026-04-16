import { ensureAuthReady } from '../../services/auth-session'
import { getOrderById } from '../../services/sales'
import { SalesOrder } from '../../types/sales'
import { formatTime } from '../../utils/util'

interface TimelineItem {
  label: string
  time: string
  done: boolean
}

interface OrderDetailView extends SalesOrder {
  orderTypeLabel: string
  statusLabel: string
  payChannelLabel: string
  createdText: string
  paidText: string
  deliveredText: string
}

function formatOptionalTime(timestamp?: number): string {
  if (!timestamp) {
    return '--'
  }
  return formatTime(new Date(timestamp))
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

function toOrderTypeLabel(orderType: SalesOrder['orderType']): string {
  return orderType === 'optometry' ? '验光开单' : '普通开单'
}

function toPayChannelLabel(payChannel?: SalesOrder['payChannel']): string {
  if (payChannel === 'wechat') {
    return '微信支付'
  }
  if (payChannel === 'balance') {
    return '会员余额'
  }
  if (payChannel === 'cash') {
    return '现金'
  }
  return '--'
}

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    orderId: '',
    detail: null as OrderDetailView | null,
    timeline: [] as TimelineItem[],
  },
  lifetimes: {
    attached() {
      this.refreshDetail()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshDetail()
    },
  },
  methods: {
    getOrderIdFromRoute(): string {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> }
      return current?.options?.orderId || ''
    },
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
    buildTimeline(order: SalesOrder): TimelineItem[] {
      return [
        {
          label: '创建订单',
          time: formatOptionalTime(order.createdAt),
          done: true,
        },
        {
          label: '完成收款',
          time: formatOptionalTime(order.paidAt),
          done: Boolean(order.paidAt),
        },
        {
          label: '顾客取件',
          time: formatOptionalTime(order.deliveredAt),
          done: Boolean(order.deliveredAt),
        },
      ]
    },
    toDetailView(order: SalesOrder): OrderDetailView {
      return {
        ...order,
        orderTypeLabel: toOrderTypeLabel(order.orderType),
        statusLabel: toStatusLabel(order.status),
        payChannelLabel: toPayChannelLabel(order.payChannel),
        createdText: formatOptionalTime(order.createdAt),
        paidText: formatOptionalTime(order.paidAt),
        deliveredText: formatOptionalTime(order.deliveredAt),
      }
    },
    async refreshDetail() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      const orderId = this.getOrderIdFromRoute()
      if (!orderId) {
        wx.showToast({
          title: '缺少订单参数',
          icon: 'none',
        })
        return
      }

      this.setData({
        loading: true,
        orderId,
      })
      try {
        const order = await getOrderById(orderId)
        this.setData({
          detail: this.toDetailView(order),
          timeline: this.buildTimeline(order),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载订单详情失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    goPayment() {
      if (!this.data.orderId) {
        return
      }
      wx.navigateTo({
        url: `/pages/payment/index?orderId=${this.data.orderId}`,
      })
    },
    goDelivery() {
      wx.navigateTo({
        url: '/pages/delivery/index',
      })
    },
    goOrderList() {
      wx.navigateTo({
        url: '/pages/order-list/index',
      })
    },
    goAfterSale() {
      if (!this.data.orderId) {
        return
      }
      wx.navigateTo({
        url: `/pages/after-sale/index?tab=followup&orderId=${this.data.orderId}`,
      })
    },
  },
})
