import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type MemberTab = 'balance' | 'points' | 'coupons'
type CouponTab = 'available' | 'expired'

interface BalanceRecord {
  id: string
  title: string
  amount: number
  time: number
  timeText: string
}

interface PointsRecord {
  id: string
  title: string
  amount: number
  time: number
  timeText: string
}

interface Coupon {
  id: string
  name: string
  value: number
  condition: string
  expireDate: string
  used: boolean
}

interface ExchangeItem {
  id: string
  name: string
  cost: number
  type: 'coupon' | 'gift'
  desc: string
}

const exchangeItems: ExchangeItem[] = [
  { id: 'E001', name: '10元优惠券', cost: 50, type: 'coupon', desc: '满100可用' },
  { id: 'E002', name: '30元优惠券', cost: 120, type: 'coupon', desc: '满200可用' },
  { id: 'E003', name: '清洁护理套装', cost: 200, type: 'gift', desc: '镜片清洁套装' },
  { id: 'E004', name: '50元优惠券', cost: 250, type: 'coupon', desc: '满300可用' },
  { id: 'E005', name: '护眼台灯', cost: 500, type: 'gift', desc: 'LED护眼小台灯' },
]

const STORAGE_BALANCE = 'yanjing-member-balance'
const STORAGE_POINTS = 'yanjing-member-points'
const STORAGE_COUPONS = 'yanjing-member-coupons'

const tabOptions: Array<{ key: MemberTab; label: string }> = [
  { key: 'balance', label: '余额明细' },
  { key: 'points', label: '积分明细' },
  { key: 'coupons', label: '优惠券' },
]

function getDefaultBalanceRecords(): BalanceRecord[] {
  const now = Date.now()
  return [
    { id: 'B001', title: '会员充值', amount: 500, time: now - 3 * 86400000, timeText: '' },
    { id: 'B002', title: '配镜消费', amount: -368, time: now - 2 * 86400000, timeText: '' },
    { id: 'B003', title: '退款', amount: 50, time: now - 86400000, timeText: '' },
  ]
}

function getDefaultPointsRecords(): PointsRecord[] {
  const now = Date.now()
  return [
    { id: 'P001', title: '消费获得积分', amount: 36, time: now - 2 * 86400000, timeText: '' },
    { id: 'P002', title: '签到奖励', amount: 10, time: now - 86400000, timeText: '' },
    { id: 'P003', title: '积分兑换', amount: -20, time: now - 3 * 86400000, timeText: '' },
    { id: 'P004', title: '评价奖励', amount: 5, time: now - 5 * 86400000, timeText: '' },
  ]
}

function getDefaultCoupons(): Coupon[] {
  return [
    { id: 'C001', name: '满减券', value: 50, condition: '满300可用', expireDate: '2026-05-31', used: false },
    { id: 'C002', name: '折扣券', value: 88, condition: '满200可用', expireDate: '2026-04-30', used: false },
    { id: 'C003', name: '新人券', value: 30, condition: '无门槛', expireDate: '2026-04-10', used: false },
  ]
}

