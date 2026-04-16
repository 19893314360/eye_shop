import { ensureAuthReady } from '../../services/auth-session'

interface StockItem {
  id: string
  sku: string
  name: string
  qty: number
  location: string
}

interface TransferItem {
  id: string
  stockId: string
  sku: string
  name: string
  location: string
  qty: number
  targetWarehouse: string
}

interface TransferOutRecord {
  id: string
  transferNo: string
  targetWarehouse: string
  items: TransferItem[]
  note: string
  operator: string
  status: 'pending' | 'shipped' | 'received'
  createdAt: number
  totalItems?: number
}

type HistoryTab = 'all' | 'pending' | 'completed'

const TRANSFER_OUT_KEY = 'yanjing-transfer-out'
const TRANSFER_OUT_LIST_KEY = 'yanjing-transfer-out-list'

const warehouseOptions: Array<{ label: string; value: string }> = [
  { label: '请选择目标仓库', value: '' },
  { label: '东城分店仓库', value: 'WAREHOUSE-DONGCHENG' },
  { label: '西城分店仓库', value: 'WAREHOUSE-XICHENG' },
  { label: '北城分店仓库', value: 'WAREHOUSE-BEICHENG' },
]

function generateTransferNo(): string {
  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `TO${dateStr}${random}`
}

const historyTabOptions: Array<{ key: HistoryTab; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待入库' },
  { key: 'completed', label: '已完成' },
]

