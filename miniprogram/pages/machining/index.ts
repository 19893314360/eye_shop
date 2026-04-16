import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type MachiningTab = 'pending' | 'processing' | 'completed'
type MachiningStatus = 'pending' | 'processing' | 'completed'

interface MachiningItem {
  id: string
  orderNo: string
  memberName: string
  itemName: string
  status: MachiningStatus
  progress: number
  operator: string
  startedAt: number
  completedAt: number
  note: string
  statusLabel?: string
  startedText?: string
  completedText?: string
}

const STORAGE_KEY = 'yanjing-machining'

const tabOptions: Array<{ key: MachiningTab; label: string }> = [
  { key: 'pending', label: '待加工' },
  { key: 'processing', label: '加工中' },
  { key: 'completed', label: '已完工' },
]

const defaultMachiningList: MachiningItem[] = [
  {
    id: 'MC-001',
    orderNo: 'ORD-20260415-001',
    memberName: '张先生',
    itemName: '超薄镜片+钛架',
    status: 'pending',
    progress: 0,
    operator: '',
    startedAt: 0,
    completedAt: 0,
    note: '左眼散光需特殊加工',
  },
  {
    id: 'MC-002',
    orderNo: 'ORD-20260410-002',
    memberName: '李女士',
    itemName: '防蓝光镜片+金属架',
    status: 'processing',
    progress: 60,
    operator: '徐明',
    startedAt: Date.now() - 2 * 60 * 60 * 1000,
    completedAt: 0,
    note: '',
  },
  {
    id: 'MC-003',
    orderNo: 'ORD-20260405-003',
    memberName: '王先生',
    itemName: '渐进镜片套装',
    status: 'completed',
    progress: 100,
    operator: '周宁',
    startedAt: Date.now() - 48 * 60 * 60 * 1000,
    completedAt: Date.now() - 24 * 60 * 60 * 1000,
    note: '',
  },
]

function statusLabel(status: MachiningStatus): string {
  if (status === 'processing') return '加工中'
  if (status === 'completed') return '已完工'
  return '待加工'
}

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    tabOptions,
    currentTab: 'pending' as MachiningTab,
    list: [] as MachiningItem[],
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
    readList(): MachiningItem[] {
      const raw = wx.getStorageSync(STORAGE_KEY)
      if (!Array.isArray(raw) || raw.length === 0) {
        wx.setStorageSync(STORAGE_KEY, defaultMachiningList)
        return [...defaultMachiningList]
      }
      return raw as MachiningItem[]
    },
    saveList(list: MachiningItem[]) {
      wx.setStorageSync(STORAGE_KEY, list)
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) return

      this.setData({ loading: true })
      try {
        const allList = this.readList()
        const { currentTab } = this.data

        const filtered = allList
          .filter((item) => item.status === currentTab)
          .sort((a, b) => {
            if (currentTab === 'pending') return a.startedAt - b.startedAt
            return b.startedAt - a.startedAt
          })
          .map((item) => ({
            ...item,
            statusLabel: statusLabel(item.status),
            startedText: item.startedAt ? formatTime(new Date(item.startedAt)) : '--',
            completedText: item.completedAt ? formatTime(new Date(item.completedAt)) : '--',
          }))

        this.setData({ list: filtered })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as MachiningTab
      if (!tab || tab === this.data.currentTab) return
      this.setData({ currentTab: tab })
      this.refreshData()
    },
    startMachining(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) return

      wx.showModal({
        title: '确认开始加工',
        content: '确认开始加工该订单？',
        success: async (res) => {
          if (!res.confirm) return
          const auth = await ensureAuthReady()
          const list = this.readList()
          const updated = list.map((item) => {
            if (item.id !== id) return item
            return {
              ...item,
              status: 'processing' as MachiningStatus,
              progress: 10,
              operator: auth.userName || '系统',
              startedAt: Date.now(),
            }
          })
          this.saveList(updated)
          wx.showToast({ title: '已开始加工', icon: 'success' })
          this.refreshData()
        },
      })
    },
    updateProgress(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) return

      const item = this.data.list.find((i) => i.id === id)
      if (!item) return

      const current = item.progress || 10
      const steps = [30, 50, 70, 90]
      const next = steps.find((s) => s > current) || 90

      const list = this.readList()
      const updated = list.map((m) => {
        if (m.id !== id) return m
        return { ...m, progress: next }
      })
      this.saveList(updated)
      wx.showToast({ title: '进度已更新至 ' + next + '%', icon: 'success' })
      this.refreshData()
    },
    completeMachining(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) return

      wx.showModal({
        title: '确认完工入库',
        content: '确认该订单加工完成，商品已入库？',
        success: (res) => {
          if (!res.confirm) return
          const list = this.readList()
          const updated = list.map((item) => {
            if (item.id !== id) return item
            return {
              ...item,
              status: 'completed' as MachiningStatus,
              progress: 100,
              completedAt: Date.now(),
            }
          })
          this.saveList(updated)
          wx.showToast({ title: '已完工入库', icon: 'success' })
          this.refreshData()
        },
      })
    },
    viewDetail(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const item = this.data.list.find((i) => i.id === id)
      if (!item) return

      const statusText = statusLabel(item.status)
      const progressText = item.status === 'completed' ? '100%' : (item.progress || 0) + '%'
      const detail = [
        '订单号：' + item.orderNo,
        '会员：' + item.memberName,
        '商品：' + item.itemName,
        '状态：' + statusText,
        '进度：' + progressText,
        '操作人：' + (item.operator || '--'),
        '开始时间：' + item.startedText,
        '完成时间：' + item.completedText,
        '备注：' + (item.note || '无'),
      ].join('\n')

      wx.showModal({
        title: '加工详情',
        content: detail,
        showCancel: false,
      })
    },
  },
})
