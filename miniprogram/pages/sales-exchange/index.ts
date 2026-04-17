import { ensureAuthReady } from '../../services/auth-session'
import { listOrders } from '../../services/sales'
import { createSalesExchange, listSalesExchanges } from '../../services/sales-return-exchange'
import { SalesOrder } from '../../types/sales'
import { SalesExchangeRecord } from '../../types/sales-return-exchange'

type ExchangeStep = 'select' | 'fill' | 'done'

const reasonOptions = ['度数变化', '款式不满意', '规格不符', '其他原因']

Component({
  data: {
    step: 'select' as ExchangeStep,
    orders: [] as SalesOrder[],
    selectedOrderId: '',
    selectedOrder: null as SalesOrder | null,
    reasonOptions,
    newItemName: '',
    newItemPrice: '',
    reason: '',
    reasonIndex: -1,
    exchangeList: [] as SalesExchangeRecord[],
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
        const [orders, exchangeList] = await Promise.all([
          listOrders({ status: 'completed' }),
          listSalesExchanges(),
        ])
        this.setData({ orders, exchangeList })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载换货数据失败'
        wx.showToast({ title: message, icon: 'none' })
      }
    },
    onOrderSelect(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const order = this.data.orders.find((o) => o.id === id)
      this.setData({ selectedOrderId: id, selectedOrder: order || null })
    },
    onNewItemInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ newItemName: e.detail.value || '' })
    },
    onNewPriceInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ newItemPrice: e.detail.value || '' })
    },
    onReasonChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
      const idx = Number(e.detail.value)
      this.setData({ reasonIndex: idx, reason: reasonOptions[idx] || '' })
    },
    goFill() {
      if (!this.data.selectedOrderId) {
        wx.showToast({ title: '请选择换货订单', icon: 'none' })
        return
      }
      this.setData({ step: 'fill' })
    },
    goBack() { this.setData({ step: 'select' }) },
    async submitExchange() {
      if (!this.data.newItemName.trim()) {
        wx.showToast({ title: '请输入新商品名称', icon: 'none' })
        return
      }
      if (!this.data.reason) {
        wx.showToast({ title: '请选择换货原因', icon: 'none' })
        return
      }
      this.setData({ submitting: true })
      try {
        const order = this.data.selectedOrder!
        const newPrice = parseFloat(this.data.newItemPrice) || order.amount
        const record = await createSalesExchange({
          orderId: order.id,
          orderNo: order.orderNo,
          memberName: order.memberName,
          originalItem: order.itemName,
          amount: order.amount,
          newItem: this.data.newItemName.trim(),
          newItemPrice: newPrice,
          reason: this.data.reason,
        })
        const exchangeList = [record, ...this.data.exchangeList]
        this.setData({ step: 'done', exchangeList })
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
    goAgain() {
      this.setData({ step: 'select', selectedOrderId: '', selectedOrder: null, newItemName: '', newItemPrice: '', reason: '', reasonIndex: -1 })
    },
  },
})
