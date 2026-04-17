import { ensureAuthReady } from '../../services/auth-session'
import {
  createInventoryCheckTask,
  listInventoryCheckItems,
  resolveInventoryCheckItem,
  submitInventoryCheckItem,
  submitInventoryCheckItemsBatch,
} from '../../services/inventory'
import { InventoryCheckItem, InventoryCheckScope } from '../../types/inventory'

type CheckTab = 'checking' | 'difference' | 'history'

interface CheckViewItem extends InventoryCheckItem {
  statusLabel: string
}

const tabOptions: Array<{ key: CheckTab; label: string }> = [
  { key: 'checking', label: '盘点中' },
  { key: 'difference', label: '差异处理' },
  { key: 'history', label: '历史记录' },
]

const scopeOptions: Array<{ label: string; value: InventoryCheckScope }> = [
  { label: '全部商品', value: 'all' },
  { label: '仅库存不足', value: 'low' },
  { label: '仅库存超限', value: 'high' },
  { label: '按库位盘点', value: 'location' },
]

function toStatusLabel(status: InventoryCheckItem['status']): string {
  if (status === 'difference') {
    return '存在差异'
  }
  if (status === 'done') {
    return '已完成'
  }
  return '待盘点'
}

function toRemoteStatus(tab: CheckTab): InventoryCheckItem['status'] {
  if (tab === 'difference') {
    return 'difference'
  }
  if (tab === 'history') {
    return 'done'
  }
  return 'pending'
}

Component({
  data: {
    loading: false,
    creating: false,
    submittingAll: false,
    role: 'sales' as UserRole,
    keyword: '',
    currentTab: 'checking' as CheckTab,
    tabOptions,
    scopeOptions,
    scopeIndex: 0,
    taskNote: '',
    list: [] as CheckViewItem[],
  },
  lifetimes: {
    attached() {
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
    mapList(list: InventoryCheckItem[]): CheckViewItem[] {
      return list.map((item) => ({
        ...item,
        statusLabel: toStatusLabel(item.status),
      }))
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }

      this.setData({ loading: true })
      try {
        const items = await listInventoryCheckItems({
          keyword: this.data.keyword,
          status: toRemoteStatus(this.data.currentTab),
        })
        this.setData({
          list: this.mapList(items),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ keyword: e.detail.value || '' })
    },
    onSearch() {
      this.refreshData()
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as CheckTab
      if (!tab || tab === this.data.currentTab) {
        return
      }
      this.setData({ currentTab: tab })
      this.refreshData()
    },
    onScopeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ scopeIndex: Number(e.detail.value || 0) })
    },
    onNoteInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ taskNote: e.detail.value || '' })
    },
    async createTask() {
      if (this.data.creating) {
        return
      }

      this.setData({ creating: true })
      try {
        const auth = await ensureAuthReady()
        await createInventoryCheckTask({
          scope: scopeOptions[this.data.scopeIndex].value,
          note: this.data.taskNote.trim(),
          operator: auth.userName || '系统',
        })
        this.setData({ taskNote: '', currentTab: 'checking' })
        wx.showToast({ title: '盘点任务创建成功', icon: 'success' })
        this.refreshData()
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ creating: false })
      }
    },
    onActualQtyInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const id = e.currentTarget.dataset.id as string
      const value = String(e.detail.value || '').trim()
      const actualQty = value === '' ? undefined : Number(value)
      const list = this.data.list.map((item) => {
        if (item.id !== id) {
          return item
        }
        return {
          ...item,
          actualQty: actualQty == null || !Number.isFinite(actualQty) ? undefined : actualQty,
        }
      })
      this.setData({ list })
    },
    async submitCount(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const item = this.data.list.find((current) => current.id === id)
      if (!item) {
        return
      }
      if (item.actualQty == null || !Number.isFinite(item.actualQty) || item.actualQty < 0 || !Number.isInteger(item.actualQty)) {
        wx.showToast({ title: '请输入实盘数量', icon: 'none' })
        return
      }

      try {
        const updated = await submitInventoryCheckItem({
          id,
          actualQty: item.actualQty,
        })
        wx.showToast({
          title: updated.status === 'difference' ? '盘点完成，存在差异' : '盘点完成',
          icon: 'none',
        })
        this.refreshData()
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        wx.showToast({ title: message, icon: 'none' })
      }
    },
    async adjustStock(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }

      wx.showModal({
        title: '确认调整库存',
        content: '是否按盘点结果调整系统库存？',
        success: async (res) => {
          if (!res.confirm) {
            return
          }
          try {
            const auth = await ensureAuthReady()
            await resolveInventoryCheckItem({
              id,
              action: 'adjust',
              operator: auth.userName || '系统',
              note: '盘点差异入账',
            })
            wx.showToast({ title: '库存已调整', icon: 'success' })
            this.refreshData()
          } catch (error) {
            const message = error instanceof Error ? error.message : '处理失败'
            wx.showToast({ title: message, icon: 'none' })
          }
        },
      })
    },
    async markNormal(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }

      try {
        const auth = await ensureAuthReady()
        await resolveInventoryCheckItem({
          id,
          action: 'mark_normal',
          operator: auth.userName || '系统',
          note: '盘点差异驳回',
        })
        wx.showToast({ title: '已标记为正常', icon: 'success' })
        this.refreshData()
      } catch (error) {
        const message = error instanceof Error ? error.message : '处理失败'
        wx.showToast({ title: message, icon: 'none' })
      }
    },
    async submitAll() {
      if (this.data.submittingAll) {
        return
      }

      const pendingItems = this.data.list.filter((item) => item.status === 'pending')
      if (!pendingItems.length) {
        wx.showToast({ title: '没有待盘点项', icon: 'none' })
        return
      }
      if (pendingItems.some((item) => item.actualQty == null || !Number.isInteger(item.actualQty) || item.actualQty < 0)) {
        wx.showToast({ title: '请完成所有商品盘点', icon: 'none' })
        return
      }

      this.setData({ submittingAll: true })
      try {
        await submitInventoryCheckItemsBatch(
          pendingItems.map((item) => ({
            id: item.id,
            actualQty: item.actualQty as number,
          }))
        )
        wx.showToast({ title: '全部盘点已提交', icon: 'success' })
        this.refreshData()
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ submittingAll: false })
      }
    },
  },
})
