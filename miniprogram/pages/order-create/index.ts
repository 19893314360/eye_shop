import { listMembers } from '../../services/member'
import { ensureAuthReady } from '../../services/auth-session'
import { createOrder } from '../../services/sales'
import { Member } from '../../types/member'
import { CreateOrderPayload, OrderType } from '../../types/sales'

interface OrderForm {
  memberId: string
  orderType: OrderType
  itemName: string
  quantity: string
  unitPrice: string
  note: string
}

const orderTypeOptions: Array<{ label: string; value: OrderType }> = [
  { label: '普通开单', value: 'normal' },
  { label: '验光开单', value: 'optometry' },
]

function defaultForm(): OrderForm {
  return {
    memberId: '',
    orderType: 'normal',
    itemName: '',
    quantity: '1',
    unitPrice: '',
    note: '',
  }
}

Component({
  data: {
    form: defaultForm(),
    memberList: [] as Member[],
    memberIndex: 0,
    orderTypeOptions,
    orderTypeIndex: 0,
    submitting: false,
    loadingMembers: false,
    amountPreview: '0.00',
    createdOrderNo: '',
    memberIdFromRoute: '',
  },
  lifetimes: {
    attached() {
      this.applyRouteParams()
      this.refreshMembers()
    },
  },
  pageLifetimes: {
    show() {
      this.applyRouteParams()
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
    getRouteOptions(): Record<string, string> {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> }
      return (current && current.options) || {}
    },
    applyRouteParams() {
      const options = this.getRouteOptions()
      const orderType = options.orderType
      const memberIdFromRoute = options.memberId || ''
      this.setData({
        memberIdFromRoute,
      })
      if (orderType === 'optometry') {
        this.setData({
          orderTypeIndex: 1,
          'form.orderType': 'optometry',
        })
        return
      }
      this.setData({
        orderTypeIndex: 0,
        'form.orderType': 'normal',
      })
    },
    calcAmountPreview() {
      const quantity = Number(this.data.form.quantity || 0)
      const unitPrice = Number(this.data.form.unitPrice || 0)
      const amount = Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : 0
      this.setData({
        amountPreview: amount > 0 ? amount.toFixed(2) : '0.00',
      })
    },
    onInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as keyof OrderForm
      const value = e.detail.value || ''
      this.setData({
        [`form.${field}`]: value,
      })
      if (field === 'quantity' || field === 'unitPrice') {
        this.calcAmountPreview()
      }
    },
    onMemberChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const idx = Number(e.detail.value || 0)
      const member = this.data.memberList[idx]
      if (!member) {
        return
      }
      this.setData({
        memberIndex: idx,
        'form.memberId': member.id,
      })
    },
    onOrderTypeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const idx = Number(e.detail.value || 0)
      const option = orderTypeOptions[idx] || orderTypeOptions[0]
      this.setData({
        orderTypeIndex: idx,
        'form.orderType': option.value,
      })
    },
    async refreshMembers() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loadingMembers: true })
      try {
        const members = await listMembers()
        const preferredMemberId = this.data.memberIdFromRoute
        const preferredIdx = preferredMemberId ? members.findIndex((item) => item.id === preferredMemberId) : -1
        const memberIndex = preferredIdx >= 0 ? preferredIdx : 0
        const selectedMember = members[memberIndex]
        this.setData({
          memberList: members,
          memberIndex,
          'form.memberId': selectedMember ? selectedMember.id : '',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载会员失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loadingMembers: false })
      }
    },
    async submit() {
      if (this.data.submitting) {
        return
      }
      if (!this.data.form.memberId) {
        wx.showToast({ title: '请先选择会员', icon: 'none' })
        return
      }
      if (!this.data.form.itemName.trim()) {
        wx.showToast({ title: '请输入商品名称', icon: 'none' })
        return
      }
      const quantity = Number(this.data.form.quantity)
      const unitPrice = Number(this.data.form.unitPrice)
      if (!Number.isFinite(quantity) || quantity <= 0) {
        wx.showToast({ title: '数量必须大于 0', icon: 'none' })
        return
      }
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
        wx.showToast({ title: '单价必须大于 0', icon: 'none' })
        return
      }

      const payload: CreateOrderPayload = {
        memberId: this.data.form.memberId,
        orderType: this.data.form.orderType,
        itemName: this.data.form.itemName.trim(),
        quantity,
        unitPrice,
        note: this.data.form.note.trim(),
      }

      this.setData({ submitting: true })
      try {
        const order = await createOrder(payload)
        const selectedMember = this.data.memberList[this.data.memberIndex]
        this.setData({
          createdOrderNo: order.orderNo,
          form: {
            ...defaultForm(),
            memberId: selectedMember ? selectedMember.id : '',
          },
          amountPreview: '0.00',
        })
        wx.showToast({
          title: '开单成功',
          icon: 'success',
        })
        wx.showModal({
          title: '开单成功',
          content: `单号：${order.orderNo}，是否立即收款？`,
          confirmText: '去收款',
          cancelText: '稍后',
          success: (res) => {
            if (res.confirm) {
              wx.navigateTo({
                url: `/pages/payment/index?orderId=${order.id}`,
              })
            }
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '开单失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ submitting: false })
      }
    },
    goMemberCreate() {
      wx.navigateTo({
        url: '/pages/member-create/index',
      })
    },
    goPayment() {
      wx.navigateTo({
        url: '/pages/payment/index',
      })
    },
  },
})
