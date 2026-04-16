import { ensureAuthReady } from '../../services/auth-session'

type CheckTab = 'checking' | 'difference' | 'history'
type CheckStatus = 'pending' | 'done' | 'difference'
type CheckScope = 'all' | 'low' | 'high' | 'location'

interface CheckItem {
  id: string
  sku: string
  name: string
  location: string
  systemQty: number
  actualQty?: number
  difference?: number
  status: CheckStatus
  note?: string
  createdAt: number
  updatedAt?: number
}

interface CheckTask {
  id: string
  scope: CheckScope
  note: string
  status: 'ongoing' | 'done'
  createdAt: number
  completedAt?: number
}

const CHECK_ITEMS_KEY = 'yanjing-check-items'
const CHECK_TASKS_KEY = 'yanjing-check-tasks'

const tabOptions: Array<{ key: CheckTab; label: string }> = [
  { key: 'checking', label: '盘点中' },
  { key: 'difference', label: '差异处理' },
  { key: 'history', label: '历史记录' },
]

const scopeOptions: Array<{ label: string; value: CheckScope }> = [
  { label: '全部商品', value: 'all' },
  { label: '仅库存不足', value: 'low' },
  { label: '仅库存超限', value: 'high' },
  { label: '按库位盘点', value: 'location' },
]

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
    list: [] as CheckItem[],
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
    readCheckItems(): CheckItem[] {
      const raw = wx.getStorageSync(CHECK_ITEMS_KEY)
      return Array.isArray(raw) ? raw : []
    },
    saveCheckItems(items: CheckItem[]) {
      wx.setStorageSync(CHECK_ITEMS_KEY, items)
    },
    readCheckTasks(): CheckTask[] {
      const raw = wx.getStorageSync(CHECK_TASKS_KEY)
      return Array.isArray(raw) ? raw : []
    },
    saveCheckTasks(tasks: CheckTask[]) {
      wx.setStorageSync(CHECK_TASKS_KEY, tasks)
    },
    generateCheckItems(scope: CheckScope): CheckItem[] {
      const stockList: Array<{ id: string; sku: string; name: string; location: string; qty: number }> = [
        { id: 'INV-001', sku: 'LENS-001', name: '超薄镜片 1.67', location: 'A-01', qty: 18 },
        { id: 'INV-002', sku: 'FRAME-010', name: '金属镜架 M10', location: 'B-03', qty: 96 },
        { id: 'INV-003', sku: 'LENS-022', name: '防蓝光镜片 1.60', location: 'A-06', qty: 45 },
        { id: 'INV-004', sku: 'LENS-005', name: '渐进镜片 1.60', location: 'A-02', qty: 12 },
        { id: 'INV-005', sku: 'FRAME-001', name: '钛架镜框 T1', location: 'B-01', qty: 8 },
      ]

      return stockList
        .filter((item) => {
          if (scope === 'low') return item.qty < 20
          if (scope === 'high') return item.qty > 80
          return true
        })
        .map((item) => ({
          id: `CHK-${Date.now()}-${item.id}`,
          sku: item.sku,
          name: item.name,
          location: item.location,
          systemQty: item.qty,
          status: 'pending' as CheckStatus,
          createdAt: Date.now(),
        }))
    },
    filterItems(items: CheckItem[], tab: CheckTab, keyword: string): CheckItem[] {
      let filtered = items
      if (tab === 'checking') {
        filtered = items.filter((i) => i.status === 'pending' || (i.status === 'done' && !i.difference))
      } else if (tab === 'difference') {
        filtered = items.filter((i) => i.status === 'difference' || (i.difference !== undefined && i.difference !== 0))
      } else {
        filtered = items.filter((i) => i.status === 'done')
      }

      if (keyword.trim()) {
        filtered = filtered.filter((i) => i.name.includes(keyword) || i.sku.includes(keyword))
      }

      return filtered.sort((a, b) => b.createdAt - a.createdAt)
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) return

      this.setData({ loading: true })
      try {
        const items = this.readCheckItems()
        this.setData({
          list: this.filterItems(items, this.data.currentTab, this.data.keyword),
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
      if (!tab || tab === this.data.currentTab) return
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
      if (this.data.creating) return

      const scope = scopeOptions[this.data.scopeIndex].value
      this.setData({ creating: true })

      try {
        const newItems = this.generateCheckItems(scope)
        if (newItems.length === 0) {
          wx.showToast({ title: '该范围无商品需要盘点', icon: 'none' })
          return
        }

        const tasks = this.readCheckTasks()
        const newTask: CheckTask = {
          id: `TASK-${Date.now()}`,
          scope,
          note: this.data.taskNote,
          status: 'ongoing',
          createdAt: Date.now(),
        }
        tasks.unshift(newTask)
        this.saveCheckTasks(tasks)

        const existingItems = this.readCheckItems()
        this.saveCheckItems([...newItems, ...existingItems])

        this.setData({ taskNote: '' })
        wx.showToast({ title: '盘点任务创建成功', icon: 'success' })
        this.refreshData()
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ creating: false })
      }
    },
    completeTask(taskId: string) {
      const tasks = this.readCheckTasks()
      const updated = tasks.map((task) => {
        if (task.id === taskId && task.status === 'ongoing') {
          return { ...task, status: 'done' as const, completedAt: Date.now() }
        }
        return task
      })
      this.saveCheckTasks(updated)
    },
    onActualQtyInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const id = e.currentTarget.dataset.id as string
      const value = e.detail.value
      const qty = value ? parseInt(value, 10) : undefined

      const list = this.readCheckItems()
      const updated = list.map((item) => {
        if (item.id !== id) return item
        return { ...item, actualQty: qty }
      })
      this.saveCheckItems(updated)

      const viewList = this.data.list.map((item: CheckItem) => {
        if (item.id !== id) return item
        return { ...item, actualQty: qty }
      })
      this.setData({ list: viewList })
    },
    submitCount(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) return

      const list = this.readCheckItems()
      const item = list.find((i) => i.id === id)
      if (!item || item.actualQty === undefined) {
        wx.showToast({ title: '请输入实盘数量', icon: 'none' })
        return
      }

      const difference = item.actualQty - item.systemQty
      const updated = list.map((i) => {
        if (i.id !== id) return i
        return {
          ...i,
          difference,
          status: difference !== 0 ? ('difference' as CheckStatus) : ('done' as CheckStatus),
          updatedAt: Date.now(),
        }
      })
      this.saveCheckItems(updated)

      wx.showToast({
        title: difference !== 0 ? '盘点完成，存在差异' : '盘点完成',
        icon: 'none',
      })
      this.refreshData()
    },
    adjustStock(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) return

      wx.showModal({
        title: '确认调整库存',
        content: '是否按盘点结果调整系统库存？',
        success: (res) => {
          if (res.confirm) {
            const list = this.readCheckItems()
            const updated = list.map((item) => {
              if (item.id !== id) return item
              return { ...item, status: 'done' as CheckStatus, updatedAt: Date.now() }
            })
            this.saveCheckItems(updated)
            wx.showToast({ title: '库存已调整', icon: 'success' })
            this.refreshData()
          }
        },
      })
    },
    markNormal(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) return

      const list = this.readCheckItems()
      const updated = list.map((item) => {
        if (item.id !== id) return item
        return { ...item, status: 'done' as CheckStatus, updatedAt: Date.now() }
      })
      this.saveCheckItems(updated)
      wx.showToast({ title: '已标记为正常', icon: 'success' })
      this.refreshData()
    },
    submitAll() {
      if (this.data.submittingAll) return

      const pendingItems = this.data.list.filter((i: CheckItem) => i.status === 'pending')
      if (pendingItems.length === 0) {
        wx.showToast({ title: '没有待盘点项', icon: 'none' })
        return
      }

      const hasEmptyQty = pendingItems.some((i: CheckItem) => i.actualQty === undefined)
      if (hasEmptyQty) {
        wx.showToast({ title: '请完成所有商品盘点', icon: 'none' })
        return
      }

      this.setData({ submittingAll: true })

      const list = this.readCheckItems()
      const updated = list.map((item) => {
        const pending = pendingItems.find((p: CheckItem) => p.id === item.id)
        if (!pending) return item
        const difference = (item.actualQty || 0) - item.systemQty
        return {
          ...item,
          difference,
          status: difference !== 0 ? ('difference' as CheckStatus) : ('done' as CheckStatus),
          updatedAt: Date.now(),
        }
      })
      this.saveCheckItems(updated)

      // 检查是否还有未完成的盘点项，如果没有则标记任务为完成
      const remainingPending = updated.filter((i) => i.status === 'pending')
      if (remainingPending.length === 0) {
        const tasks = this.readCheckTasks()
        const ongoingTask = tasks.find((t) => t.status === 'ongoing')
        if (ongoingTask) {
          this.completeTask(ongoingTask.id)
        }
      }

      wx.showToast({ title: '全部盘点已提交', icon: 'success' })
      this.setData({ submittingAll: false })
      this.refreshData()
    },
  },
})
