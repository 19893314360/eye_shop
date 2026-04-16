import { ensureAuthReady } from '../../services/auth-session'

type TrainingTab = 'plan' | 'checkin' | 'device' | 'reminder'

interface TrainingPlanItem {
  id: string
  customerName: string
  planName: string
  progress: number
  total: number
  status: 'ongoing' | 'done'
}

interface CheckinItem {
  id: string
  customerName: string
  checked: number
  total: number
}

interface DeviceItem {
  id: string
  deviceName: string
  borrower: string
  dueDate: string
  status: 'borrowed' | 'returned'
}

interface ReminderConfig {
  enabled: boolean
  time: string
  content: string
}

const PLAN_STORAGE_KEY = 'yanjing-training-plan'
const CHECKIN_STORAGE_KEY = 'yanjing-training-checkin'
const DEVICE_STORAGE_KEY = 'yanjing-training-device'
const REMINDER_STORAGE_KEY = 'yanjing-training-reminder'

const allTabs: Array<{ key: TrainingTab; label: string }> = [
  { key: 'plan', label: '视训方案' },
  { key: 'checkin', label: '视训核销' },
  { key: 'device', label: '设备租借' },
  { key: 'reminder', label: '视训提醒' },
]

const defaultPlanList: TrainingPlanItem[] = [
  { id: 'TP-001', customerName: '徐海', planName: '双眼协调训练', progress: 4, total: 12, status: 'ongoing' },
  { id: 'TP-002', customerName: '周宁', planName: '融合功能训练', progress: 12, total: 12, status: 'done' },
]

const defaultCheckinList: CheckinItem[] = [
  { id: 'TC-001', customerName: '徐海', checked: 4, total: 12 },
  { id: 'TC-002', customerName: '林安', checked: 2, total: 8 },
]

const defaultDeviceList: DeviceItem[] = [
  { id: 'TD-001', deviceName: '翻转拍', borrower: '徐海', dueDate: '2026-04-20', status: 'borrowed' },
  { id: 'TD-002', deviceName: '红绿卡', borrower: '周宁', dueDate: '2026-04-18', status: 'returned' },
]

const defaultReminder: ReminderConfig = {
  enabled: true,
  time: '20:00',
  content: '请按计划完成今日视训，完成后记得打卡。',
}

function parseList<T>(raw: unknown, fallback: T[]): T[] {
  if (!Array.isArray(raw)) {
    return [...fallback]
  }
  return raw as T[]
}

function parseReminder(raw: unknown): ReminderConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultReminder }
  }
  const source = raw as Record<string, unknown>
  return {
    enabled: source.enabled !== false,
    time: typeof source.time === 'string' ? source.time : defaultReminder.time,
    content: typeof source.content === 'string' ? source.content : defaultReminder.content,
  }
}

