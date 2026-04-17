import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type ClaimTab = 'list' | 'apply'
type ClaimStatus = 'pending' | 'approved' | 'rejected'

interface ExpenseClaim {
  id: string
  title: string
  category: string
  amount: number
  description: string
  status: ClaimStatus
  applicant: string
  createdAt: number
  reviewedAt: number
  reviewer: string
}

const STORAGE_KEY = 'yanjing-expense-claims'

const categoryOptions = ['交通费', '办公用品', '招待费', '差旅费', '其他']
const statusLabels: Record<ClaimStatus, string> = { pending: '待审批', approved: '已通过', rejected: '已驳回' }

const defaultClaims: ExpenseClaim[] = [
  { id: 'EC-001', title: '客户拜访交通费', category: '交通费', amount: 120, description: '拜访客户打车费用', status: 'approved', applicant: '徐明', createdAt: Date.now() - 5 * 86400000, reviewedAt: Date.now() - 4 * 86400000, reviewer: '徐店长' },
  { id: 'EC-002', title: '门店办公用品', category: '办公用品', amount: 86, description: '打印纸、笔', status: 'pending', applicant: '徐明', createdAt: Date.now() - 86400000, reviewedAt: 0, reviewer: '' },
]

const tabOptions: Array<{ key: ClaimTab; label: string }> = [
  { key: 'list', label: '报销记录' },
  { key: 'apply', label: '申请报销' },
]

Component({
  data: {
    role: 'sales' as UserRole,
    currentTab: 'list' as ClaimTab,
    tabOptions,
    claims: [] as ExpenseClaim[],
    statusLabels,
    categoryOptions,
    form: { title: '', categoryIndex: 0, amount: '', description: '' },
    submitting: false,
  },
  lifetimes: { attached() { this.initPage() } },
  pageLifetimes: { show() { this.loadData() } },
  methods: {
    async initPage() {
      try {
        const state = await ensureAuthReady()
        this.setData({ role: state.role })
      } catch { /* ignore */ }
      this.loadData()
    },
    loadData() {
      let claims = wx.getStorageSync(STORAGE_KEY)
      if (!Array.isArray(claims) || claims.length === 0) {
        claims = defaultClaims
        wx.setStorageSync(STORAGE_KEY, claims)
      }
      const formatted = (claims as ExpenseClaim[]).map((item) => ({
        ...item,
        createdText: formatTime(new Date(item.createdAt)),
        statusLabel: statusLabels[item.status],
      }))
      this.setData({ claims: formatted })
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as ClaimTab
      if (!tab || tab === this.data.currentTab) return
      this.setData({ currentTab: tab })
    },
    onFormInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as string
      this.setData({ [`form.${field}`]: e.detail.value || '' })
    },
    onCategoryChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
      this.setData({ 'form.categoryIndex': Number(e.detail.value) })
    },
    async submitClaim() {
      const { title, amount, description } = this.data.form
      if (!title.trim()) {
        wx.showToast({ title: '请输入报销标题', icon: 'none' })
        return
      }
      const numAmount = parseFloat(amount)
      if (!numAmount || numAmount <= 0) {
        wx.showToast({ title: '请输入有效金额', icon: 'none' })
        return
      }
      this.setData({ submitting: true })
      try {
        const auth = await ensureAuthReady()
        const newClaim: ExpenseClaim = {
          id: 'EC-' + String(Date.now()).slice(-6),
          title: title.trim(),
          category: categoryOptions[this.data.form.categoryIndex],
          amount: numAmount,
          description: description.trim(),
          status: 'pending',
          applicant: auth.userName,
          createdAt: Date.now(),
          reviewedAt: 0,
          reviewer: '',
        }
        const claims = [newClaim, ...this.data.claims]
        wx.setStorageSync(STORAGE_KEY, claims)
        this.setData({ claims, currentTab: 'list', form: { title: '', categoryIndex: 0, amount: '', description: '' } })
        wx.showToast({ title: '申请已提交', icon: 'success' })
      } catch {
        wx.showToast({ title: '提交失败', icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
    approveClaim(e: WechatMiniprogram.TouchEvent) {
      if (this.data.role !== 'manager') {
        wx.showToast({ title: '仅管理者可审批', icon: 'none' })
        return
      }
      const id = e.currentTarget.dataset.id as string
      const status = e.currentTarget.dataset.status as ClaimStatus
      wx.showModal({
        title: status === 'approved' ? '通过审批' : '驳回报销',
        content: `确定${status === 'approved' ? '通过' : '驳回'}此报销申请？`,
        success: (res) => {
          if (!res.confirm) return
          const claims = this.data.claims.map((item) => {
            if (item.id !== id) return item
            return { ...item, status, reviewedAt: Date.now(), reviewer: this.data.role === 'manager' ? '管理者' : '', statusLabel: statusLabels[status] }
          })
          wx.setStorageSync(STORAGE_KEY, claims)
          this.setData({ claims })
          wx.showToast({ title: '操作成功', icon: 'success' })
        },
      })
    },
  },
})
