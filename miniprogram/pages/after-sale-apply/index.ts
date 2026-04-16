import { ensureAuthReady } from '../../services/auth-session'

type AfterSaleType = 'return' | 'exchange' | 'repair' | 'refund'

interface OrderOption {
  value: string
  label: string
}

const typeOptions: Array<{ value: AfterSaleType; label: string; icon: string }> = [
  { value: 'return', label: '退货', icon: '📦' },
  { value: 'exchange', label: '换货', icon: '🔄' },
  { value: 'repair', label: '维修', icon: '🔧' },
  { value: 'refund', label: '退款', icon: '💰' },
]

const reasonOptions = [
  '商品质量问题',
  '尺寸不合适',
  '款式不喜欢',
  '度数有误',
  '镜架损坏',
  '其他原因',
]

const STORAGE_KEY = 'yanjing-after-sale-applies'

function generateApplyNo(): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `AS${dateStr}${random}`
}

Component({
  data: {
    orderOptions: [] as OrderOption[],
    orderIndex: 0,
    typeOptions,
    reasonOptions,
    afterSaleType: 'return' as AfterSaleType,
    reason: '',
    remark: '',
    images: [] as string[],
    phone: '',
    submitting: false,
  },
  lifetimes: {
    attached() {
      this.loadOrders()
      this.loadPhone()
    },
  },
  methods: {
    async loadPhone() {
      try {
        const auth = await ensureAuthReady()
        if (auth.mobile) {
          this.setData({ phone: auth.mobile })
        }
      } catch (error) {
        // ignore
      }
    },
    loadOrders() {
      // Load mock orders
      const orders: OrderOption[] = [
        { value: 'ORD-20260415-001', label: 'ORD-20260415-001 超薄镜片+钛架  ¥688' },
        { value: 'ORD-20260410-002', label: 'ORD-20260410-002 防蓝光镜片  ¥368' },
        { value: 'ORD-20260405-003', label: 'ORD-20260405-003 渐进镜片套装  ¥1280' },
      ]
      this.setData({ orderOptions: orders })
    },
    onOrderChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ orderIndex: Number(e.detail.value || 0) })
    },
    onTypeChange(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type as AfterSaleType
      this.setData({ afterSaleType: type })
    },
    onReasonChange(e: WechatMiniprogram.TouchEvent) {
      const reason = e.currentTarget.dataset.reason as string
      this.setData({ reason })
    },
    onRemarkInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ remark: e.detail.value || '' })
    },
    onPhoneInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ phone: e.detail.value || '' })
    },
    chooseImage() {
      const remaining = 3 - this.data.images.length
      if (remaining <= 0) {
        wx.showToast({ title: '最多上传3张图片', icon: 'none' })
        return
      }
      wx.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const images = [...this.data.images, ...res.tempFilePaths]
          this.setData({ images })
        },
      })
    },
    deleteImage(e: WechatMiniprogram.TouchEvent) {
      const index = e.currentTarget.dataset.index as number
      const images = this.data.images.filter((_, i) => i !== index)
      this.setData({ images })
    },
    async submitApply() {
      if (this.data.submitting) return

      const { orderOptions, orderIndex, afterSaleType, reason, remark, phone, images } = this.data

      if (orderOptions.length === 0) {
        wx.showToast({ title: '暂无可申请的订单', icon: 'none' })
        return
      }

      if (!reason) {
        wx.showToast({ title: '请选择申请原因', icon: 'none' })
        return
      }

      if (!phone || phone.length !== 11) {
        wx.showToast({ title: '请输入正确的联系电话', icon: 'none' })
        return
      }

      this.setData({ submitting: true })

      try {
        const auth = await ensureAuthReady()
        const apply = {
          id: generateApplyNo(),
          orderId: orderOptions[orderIndex].value,
          type: afterSaleType,
          reason,
          remark,
          phone,
          images,
          status: 'pending',
          applicant: auth.userName || '客户',
          createdAt: Date.now(),
        }

        const history: unknown[] = wx.getStorageSync(STORAGE_KEY) || []
        history.unshift(apply)
        wx.setStorageSync(STORAGE_KEY, history)

        wx.showModal({
          title: '提交成功',
          content: `售后申请单号：${apply.id}\n我们将在 1-3 个工作日内处理您的申请，请耐心等待。`,
          showCancel: false,
          success: () => {
            wx.navigateBack()
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
  },
})
