import { deliverOrder, listOrders } from '../../services/sales'
import { ensureAuthReady } from '../../services/auth-session'
import { SalesOrder } from '../../types/sales'

Component({
  data: {
    loading: false,
    deliveringId: '',
    readyOrders: [] as SalesOrder[],
    completedOrders: [] as SalesOrder[],
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
    async refreshOrders() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const [readyOrders, completedOrders] = await Promise.all([
          listOrders({ status: 'ready_delivery' }),
          listOrders({ status: 'completed' }),
        ])
        this.setData({
          readyOrders,
          completedOrders: completedOrders.slice(0, 8),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载取件数据失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    async finishDelivery(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId || this.data.deliveringId) {
        return
      }
      this.setData({ deliveringId: orderId })
      try {
        await deliverOrder(orderId)
        wx.showToast({
          title: '取件核销成功',
          icon: 'success',
        })
        await this.refreshOrders()
      } catch (error) {
        const message = error instanceof Error ? error.message : '取件核销失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ deliveringId: '' })
      }
    },
    goPayment() {
      wx.navigateTo({
        url: '/pages/payment/index',
      })
    },
  },
})
