import { listOrders, payOrder } from '../../services/sales'
import { ensureAuthReady } from '../../services/auth-session'
import { PayChannel, SalesOrder } from '../../types/sales'

const payChannelOptions: Array<{ label: string; value: PayChannel }> = [
  { label: '微信支付', value: 'wechat' },
  { label: '会员余额', value: 'balance' },
  { label: '现金', value: 'cash' },
]

Component({
  data: {
    loading: false,
    submitting: false,
    orders: [] as SalesOrder[],
    selectedOrderId: '',
    paidAmount: '',
    payChannelOptions,
    payChannelIndex: 0,
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
        if (state.role === 'customer') {
          wx.showToast({
            title: '客户端无此权限',
            icon: 'none',
          })
          wx.navigateBack({
            delta: 1,
          })
          return false
        }
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    getPreferredOrderIdFromQuery(): string {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> }
      const orderId = current?.options?.orderId || ''
      return orderId
    },
    syncPaidAmount(order: SalesOrder | undefined) {
      this.setData({
        paidAmount: order ? order.amount.toFixed(2) : '',
      })
    },
    async refreshOrders() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const orders = await listOrders({ status: 'awaiting_payment' })
        const preferredOrderId = this.getPreferredOrderIdFromQuery()
        const target = orders.find((item) => item.id === preferredOrderId) || orders[0]
        this.setData({
          orders,
          selectedOrderId: target ? target.id : '',
        })
        this.syncPaidAmount(target)
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载待收款订单失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    chooseOrder(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      const target = this.data.orders.find((item) => item.id === orderId)
      if (!target) {
        return
      }
      this.setData({ selectedOrderId: orderId })
      this.syncPaidAmount(target)
    },
    onPaidAmountInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        paidAmount: e.detail.value || '',
      })
    },
    onPayChannelChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        payChannelIndex: Number(e.detail.value || 0),
      })
    },
    async submitPayment() {
      if (this.data.submitting) {
        return
      }
      const order = this.data.orders.find((item) => item.id === this.data.selectedOrderId)
      if (!order) {
        wx.showToast({ title: '请选择订单', icon: 'none' })
        return
      }
      const paidAmount = Number(this.data.paidAmount)
      if (!Number.isFinite(paidAmount) || paidAmount <= 0) {
        wx.showToast({ title: '请输入有效实收金额', icon: 'none' })
        return
      }
      const payChannel = payChannelOptions[this.data.payChannelIndex]?.value || 'wechat'

      this.setData({ submitting: true })
      try {
        await payOrder(order.id, {
          payChannel,
          paidAmount,
        })
        wx.showToast({
          title: '收款成功',
          icon: 'success',
        })
        await this.refreshOrders()
      } catch (error) {
        const message = error instanceof Error ? error.message : '收款失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ submitting: false })
      }
    },
    goDelivery() {
      wx.navigateTo({
        url: '/pages/delivery/index',
      })
    },
  },
})