Component({
  data: {
    role: 'sales' as UserRole,
    currentTab: 'balance' as MemberTab,
    tabOptions,
    couponTab: 'available' as CouponTab,
    balance: 0,
    points: 0,
    memberLevel: '黄金',
    couponCount: 0,
    balanceList: [] as BalanceRecord[],
    pointsList: [] as PointsRecord[],
    availableCoupons: [] as Coupon[],
    expiredCoupons: [] as Coupon[],
    exchangeItems,
    isCustomer: false,
    showExchange: false,
  },

  lifetimes: {
    attached() {
      this.initRole()
      this.applyRouteParams()
      this.loadData()
    },
  },
  pageLifetimes: {
    show() {
      this.initRole()
      this.applyRouteParams()
      this.loadData()
    },
  },
  methods: {
    async initRole() {
      try {
        const state = await ensureAuthReady()
        this.setData({ role: state.role, isCustomer: state.role === 'customer' })
      } catch {
        // ignore
      }
    },
    applyRouteParams() {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as unknown as { options: Record<string, string> }
      const tab = (current && current.options && current.options.tab) || ''
      if (tab === 'balance' || tab === 'points' || tab === 'coupons') {
        this.setData({ currentTab: tab as MemberTab })
      }
    },
    loadData() {
      // Load balance records
      let balanceRecords = wx.getStorageSync(STORAGE_BALANCE)
      if (!Array.isArray(balanceRecords) || balanceRecords.length === 0) {
        balanceRecords = getDefaultBalanceRecords()
        wx.setStorageSync(STORAGE_BALANCE, balanceRecords)
      }

      // Load points records
      let pointsRecords = wx.getStorageSync(STORAGE_POINTS)
      if (!Array.isArray(pointsRecords) || pointsRecords.length === 0) {
        pointsRecords = getDefaultPointsRecords()
        wx.setStorageSync(STORAGE_POINTS, pointsRecords)
      }

      // Load coupons
      let coupons = wx.getStorageSync(STORAGE_COUPONS)
      if (!Array.isArray(coupons) || coupons.length === 0) {
        coupons = getDefaultCoupons()
        wx.setStorageSync(STORAGE_COUPONS, coupons)
      }

      // Calculate balance and points
      const balance = (balanceRecords as BalanceRecord[]).reduce((sum: number, r: BalanceRecord) => sum + r.amount, 0)
      const points = (pointsRecords as PointsRecord[]).reduce((sum: number, r: PointsRecord) => sum + r.amount, 0)

      // Format time
      const formattedBalance = balanceRecords.map((r: BalanceRecord) => ({
        ...r,
        timeText: formatTime(new Date(r.time)),
      }))
      const formattedPoints = pointsRecords.map((r: PointsRecord) => ({
        ...r,
        timeText: formatTime(new Date(r.time)),
      }))

      // Split coupons
      const today = new Date()
      const availableCoupons = coupons.filter((c: Coupon) => {
        const expireDate = new Date(c.expireDate)
        return expireDate >= today && !c.used
      })
      const expiredCoupons = coupons.filter((c: Coupon) => {
        const expireDate = new Date(c.expireDate)
        return expireDate < today || c.used
      })

      // Determine member level
      let memberLevel = '普通'
      if (points >= 500) memberLevel = '钻石'
      else if (points >= 200) memberLevel = '黄金'
      else if (points >= 50) memberLevel = '白银'

      this.setData({
        balance,
        points,
        memberLevel,
        couponCount: availableCoupons.length,
        balanceList: formattedBalance,
        pointsList: formattedPoints,
        availableCoupons,
        expiredCoupons,
      })
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as MemberTab
      if (!tab || tab === this.data.currentTab) return
      this.setData({ currentTab: tab })
    },
    onCouponTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as CouponTab
      if (!tab || tab === this.data.couponTab) return
      this.setData({ couponTab: tab })
    },
    useCoupon(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const coupon = this.data.availableCoupons.find((c) => c.id === id)
      if (!coupon) return

      wx.showModal({
        title: '使用优惠券',
        content: `确定使用「${coupon.name}」（${coupon.condition}）？`,
        success: (res) => {
          if (res.confirm) {
            const allCoupons: Coupon[] = wx.getStorageSync(STORAGE_COUPONS) || []
            const updated = allCoupons.map((c) => {
              if (c.id === id) {
                return { ...c, used: true }
              }
              return c
            })
            wx.setStorageSync(STORAGE_COUPONS, updated)
            this.loadData()
            wx.showToast({ title: '优惠券已使用', icon: 'success' })
          }
        },
      })
    },
    goRecharge() {
      wx.navigateTo({ url: '/pages/recharge/index' })
    },
    toggleExchange() {
      this.setData({ showExchange: !this.data.showExchange })
    },
    doExchange(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const item = exchangeItems.find((i) => i.id === id)
      if (!item) return
      if (this.data.points < item.cost) {
        wx.showToast({ title: '积分不足', icon: 'none' })
        return
      }
      wx.showModal({
        title: '确认兑换',
        content: `使用${item.cost}积分兑换「${item.name}」？`,
        success: (res) => {
          if (!res.confirm) return
          let pointsRecords: PointsRecord[] = wx.getStorageSync(STORAGE_POINTS) || []
          const now = Date.now()
          pointsRecords.unshift({
            id: 'PE-' + String(now).slice(-6),
            title: '\u79EF\u5206\u5151\u6362\uFF1A' + item.name,
            amount: -item.cost,
            time: now,
            timeText: formatTime(new Date(now)),
          })
          wx.setStorageSync(STORAGE_POINTS, pointsRecords)
          if (item.type === 'coupon') {
            const couponValue = item.id === 'E001' ? 10 : item.id === 'E002' ? 30 : 50
            let coupons: Coupon[] = wx.getStorageSync(STORAGE_COUPONS) || []
            coupons.unshift({
              id: 'CE-' + String(now).slice(-6),
              name: item.name,
              value: couponValue,
              condition: item.desc,
              expireDate: new Date(now + 30 * 86400000).toISOString().slice(0, 10),
              used: false,
            })
            wx.setStorageSync(STORAGE_COUPONS, coupons)
          }
          this.loadData()
          wx.showToast({ title: '兑换成功', icon: 'success' })
        },
      })
    },
  },
})