Component({
  data: {
    loading: false,
    savingReminder: false,
    role: 'sales' as UserRole,
    tabs: allTabs,
    currentTab: 'plan' as TrainingTab,
    planList: [] as TrainingPlanItem[],
    checkinList: [] as CheckinItem[],
    deviceList: [] as DeviceItem[],
    reminder: { ...defaultReminder },
    // 新建方案
    showCreateForm: false,
    newPlan: {
      customerName: '',
      planName: '',
      total: 12,
    } as { customerName: string; planName: string; total: number },
    creating: false,
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
      if (tab === 'plan' || tab === 'checkin' || tab === 'device' || tab === 'reminder') {
        this.setData({
          currentTab: tab,
        })
      }
    },
    readAllData() {
      return {
        planList: parseList<TrainingPlanItem>(wx.getStorageSync(PLAN_STORAGE_KEY), defaultPlanList),
        checkinList: parseList<CheckinItem>(wx.getStorageSync(CHECKIN_STORAGE_KEY), defaultCheckinList),
        deviceList: parseList<DeviceItem>(wx.getStorageSync(DEVICE_STORAGE_KEY), defaultDeviceList),
        reminder: parseReminder(wx.getStorageSync(REMINDER_STORAGE_KEY)),
      }
    },
    savePlanList(planList: TrainingPlanItem[]) {
      wx.setStorageSync(PLAN_STORAGE_KEY, planList)
    },
    saveCheckinList(checkinList: CheckinItem[]) {
      wx.setStorageSync(CHECKIN_STORAGE_KEY, checkinList)
    },
    saveDeviceList(deviceList: DeviceItem[]) {
      wx.setStorageSync(DEVICE_STORAGE_KEY, deviceList)
    },
    saveReminder(reminder: ReminderConfig) {
      wx.setStorageSync(REMINDER_STORAGE_KEY, reminder)
    },
    async refreshData() {
      this.setData({ loading: true })
      try {
        const auth = await ensureAuthReady()
        const allData = this.readAllData()
        const tabs = auth.role === 'customer' ? allTabs.filter((item) => item.key !== 'device') : allTabs
        const nextTab =
          auth.role === 'customer' && this.data.currentTab === 'device' ? 'reminder' : this.data.currentTab
        this.setData({
          role: auth.role,
          tabs,
          currentTab: nextTab,
          planList: allData.planList,
          checkinList: allData.checkinList,
          deviceList: allData.deviceList,
          reminder: allData.reminder,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载视训数据失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as TrainingTab
      if (!tab || tab === this.data.currentTab) {
        return
      }
      this.setData({
        currentTab: tab,
      })
    },
    markPlanDone(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }
      const next = this.data.planList.map((item) => {
        if (item.id !== id) {
          return item
        }
        return {
          ...item,
          progress: item.total,
          status: 'done' as const,
        }
      })
      this.savePlanList(next)
      this.setData({ planList: next })
      wx.showToast({ title: '方案已完成', icon: 'success' })
    },
    doCheckin(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }
      const checkinList = this.data.checkinList.map((item) => {
        if (item.id !== id) {
          return item
        }
        return {
          ...item,
          checked: Math.min(item.total, item.checked + 1),
        }
      })
      const planList = this.data.planList.map((item) => {
        const matched = checkinList.find((checkin) => checkin.customerName === item.customerName)
        if (!matched) {
          return item
        }
        return {
          ...item,
          progress: matched.checked,
          total: matched.total,
          status: matched.checked >= matched.total ? ('done' as const) : ('ongoing' as const),
        }
      })
      this.saveCheckinList(checkinList)
      this.savePlanList(planList)
      this.setData({
        checkinList,
        planList,
      })
      wx.showToast({ title: '核销成功', icon: 'success' })
    },
    markDeviceReturned(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }
      const next = this.data.deviceList.map((item) => {
        if (item.id !== id) {
          return item
        }
        return {
          ...item,
          status: 'returned' as const,
        }
      })
      this.saveDeviceList(next)
      this.setData({ deviceList: next })
      wx.showToast({ title: '设备已归还', icon: 'success' })
    },
    toggleReminder() {
      const reminder = {
        ...this.data.reminder,
        enabled: !this.data.reminder.enabled,
      }
      this.saveReminder(reminder)
      this.setData({ reminder })
    },
    onReminderTimeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        'reminder.time': e.detail.value,
      })
    },
    onReminderInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        'reminder.content': e.detail.value || '',
      })
    },
    saveReminderConfig() {
      this.setData({ savingReminder: true })
      const reminder = {
        ...this.data.reminder,
      }
      this.saveReminder(reminder)
      this.setData({ savingReminder: false })
      wx.showToast({ title: '提醒设置已保存', icon: 'success' })
    },
    // ===================== 新建方案 =====================
    openCreateForm() {
      this.setData({
        showCreateForm: true,
        newPlan: { customerName: '', planName: '', total: 12 },
      })
    },
    closeCreateForm() {
      this.setData({ showCreateForm: false })
    },
    onNewPlanCustomerInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ 'newPlan.customerName': e.detail.value || '' })
    },
    onNewPlanNameInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ 'newPlan.planName': e.detail.value || '' })
    },
    onNewPlanTotalChange(e: WechatMiniprogram.CustomEvent<{ value: number }>) {
      this.setData({ 'newPlan.total': e.detail.value || 12 })
    },
    submitNewPlan() {
      const { customerName, planName, total } = this.data.newPlan
      if (!customerName.trim()) {
        wx.showToast({ title: '请输入客户姓名', icon: 'none' })
        return
      }
      if (!planName.trim()) {
        wx.showToast({ title: '请输入方案名称', icon: 'none' })
        return
      }
      if (total < 1) {
        wx.showToast({ title: '训练次数至少为1', icon: 'none' })
        return
      }
      this.setData({ creating: true })
      const newId = 'TP-' + String(Date.now()).slice(-6)
      const newItem: TrainingPlanItem = {
        id: newId,
        customerName: customerName.trim(),
        planName: planName.trim(),
        progress: 0,
        total,
        status: 'ongoing',
      }
      const planList = [newItem, ...this.data.planList]
      this.savePlanList(planList)
      // 同步创建核销记录
      const newCheckin: CheckinItem = {
        id: 'TC-' + String(Date.now()).slice(-6),
        customerName: customerName.trim(),
        checked: 0,
        total,
      }
      const checkinList = [newCheckin, ...this.data.checkinList]
      this.saveCheckinList(checkinList)
      this.setData({
        planList,
        checkinList,
        showCreateForm: false,
        creating: false,
        newPlan: { customerName: '', planName: '', total: 12 },
      })
      wx.showToast({ title: '方案创建成功', icon: 'success' })
    },
  },
})
