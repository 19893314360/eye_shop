import { ensureAuthReady } from '../../services/auth-session'
import { listOrders } from '../../services/sales'
import { SalesOrder } from '../../types/sales'
import { formatTime } from '../../utils/util'

type AfterSaleTab = 'followup' | 'recheck' | 'history'

interface AfterSaleRecord {
  followed: boolean
  rechecked: boolean
  updatedAt: number
}

interface AfterSaleItem {
  orderId: string
  orderNo: string
  memberName: string
  itemName: string
  amount: number
  createdText: string
  updatedText: string
  canFollowup: boolean
  canRecheck: boolean
}

const RECORD_STORAGE_KEY = 'yanjing-after-sale-records'

const tabOptions: Array<{ key: AfterSaleTab; label: string }> = [
  { key: 'followup', label: '待回访' },
  { key: 'recheck', label: '待复查' },
  { key: 'history', label: '已处理' },
]

function toRecordMap(raw: unknown): Record<string, AfterSaleRecord> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  const result: Record<string, AfterSaleRecord> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== 'object') {
      continue
    }
    const recordObj = value as Record<string, unknown>
    result[key] = {
      followed: recordObj.followed === true,
      rechecked: recordObj.rechecked === true,
      updatedAt: typeof recordObj.updatedAt === 'number' ? recordObj.updatedAt : 0,
    }
  }
  return result
}

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    tabOptions,
    currentTab: 'followup' as AfterSaleTab,
    keyword: '',
    list: [] as AfterSaleItem[],
    orderIdFromRoute: '',
  },
  lifetimes: {
    attached() {
      this.applyRouteParams()
      this.refreshList()
    },
  },
  pageLifetimes: {
    show() {
      this.applyRouteParams()
      this.refreshList()
    },
  },
  methods: {
    getRouteOptions(): Record<string, string> {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> }
      return current?.options || {}
    },
    applyRouteParams() {
      const options = this.getRouteOptions()
      const tab = options.tab
      const orderId = options.orderId || ''
      if (tab === 'followup' || tab === 'recheck' || tab === 'history') {
        this.setData({
          currentTab: tab,
          orderIdFromRoute: orderId,
        })
        return
      }
      this.setData({
        orderIdFromRoute: orderId,
      })
    },
    readRecordMap(): Record<string, AfterSaleRecord> {
      const raw = wx.getStorageSync(RECORD_STORAGE_KEY)
      return toRecordMap(raw)
    },
    saveRecordMap(map: Record<string, AfterSaleRecord>) {
      wx.setStorageSync(RECORD_STORAGE_KEY, map)
    },
    async ensureAccess(): Promise<boolean> {
      try {
        const state = await ensureAuthReady()
        if (state.role === 'customer') {
          this.setData({
            role: state.role,
            tabOptions: tabOptions.filter((item) => item.key === 'history'),
            currentTab: 'history',
          })
          return true
        }
        this.setData({
          role: state.role,
          tabOptions,
        })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    mapToAfterSaleItems(
      orders: SalesOrder[],
      recordMap: Record<string, AfterSaleRecord>,
      currentTab: AfterSaleTab,
      keyword: string,
      orderIdFromRoute: string,
      role: UserRole
    ): AfterSaleItem[] {
      const normalizedKeyword = keyword.trim()
      const base = orders
        .filter((order) => order.status === 'completed')
        .map((order) => {
          const record = recordMap[order.id] || { followed: false, rechecked: false, updatedAt: 0 }
          return {
            order,
            record,
          }
        })

      const filteredByTab = base.filter(({ record, order }) => {
        if (orderIdFromRoute && order.id !== orderIdFromRoute) {
          return false
        }
        if (role === 'customer') {
          return true
        }
        if (currentTab === 'followup') {
          return !record.followed
        }
        if (currentTab === 'recheck') {
          return record.followed && !record.rechecked
        }
        return record.followed || record.rechecked
      })

      const filteredByKeyword = filteredByTab.filter(({ order }) => {
        if (!normalizedKeyword) {
          return true
        }
        return (
          order.orderNo.includes(normalizedKeyword) ||
          order.memberName.includes(normalizedKeyword) ||
          order.itemName.includes(normalizedKeyword)
        )
      })

      return filteredByKeyword
        .sort((a, b) => b.order.createdAt - a.order.createdAt)
        .map(({ order, record }) => ({
          orderId: order.id,
          orderNo: order.orderNo,
          memberName: order.memberName,
          itemName: order.itemName,
          amount: order.amount,
          createdText: formatTime(new Date(order.createdAt)),
          updatedText: record.updatedAt ? formatTime(new Date(record.updatedAt)) : '--',
          canFollowup: role !== 'customer' && !record.followed,
          canRecheck: role !== 'customer' && record.followed && !record.rechecked,
        }))
    },
    async refreshList() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const orders = await listOrders({
          status: 'completed',
          keyword: this.data.keyword.trim(),
        })
        const recordMap = this.readRecordMap()
        this.setData({
          list: this.mapToAfterSaleItems(
            orders,
            recordMap,
            this.data.currentTab,
            this.data.keyword,
            this.data.orderIdFromRoute,
            this.data.role
          ),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载售后列表失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as AfterSaleTab
      if (!tab || tab === this.data.currentTab) {
        return
      }
      this.setData({
        currentTab: tab,
        orderIdFromRoute: '',
      })
      this.refreshList()
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        keyword: e.detail.value || '',
      })
    },
    onSearch() {
      this.refreshList()
    },
    updateRecord(orderId: string, updater: (record: AfterSaleRecord) => AfterSaleRecord) {
      const map = this.readRecordMap()
      const next = updater(map[orderId] || { followed: false, rechecked: false, updatedAt: 0 })
      map[orderId] = next
      this.saveRecordMap(map)
    },
    markFollowupDone(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId) {
        return
      }
      this.updateRecord(orderId, (record) => ({
        ...record,
        followed: true,
        updatedAt: Date.now(),
      }))
      wx.showToast({
        title: '回访已登记',
        icon: 'success',
      })
      this.refreshList()
    },
    markRecheckDone(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId) {
        return
      }
      this.updateRecord(orderId, (record) => ({
        ...record,
        followed: true,
        rechecked: true,
        updatedAt: Date.now(),
      }))
      wx.showToast({
        title: '复查已处理',
        icon: 'success',
      })
      this.refreshList()
    },
    goOrderDetail(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId) {
        return
      }
      wx.navigateTo({
        url: `/pages/order-detail/index?orderId=${orderId}`,
      })
    },
  },
})