Component({
  data: {
    loading: false,
    submitting: false,
    showingHistory: false,
    role: 'sales' as UserRole,
    warehouseOptions,
    warehouseIndex: 0,
    targetWarehouse: '',
    transferNo: '',
    note: '',
    searchKeyword: '',
    stockList: [] as StockItem[],
    selectedStock: null as StockItem | null,
    transferQty: '',
    transferList: [] as TransferItem[],
    totalQty: 0,
    historyTab: 'all' as HistoryTab,
    historyTabOptions,
    historyList: [] as TransferOutRecord[],
  },
  lifetimes: {
    attached() {
      this.initData()
      this.ensureAccess()
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
    initData() {
      this.setData({
        transferNo: generateTransferNo(),
        transferList: [],
        totalQty: 0,
      })
      this.loadDraft()
    },
    loadDraft() {
      const draft = wx.getStorageSync(TRANSFER_OUT_KEY)
      if (draft && typeof draft === 'object') {
        this.setData({
          warehouseIndex: draft.warehouseIndex || 0,
          targetWarehouse: draft.targetWarehouse || '',
          note: draft.note || '',
          transferList: draft.transferList || [],
        })
        this.calcTotal()
      }
    },
    saveDraft() {
      const { warehouseIndex, targetWarehouse, note, transferList } = this.data
      wx.setStorageSync(TRANSFER_OUT_KEY, { warehouseIndex, targetWarehouse, note, transferList })
    },
    onWarehouseChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const index = Number(e.detail.value || 0)
      this.setData({
        warehouseIndex: index,
        targetWarehouse: warehouseOptions[index]?.value || '',
      })
      this.saveDraft()
    },
    onNoteInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ note: e.detail.value || '' })
      this.saveDraft()
    },
    onSearchInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ searchKeyword: e.detail.value || '' })
    },
    searchStock() {
      const keyword = this.data.searchKeyword.trim()
      if (!keyword) {
        wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
        return
      }

      const allStock: StockItem[] = [
        { id: 'INV-001', sku: 'LENS-001', name: '超薄镜片 1.67', qty: 18, location: 'A-01' },
        { id: 'INV-002', sku: 'FRAME-010', name: '金属镜架 M10', qty: 96, location: 'B-03' },
        { id: 'INV-003', sku: 'LENS-022', name: '防蓝光镜片 1.60', qty: 45, location: 'A-06' },
        { id: 'INV-004', sku: 'LENS-005', name: '渐进镜片 1.60', qty: 12, location: 'A-02' },
        { id: 'INV-005', sku: 'FRAME-001', name: '钛架镜框 T1', qty: 8, location: 'B-01' },
      ]

      const filtered = allStock.filter(
        (item) => item.name.includes(keyword) || item.sku.includes(keyword)
      )

      this.setData({ stockList: filtered })
      if (filtered.length === 0) {
        wx.showToast({ title: '未找到匹配商品', icon: 'none' })
      }
    },
    selectStock(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const stock = this.data.stockList.find((item) => item.id === id)
      if (stock) {
        this.setData({ selectedStock: stock, transferQty: '' })
      }
    },
    onQtyInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ transferQty: e.detail.value || '' })
    },
    addToList() {
      const { selectedStock, transferQty, targetWarehouse, transferList } = this.data

      if (!selectedStock) {
        wx.showToast({ title: '请先选择商品', icon: 'none' })
        return
      }

      if (!targetWarehouse) {
        wx.showToast({ title: '请先选择目标仓库', icon: 'none' })
        return
      }

      const qty = parseInt(transferQty, 10)
      if (!qty || qty <= 0) {
        wx.showToast({ title: '请输入有效的调拨数量', icon: 'none' })
        return
      }

      if (qty > selectedStock.qty) {
        wx.showToast({ title: '调拨数量不能超过库存', icon: 'none' })
        return
      }

      const existingIndex = transferList.findIndex((item) => item.stockId === selectedStock.id)
      if (existingIndex >= 0) {
        wx.showToast({ title: '该商品已在调拨清单中', icon: 'none' })
        return
      }

      const newItem: TransferItem = {
        id: `TI-${Date.now()}`,
        stockId: selectedStock.id,
        sku: selectedStock.sku,
        name: selectedStock.name,
        location: selectedStock.location,
        qty,
        targetWarehouse: warehouseOptions.find((w) => w.value === targetWarehouse)?.label || targetWarehouse,
      }

      const newList = [...transferList, newItem]
      this.setData({
        transferList: newList,
        selectedStock: null,
        transferQty: '',
        stockList: [],
        searchKeyword: '',
      })
      this.calcTotal()
      this.saveDraft()
      wx.showToast({ title: '已添加到清单', icon: 'success' })
    },
    removeFromList(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const newList = this.data.transferList.filter((item) => item.id !== id)
      this.setData({ transferList: newList })
      this.calcTotal()
      this.saveDraft()
    },
    calcTotal() {
      const total = this.data.transferList.reduce((sum, item) => sum + item.qty, 0)
      this.setData({ totalQty: total })
    },
    async submitTransfer() {
      if (this.data.submitting) return

      const { transferList, targetWarehouse, note, transferNo } = this.data

      if (!targetWarehouse) {
        wx.showToast({ title: '请选择目标仓库', icon: 'none' })
        return
      }

      if (transferList.length === 0) {
        wx.showToast({ title: '调拨清单为空', icon: 'none' })
        return
      }

      this.setData({ submitting: true })

      try {
        const auth = await ensureAuthReady()
        const record: TransferOutRecord = {
          id: `TOR-${Date.now()}`,
          transferNo,
          targetWarehouse,
          items: transferList,
          note,
          operator: auth.userName || '系统',
          status: 'pending',
          createdAt: Date.now(),
        }

        const history = wx.getStorageSync(TRANSFER_OUT_LIST_KEY) || []
        history.unshift(record)
        wx.setStorageSync(TRANSFER_OUT_LIST_KEY, history)

        wx.removeStorageSync(TRANSFER_OUT_KEY)

        wx.showModal({
          title: '调拨出库成功',
          content: `调拨单号：${transferNo}，共 ${transferList.length} 种商品，${this.data.totalQty} 件`,
          showCancel: false,
          success: () => {
            this.initData()
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
    toggleHistory() {
      const showingHistory = !this.data.showingHistory
      this.setData({ showingHistory })
      if (showingHistory) {
        this.loadHistory()
      }
    },
    loadHistory() {
      const allRecords: TransferOutRecord[] = wx.getStorageSync(TRANSFER_OUT_LIST_KEY) || []
      this.filterHistory(allRecords)
    },
    filterHistory(records: TransferOutRecord[]) {
      const { historyTab } = this.data
      let filtered = records

      if (historyTab === 'pending') {
        filtered = records.filter((r) => r.status === 'pending' || r.status === 'shipped')
      } else if (historyTab === 'completed') {
        filtered = records.filter((r) => r.status === 'received')
      }

      // Pre-calculate total items for WXML display
      const processed = filtered.map((record) => ({
        ...record,
        totalItems: record.items.reduce((sum, item) => sum + item.qty, 0),
      }))

      this.setData({ historyList: processed.sort((a, b) => b.createdAt - a.createdAt) })
    },
    onHistoryTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as HistoryTab
      if (!tab || tab === this.data.historyTab) return
      this.setData({ historyTab: tab })
      this.loadHistory()
    },
    viewHistoryDetail(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const record = this.data.historyList.find((r) => r.id === id)
      if (!record) return

      const itemsText = record.items.map((item) => `${item.name} ×${item.qty}`).join('\n')
      const statusMap = { pending: '待入库', shipped: '运输中', received: '已入库' }
      wx.showModal({
        title: `调拨单 ${record.transferNo}`,
        content: `状态：${statusMap[record.status]}\n目标仓库：${record.targetWarehouse}\n操作人：${record.operator}\n备注：${record.note || '无'}\n\n商品明细：\n${itemsText}`,
        showCancel: false,
      })
    },
  },
})
