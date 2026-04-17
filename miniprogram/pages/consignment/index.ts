import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type ConsignmentTab = 'list' | 'store'

interface ConsignmentItem {
  id: string
  customerName: string
  itemName: string
  status: 'stored' | 'picked'
  storedAt: number
  pickedAt: number
  note: string
}

const STORAGE_KEY = 'yanjing-consignments'

const defaultItems: ConsignmentItem[] = [
  { id: 'CS-001', customerName: '徐海', itemName: '太阳镜（雷朋）', status: 'stored', storedAt: Date.now() - 3 * 86400000, pickedAt: 0, note: '客户暂存' },
  { id: 'CS-002', customerName: '周宁', itemName: '旧镜架一副', status: 'picked', storedAt: Date.now() - 7 * 86400000, pickedAt: Date.now() - 86400000, note: '' },
]

const tabOptions: Array<{ key: ConsignmentTab; label: string }> = [
  { key: 'list', label: '寄存列表' },
  { key: 'store', label: '新增寄存' },
]

Component({
  data: {
    role: 'sales' as UserRole,
    currentTab: 'list' as ConsignmentTab,
    tabOptions,
    list: [] as ConsignmentItem[],
    form: {
      customerName: '',
      itemName: '',
      note: '',
    },
    submitting: false,
  },
  lifetimes: { attached() { this.initPage() } },
  pageLifetimes: { show() { this.loadData() } },
  methods: {
    async initPage() {
      try {
        const state = await ensureAuthReady()
        if (state.role === 'customer') {
          wx.showToast({ title: '无此权限', icon: 'none' })
          wx.navigateBack({ delta: 1 })
          return
        }
        this.setData({ role: state.role })
      } catch { /* ignore */ }
      this.loadData()
    },
    loadData() {
      let list = wx.getStorageSync(STORAGE_KEY)
      if (!Array.isArray(list) || list.length === 0) {
        list = defaultItems
        wx.setStorageSync(STORAGE_KEY, list)
      }
      const formatted = (list as ConsignmentItem[]).map((item) => ({
        ...item,
        storedText: formatTime(new Date(item.storedAt)),
        pickedText: item.pickedAt ? formatTime(new Date(item.pickedAt)) : '',
      }))
      this.setData({ list: formatted })
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as ConsignmentTab
      if (!tab || tab === this.data.currentTab) return
      this.setData({ currentTab: tab })
    },
    onFormInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as string
      this.setData({ [`form.${field}`]: e.detail.value || '' })
    },
    async submitStore() {
      const { customerName, itemName } = this.data.form
      if (!customerName.trim()) {
        wx.showToast({ title: '请输入客户姓名', icon: 'none' })
        return
      }
      if (!itemName.trim()) {
        wx.showToast({ title: '请输入物品名称', icon: 'none' })
        return
      }
      this.setData({ submitting: true })
      try {
        const newItem: ConsignmentItem = {
          id: 'CS-' + String(Date.now()).slice(-6),
          customerName: customerName.trim(),
          itemName: itemName.trim(),
          status: 'stored',
          storedAt: Date.now(),
          pickedAt: 0,
          note: this.data.form.note.trim(),
        }
        const list = [newItem, ...this.data.list]
        wx.setStorageSync(STORAGE_KEY, list)
        this.setData({ list, currentTab: 'list', form: { customerName: '', itemName: '', note: '' } })
        wx.showToast({ title: '寄存成功', icon: 'success' })
      } catch {
        wx.showToast({ title: '操作失败', icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
    pickUp(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      wx.showModal({
        title: '确认取回',
        content: '确定将此物品标记为已取回？',
        success: (res) => {
          if (!res.confirm) return
          const list = this.data.list.map((item) => {
            if (item.id !== id) return item
            return { ...item, status: 'picked' as const, pickedAt: Date.now(), pickedText: formatTime(new Date()) }
          })
          wx.setStorageSync(STORAGE_KEY, list)
          this.setData({ list })
          wx.showToast({ title: '已标记取回', icon: 'success' })
        },
      })
    },
  },
})
