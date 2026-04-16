import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type StockTab = 'all' | 'low' | 'high'
type StockStatus = 'normal' | 'low' | 'high'

interface StockItem {
  id: string
  sku: string
  name: string
  qty: number
  safeMin: number
  safeMax: number
  location: string
}

interface StockViewItem extends StockItem {
  status: StockStatus
  statusLabel: string
}

interface TraceLog {
  id: string
  sku: string
  action: string
  qtyChange: number
  operator: string
  time: number
}

interface TraceView extends TraceLog {
  timeText: string
  qtyText: string
}

const STOCK_STORAGE_KEY = 'yanjing-inventory-list'
const TRACE_STORAGE_KEY = 'yanjing-inventory-trace'

const tabOptions: Array<{ key: StockTab; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'low', label: '库存不足' },
  { key: 'high', label: '库存超限' },
]

const defaultStockList: StockItem[] = [
  { id: 'INV-001', sku: 'LENS-001', name: '超薄镜片 1.67', qty: 18, safeMin: 20, safeMax: 80, location: 'A-01' },
  { id: 'INV-002', sku: 'FRAME-010', name: '金属镜架 M10', qty: 96, safeMin: 10, safeMax: 90, location: 'B-03' },
  { id: 'INV-003', sku: 'LENS-022', name: '防蓝光镜片 1.60', qty: 45, safeMin: 20, safeMax: 70, location: 'A-06' },
]

const defaultTraceLogs: TraceLog[] = [
  { id: 'LOG-001', sku: 'LENS-001', action: '销售出库', qtyChange: -2, operator: '徐明', time: Date.now() - 2 * 60 * 60 * 1000 },
  { id: 'LOG-002', sku: 'FRAME-010', action: '采购入库', qtyChange: 10, operator: '徐店长', time: Date.now() - 6 * 60 * 60 * 1000 },
  { id: 'LOG-003', sku: 'LENS-022', action: '盘点调整', qtyChange: -1, operator: '周宁', time: Date.now() - 24 * 60 * 60 * 1000 },
]

function parseList<T>(raw: unknown, fallback: T[]): T[] {
  if (!Array.isArray(raw)) {
    return [...fallback]
  }
  return raw as T[]
}

function toStockStatus(item: StockItem): StockStatus {
  if (item.qty < item.safeMin) {
    return 'low'
  }
  if (item.qty > item.safeMax) {
    return 'high'
  }
  return 'normal'
}

function toStatusLabel(status: StockStatus): string {
  if (status === 'low') {
    return '库存不足'
  }
  if (status === 'high') {
    return '库存超限'
  }
  return '正常'
}

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    keyword: '',
    tabOptions,
    currentTab: 'all' as StockTab,
    showTrace: false,
    list: [] as StockViewItem[],
    traceList: [] as TraceView[],
  },
  lifetimes: {
    attached() {
      this.applyRouteParams()
      this.refreshData()
    },
  },
  pageLifetimes: {
    show() {
      this.applyRouteParams()
      this.refreshData()
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
      const trace = options.trace
      if (tab === 'low' || tab === 'high' || tab === 'all') {
        this.setData({
          currentTab: tab,
        })
      }
      this.setData({
        showTrace: trace === '1',
      })
    },
    readStockList(): StockItem[] {
      return parseList<StockItem>(wx.getStorageSync(STOCK_STORAGE_KEY), defaultStockList)
    },
    readTraceList(): TraceLog[] {
      return parseList<TraceLog>(wx.getStorageSync(TRACE_STORAGE_KEY), defaultTraceLogs)
    },
    writeStockList(list: StockItem[]) {
      wx.setStorageSync(STOCK_STORAGE_KEY, list)
    },
    writeTraceList(list: TraceLog[]) {
      wx.setStorageSync(TRACE_STORAGE_KEY, list)
    },
    async ensureAccess(): Promise<boolean> {
      try {
        const state = await ensureAuthReady()
        if (state.role === 'customer') {
          wx.showToast({
            title: '客户端无库存权限',
            icon: 'none',
          })
          wx.navigateBack({
            delta: 1,
          })
          return false
        }
        this.setData({
          role: state.role,
        })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    buildViewList(source: StockItem[]): StockViewItem[] {
      return source.map((item) => {
        const status = toStockStatus(item)
        return {
          ...item,
          status,
          statusLabel: toStatusLabel(status),
        }
      })
    },
    filterViewList(list: StockViewItem[], tab: StockTab, keyword: string): StockViewItem[] {
      const normalizedKeyword = keyword.trim()
      return list
        .filter((item) => {
          if (tab === 'low') {
            return item.status === 'low'
          }
          if (tab === 'high') {
            return item.status === 'high'
          }
          return true
        })
        .filter((item) => {
          if (!normalizedKeyword) {
            return true
          }
          return (
            item.name.includes(normalizedKeyword) ||
            item.sku.includes(normalizedKeyword) ||
            item.location.includes(normalizedKeyword)
          )
        })
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const stockList = this.readStockList()
        const traceList = this.readTraceList().sort((a, b) => b.time - a.time)
        this.writeStockList(stockList)
        this.writeTraceList(traceList)
        const traceViewList: TraceView[] = traceList.map((item) => ({
          ...item,
          timeText: formatTime(new Date(item.time)),
          qtyText: `${item.qtyChange >= 0 ? '+' : ''}${item.qtyChange}`,
        }))

        const viewList = this.buildViewList(stockList)
        this.setData({
          list: this.filterViewList(viewList, this.data.currentTab, this.data.keyword),
          traceList: traceViewList,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载库存失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        keyword: e.detail.value || '',
      })
    },
    onSearch() {
      this.refreshData()
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as StockTab
      if (!tab || tab === this.data.currentTab) {
        return
      }
      this.setData({
        currentTab: tab,
      })
      this.refreshData()
    },
    toggleTrace() {
      this.setData({
        showTrace: !this.data.showTrace,
      })
    },
    adjustStock(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }

      const stockList = this.readStockList()
      const item = stockList.find((s) => s.id === id)
      if (!item) {
        return
      }

      wx.showModal({
        title: '盘点调整',
        content: `商品：${item.name}\n当前库存：${item.qty}\n请输入新库存数量：`,
        editable: true,
        placeholderText: String(item.qty),
        success: (res) => {
          if (res.confirm && res.content) {
            const newQty = parseInt(res.content, 10)
            if (isNaN(newQty) || newQty < 0) {
              wx.showToast({ title: '请输入有效数量', icon: 'none' })
              return
            }

            const qtyChange = newQty - item.qty
            const updatedList = stockList.map((s) => {
              if (s.id === id) {
                return { ...s, qty: newQty }
              }
              return s
            })
            this.writeStockList(updatedList)

            // 记录追踪日志
            const traceList = this.readTraceList()
            const auth = ensureAuthReady()
            auth.then((state) => {
              traceList.unshift({
                id: `LOG-${Date.now()}`,
                sku: item.sku,
                action: '盘点调整',
                qtyChange,
                operator: state.userName || '系统',
                time: Date.now(),
              })
              this.writeTraceList(traceList)
              this.refreshData()
              wx.showToast({ title: '库存已调整', icon: 'success' })
            })
          }
        },
      })
    },
  },
})
