import { ensureAuthReady } from '../../services/auth-session'
import { adjustInventoryItem, listInventoryItems, listInventoryMovements } from '../../services/inventory'
import { InventoryItem, InventoryMovement } from '../../types/inventory'
import { formatTime } from '../../utils/util'

type StockTab = 'all' | 'low' | 'high'

interface StockViewItem extends InventoryItem {
  statusLabel: string
}

interface TraceViewItem extends InventoryMovement {
  action: string
  timeText: string
  qtyText: string
}

const tabOptions: Array<{ key: StockTab; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'low', label: '库存不足' },
  { key: 'high', label: '库存超限' },
]

function toStatusLabel(status: InventoryItem['status']): string {
  if (status === 'low') {
    return '库存不足'
  }
  if (status === 'high') {
    return '库存超限'
  }
  return '正常'
}

function toMovementLabel(actionType: string): string {
  if (actionType === 'purchase_order') {
    return '采购订单'
  }
  if (actionType === 'purchase_inbound') {
    return '采购入库'
  }
  if (actionType === 'purchase_return') {
    return '采购退货'
  }
  if (actionType === 'purchase_frame_inbound') {
    return '镜架入库'
  }
  if (actionType === 'sales_return') {
    return '退货回库'
  }
  if (actionType === 'sales_exchange_in') {
    return '换货回库'
  }
  if (actionType === 'sales_exchange_out') {
    return '换货出库'
  }
  if (actionType === 'stock_check_adjust') {
    return '盘点调整入账'
  }
  return '盘点调整'
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
    traceList: [] as TraceViewItem[],
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
      return (current && current.options) || {}
    },
    applyRouteParams() {
      const options = this.getRouteOptions()
      const tab = options.tab
      if (tab === 'all' || tab === 'low' || tab === 'high') {
        this.setData({ currentTab: tab })
      }
      this.setData({
        showTrace: options.trace === '1',
      })
    },
    async ensureAccess(): Promise<boolean> {
      try {
        const state = await ensureAuthReady()
        if (state.role === 'customer') {
          wx.showToast({
            title: '客户端无库存权限',
            icon: 'none',
          })
          wx.navigateBack({ delta: 1 })
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
    mapItems(list: InventoryItem[]): StockViewItem[] {
      return list.map((item) => ({
        ...item,
        statusLabel: toStatusLabel(item.status),
      }))
    },
    mapMovements(list: InventoryMovement[]): TraceViewItem[] {
      return list.map((item) => ({
        ...item,
        action: toMovementLabel(item.actionType),
        timeText: formatTime(new Date(item.createdAt)),
        qtyText: `${item.qtyChange >= 0 ? '+' : ''}${item.qtyChange}`,
      }))
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }

      this.setData({ loading: true })
      try {
        const [items, movements] = await Promise.all([
          listInventoryItems({
            keyword: this.data.keyword,
            status: this.data.currentTab,
          }),
          listInventoryMovements(this.data.keyword),
        ])
        this.setData({
          list: this.mapItems(items),
          traceList: this.mapMovements(movements),
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
      this.setData({ currentTab: tab })
      this.refreshData()
    },
    toggleTrace() {
      this.setData({
        showTrace: !this.data.showTrace,
      })
    },
    adjustStock(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const item = this.data.list.find((current) => current.id === id)
      if (!item) {
        return
      }

      wx.showModal({
        title: '盘点调整',
        content: `商品：${item.name}\n当前库存：${item.qty}\n请输入新库存数量：`,
        editable: true,
        placeholderText: String(item.qty),
        success: async (res) => {
          if (!res.confirm) {
            return
          }
          const raw = String(res.content || '').trim()
          const newQty = Number(raw)
          if (!raw || !Number.isFinite(newQty) || newQty < 0 || !Number.isInteger(newQty)) {
            wx.showToast({ title: '请输入有效数量', icon: 'none' })
            return
          }

          try {
            const auth = await ensureAuthReady()
            await adjustInventoryItem({
              itemId: item.id,
              newQty,
              operator: auth.userName || '系统',
              note: '页面盘点调整',
            })
            wx.showToast({ title: '库存已调整', icon: 'success' })
            this.refreshData()
          } catch (error) {
            const message = error instanceof Error ? error.message : '调整库存失败'
            wx.showToast({ title: message, icon: 'none' })
          }
        },
      })
    },
  },
})
