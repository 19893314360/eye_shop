import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type TransferTab = 'pending' | 'completed' | 'scan'
type TransferStatus = 'pending' | 'shipped' | 'received'

interface TransferGoodsItem {
  id: string
  stockId: string
  sku: string
  name: string
  location: string
  qty: number
}

interface TransferInRecord {
  id: string
  transferNo: string
  sourceStore: string
  operator: string
  items: TransferGoodsItem[]
  note: string
  status: TransferStatus
  createdAt: number
  receivedAt?: number
  receiver?: string
}

const TRANSFER_IN_LIST_KEY = 'yanjing-transfer-in-list'

const tabOptions: Array<{ key: TransferTab; label: string }> = [
  { key: 'pending', label: '待入库' },
  { key: 'completed', label: '已入库' },
  { key: 'scan', label: '扫码入库' },
]

function toStatusLabel(status: TransferStatus): string {
  if (status === 'pending') return '待入库'
  if (status === 'shipped') return '运输中'
  return '已入库'
}

function generateMockData(): TransferInRecord[] {
  return [
    {
      id: 'TIN-001',
      transferNo: 'TO20260415001',
      sourceStore: '徐记总店',
      operator: '徐明',
      items: [
        { id: 'TG-001', stockId: 'INV-001', sku: 'LENS-001', name: '超薄镜片 1.67', location: 'A-01', qty: 10 },
        { id: 'TG-002', stockId: 'INV-003', sku: 'LENS-022', name: '防蓝光镜片 1.60', location: 'A-06', qty: 5 },
      ],
      note: '东城分店补货',
      status: 'pending',
      createdAt: Date.now() - 2 * 60 * 60 * 1000,
    },
    {
      id: 'TIN-002',
      transferNo: 'TO20260414002',
      sourceStore: '徐记西城店',
      operator: '周宁',
      items: [
        { id: 'TG-003', stockId: 'INV-002', sku: 'FRAME-010', name: '金属镜架 M10', location: 'B-03', qty: 20 },
      ],
      note: '',
      status: 'received',
      createdAt: Date.now() - 24 * 60 * 60 * 1000,
      receivedAt: Date.now() - 20 * 60 * 60 * 1000,
      receiver: '徐店长',
    },
  ]
}

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    currentTab: 'pending' as TransferTab,
    tabOptions,
    list: [] as TransferInRecord[],
    scanResult: '',
  },
  lifetimes: {
    attached() {
      this.initMockData()
      this.refreshData()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshData()
    },
  },
  methods: {
    async ensureAccess(): Promise<boolean> {
      try {
        const auth = await ensureAuthReady()
        if (auth.role === 'customer') {
          wx.showToast({ title: '客户端无此权限', icon: 'none' })
          wx.navigateBack({ delta: 1 })
          return false
        }
        this.setData({ role: auth.role })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    initMockData() {
      const existing = wx.getStorageSync(TRANSFER_IN_LIST_KEY)
      if (!existing || !Array.isArray(existing) || existing.length === 0) {
        const mockData = generateMockData()
        wx.setStorageSync(TRANSFER_IN_LIST_KEY, mockData)
      }
    },
    readTransferList(): TransferInRecord[] {
      const raw = wx.getStorageSync(TRANSFER_IN_LIST_KEY)
      return Array.isArray(raw) ? raw : []
    },
    saveTransferList(list: TransferInRecord[]) {
      wx.setStorageSync(TRANSFER_IN_LIST_KEY, list)
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) return

      this.setData({ loading: true })
      try {
        const allList = this.readTransferList()
        const { currentTab } = this.data

        let filtered: TransferInRecord[] = []
        if (currentTab === 'pending') {
          filtered = allList.filter((item) => item.status === 'pending' || item.status === 'shipped')
        } else if (currentTab === 'completed') {
          filtered = allList.filter((item) => item.status === 'received')
        } else {
          filtered = allList
        }

        const formattedList = filtered
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((item) => ({
            ...item,
            statusLabel: toStatusLabel(item.status),
            outTime: formatTime(new Date(item.createdAt)),
          }))

        this.setData({ list: formattedList })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as TransferTab
      if (!tab || tab === this.data.currentTab) return
      this.setData({ currentTab: tab, scanResult: '' })
      this.refreshData()
    },
    scanCode() {
      wx.scanCode({
        success: (res) => {
          this.setData({ scanResult: res.result })
          wx.showToast({ title: '扫码成功', icon: 'success' })
          this.processScanResult(res.result)
        },
        fail: () => {
          wx.showToast({ title: '扫码失败', icon: 'none' })
        },
      })
    },
    processScanResult(result: string) {
      const list = this.readTransferList()
      const found = list.find((item) => item.transferNo === result || item.id === result)

      if (found) {
        if (found.status === 'received') {
          wx.showModal({
            title: '提示',
            content: '该调拨单已入库，是否查看详情？',
            success: (res) => {
              if (res.confirm) {
                this.setData({ currentTab: 'completed' })
                this.refreshData()
              }
            },
          })
        } else {
          wx.showModal({
            title: '提示',
            content: `找到调拨单 ${found.transferNo}，是否确认入库？`,
            success: async (res) => {
              if (res.confirm) {
                await this.doConfirmReceipt(found.id)
              }
            },
          })
        }
      } else {
        wx.showToast({ title: '未找到匹配的调拨单', icon: 'none' })
      }
    },
    async doConfirmReceipt(id: string) {
      const auth = await ensureAuthReady()
      const list = this.readTransferList()
      const updated = list.map((item) => {
        if (item.id !== id) return item
        return {
          ...item,
          status: 'received' as TransferStatus,
          receivedAt: Date.now(),
          receiver: auth.userName || '系统',
        }
      })
      this.saveTransferList(updated)
      wx.showToast({ title: '入库确认成功', icon: 'success' })
      this.refreshData()
    },
    confirmReceipt(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) return

      wx.showModal({
        title: '确认入库',
        content: '确认收到该调拨单的所有商品？',
        success: (res) => {
          if (res.confirm) {
            this.doConfirmReceipt(id)
          }
        },
      })
    },
    batchReceipt() {
      const pendingItems = this.data.list.filter((item: TransferInRecord) => item.status === 'pending')
      if (pendingItems.length === 0) {
        wx.showToast({ title: '没有待入库单据', icon: 'none' })
        return
      }

      wx.showModal({
        title: '批量确认入库',
        content: `确认入库 ${pendingItems.length} 个调拨单？`,
        success: async (res) => {
          if (res.confirm) {
            const auth = await ensureAuthReady()
            const list = this.readTransferList()
            const updated = list.map((item) => {
              if (item.status !== 'pending') return item
              return {
                ...item,
                status: 'received' as TransferStatus,
                receivedAt: Date.now(),
                receiver: auth.userName || '系统',
              }
            })
            this.saveTransferList(updated)
            wx.showToast({ title: '批量入库成功', icon: 'success' })
            this.refreshData()
          }
        },
      })
    },
    viewDetail(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const item = this.data.list.find((i: TransferInRecord) => i.id === id)
      if (!item) return

      const itemsText = item.items.map((goods) => `${goods.name} ×${goods.qty}`).join('\n')
      wx.showModal({
        title: `调拨单 ${item.transferNo}`,
        content: `来源：${item.sourceStore}\n操作人：${item.operator}\n商品：\n${itemsText}`,
        showCancel: false,
      })
    },
  },
})
