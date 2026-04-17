import { ensureAuthReady } from '../../services/auth-session'
import { listOrders } from '../../services/sales'
import { createSalesReturn, listSalesReturns } from '../../services/sales-return-exchange'
import { SalesOrder } from '../../types/sales'
import { SalesRefundChannel, SalesReturnRecord } from '../../types/sales-return-exchange'

type ReturnStep = 'select' | 'fill' | 'done'

const reasonOptions = ['质量问题', '客户不满意', '配镜数据有误', '商品损坏', '其他原因']
const refundChannels: SalesRefundChannel[] = ['原路退回', '余额退回', '现金退款']

Component({
  data: {
    step: 'select' as ReturnStep,
    orders: [] as SalesOrder[],
    selectedOrderId: '',
    selectedOrder: null as SalesOrder | null,
    reasonOptions,
    refundChannels,
    reason: '',
    reasonIndex: -1,
    refundChannel: '' as SalesRefundChannel | '',
    refundChannelIndex: -1,
    returnList: [] as SalesReturnRecord[],
    submitting: false,
  },
  lifetimes: { attached() { this.initPage() } },
  methods: {
    async initPage() {
      try {
        const state = await ensureAuthReady()
        if (state.role === 'customer') {
          wx.showToast({ title: '无此权限', icon: 'none' })
          wx.navigateBack({ delta: 1 })
          return
        }
      } catch { /* ignore */ }
      await this.loadData()
    },
    async loadData() {
      try {
        const [orders, returnList] = await Promise.all([
          listOrders({ status: 'completed' }),
          listSalesReturns(),
        ])
        this.setData({ orders, returnList })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载退货数据失败'
        wx.showToast({ title: message, icon: 'none' })
      }
    },
    onOrderSelect(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const order = this.data.orders.find((o) => o.id === id)
      this.setData({ selectedOrderId: id, selectedOrder: order || null })
    },
    onReasonChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
      const idx = Number(e.detail.value)
      this.setData({ reasonIndex: idx, reason: reasonOptions[idx] || '' })
    },
    onRefundChannelChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
      const idx = Number(e.detail.value)
      this.setData({ refundChannelIndex: idx, refundChannel: refundChannels[idx] || '' })
    },
    goFill() {
      if (!this.data.selectedOrderId) {
        wx.showToast({ title: '请选择退货订单', icon: 'none' })
        return
      }
      this.setData({ step: 'fill' })
    },
    goBack() {
      this.setData({ step: 'select' })
    },
    async submitReturn() {
      if (!this.data.reason) {
        wx.showToast({ title: '请选择退货原因', icon: 'none' })
        return
      }
      if (!this.data.refundChannel) {
        wx.showToast({ title: '请选择退款方式', icon: 'none' })
        return
      }
      this.setData({ submitting: true })
      try {
        const order = this.data.selectedOrder!
        const record = await createSalesReturn({
          orderId: order.id,
          orderNo: order.orderNo,
          memberName: order.memberName,
          itemName: order.itemName,
          amount: order.amount,
          reason: this.data.reason,
          refundChannel: this.data.refundChannel,
        })
        const returnList = [record, ...this.data.returnList]
        this.setData({ step: 'done', returnList })
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
    goAgain() {
      this.setData({ step: 'select', selectedOrderId: '', selectedOrder: null, reason: '', reasonIndex: -1, refundChannel: '', refundChannelIndex: -1 })
    },
  },
})
