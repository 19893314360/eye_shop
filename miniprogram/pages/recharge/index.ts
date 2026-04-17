import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type RechargeStep = 'select' | 'confirm' | 'done'

interface RechargePackage {
  amount: number
  bonus: number
  label: string
}

interface BalanceRecord {
  id: string
  title: string
  amount: number
  time: number
  timeText: string
}

const STORAGE_BALANCE = 'yanjing-member-balance'

const rechargePackages: RechargePackage[] = [
  { amount: 200, bonus: 0, label: '200元' },
  { amount: 500, bonus: 30, label: '500元' },
  { amount: 1000, bonus: 80, label: '1000元' },
  { amount: 2000, bonus: 200, label: '2000元' },
  { amount: 5000, bonus: 600, label: '5000元' },
]

Component({
  data: {
    role: 'sales' as UserRole,
    step: 'select' as RechargeStep,
    rechargePackages,
    selectedAmount: 0,
    customAmount: '',
    bonus: 0,
    currentBalance: 0,
    remark: '',
    submitting: false,
    lastRecord: null as BalanceRecord | null,
  },

  lifetimes: {
    attached() {
      this.initPage()
    },
  },
  pageLifetimes: {
    show() {
      this.loadBalance()
    },
  },
  methods: {
    async initPage() {
      try {
        const state = await ensureAuthReady()
        if (state.role !== 'customer') {
          wx.showToast({ title: '仅客户端可充值', icon: 'none' })
          wx.navigateBack({ delta: 1 })
          return
        }
        this.setData({ role: state.role })
      } catch {
        // ignore
      }
      this.loadBalance()
    },
    loadBalance() {
      let balanceRecords = wx.getStorageSync(STORAGE_BALANCE)
      if (!Array.isArray(balanceRecords)) {
        balanceRecords = []
      }
      const balance = (balanceRecords as BalanceRecord[]).reduce((sum: number, r: BalanceRecord) => sum + r.amount, 0)
      this.setData({ currentBalance: balance })
    },
    onPackageSelect(e: WechatMiniprogram.TouchEvent) {
      const amount = e.currentTarget.dataset.amount as number
      const pkg = rechargePackages.find((p) => p.amount === amount)
      this.setData({
        selectedAmount: amount,
        customAmount: '',
        bonus: pkg ? pkg.bonus : 0,
      })
    },
    onCustomAmountInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const raw = e.detail.value || ''
      const num = parseInt(raw, 10)
      const bonus = this.calcBonus(isNaN(num) ? 0 : num)
      this.setData({
        customAmount: raw,
        selectedAmount: 0,
        bonus,
      })
    },
    onRemarkInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ remark: e.detail.value || '' })
    },
    calcBonus(amount: number): number {
      const match = rechargePackages.filter((p) => p.amount <= amount).sort((a, b) => b.amount - a.amount)[0]
      return match ? match.bonus : 0
    },
    getActualAmount(): number {
      return this.data.selectedAmount || parseInt(this.data.customAmount, 10) || 0
    },
    goConfirm() {
      const amount = this.getActualAmount()
      if (amount < 1) {
        wx.showToast({ title: '请选择或输入充值金额', icon: 'none' })
        return
      }
      const bonus = this.data.selectedAmount ? this.data.bonus : this.calcBonus(amount)
      this.setData({ bonus, step: 'confirm' })
    },
    goBack() {
      this.setData({ step: 'select' })
    },
    async submitRecharge() {
      const amount = this.getActualAmount()
      if (amount < 1) return
      this.setData({ submitting: true })
      try {
        const bonus = this.data.bonus
        const totalAdd = amount + bonus
        let balanceRecords: BalanceRecord[] = wx.getStorageSync(STORAGE_BALANCE) || []
        const now = Date.now()
        const record: BalanceRecord = {
          id: 'RC-' + String(now).slice(-6),
          title: '会员充值' + (bonus > 0 ? `（赠送${bonus}）` : ''),
          amount: totalAdd,
          time: now,
          timeText: formatTime(new Date(now)),
        }
        balanceRecords.unshift(record)
        wx.setStorageSync(STORAGE_BALANCE, balanceRecords)
        this.setData({
          step: 'done',
          lastRecord: record,
          currentBalance: this.data.currentBalance + totalAdd,
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : '充值失败'
        wx.showToast({ title: msg, icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
    goRechargeAgain() {
      this.setData({
        step: 'select',
        selectedAmount: 0,
        customAmount: '',
        bonus: 0,
        remark: '',
        lastRecord: null,
      })
    },
    goMemberCenter() {
      wx.navigateTo({ url: '/pages/member-center/index?tab=balance' })
    },
  },
})
