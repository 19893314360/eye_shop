import { ensureAuthReady } from '../../services/auth-session'
import { formatTime } from '../../utils/util'

type AppointmentService = 'optometry' | 'recheck' | 'training'
type AppointmentStatus = 'pending' | 'done'

interface AppointmentItem {
  id: string
  customerName: string
  mobile: string
  serviceType: AppointmentService
  date: string
  time: string
  note: string
  status: AppointmentStatus
  createdAt: number
}

interface AppointmentForm {
  customerName: string
  mobile: string
  serviceType: AppointmentService
  date: string
  time: string
  note: string
}

const APPOINTMENT_STORAGE_KEY = 'yanjing-appointments'

const serviceOptions: Array<{ label: string; value: AppointmentService }> = [
  { label: '验光预约', value: 'optometry' },
  { label: '复查预约', value: 'recheck' },
  { label: '视训预约', value: 'training' },
]

function todayString(offsetDays = 0): string {
  const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000)
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function defaultForm(): AppointmentForm {
  return {
    customerName: '',
    mobile: '',
    serviceType: 'optometry',
    date: todayString(1),
    time: '10:30',
    note: '',
  }
}

function toServiceLabel(serviceType: AppointmentService): string {
  if (serviceType === 'recheck') {
    return '复查预约'
  }
  if (serviceType === 'training') {
    return '视训预约'
  }
  return '验光预约'
}

function toStatusLabel(status: AppointmentStatus): string {
  return status === 'done' ? '已到店' : '待到店'
}

function parseAppointmentList(raw: unknown): AppointmentItem[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => {
      const service = item.serviceType
      const status = item.status
      const safeService: AppointmentService =
        service === 'recheck' || service === 'training' || service === 'optometry' ? service : 'optometry'
      const safeStatus: AppointmentStatus = status === 'done' ? 'done' : 'pending'
      return {
        id: typeof item.id === 'string' ? item.id : `APT-${Date.now()}`,
        customerName: typeof item.customerName === 'string' ? item.customerName : '',
        mobile: typeof item.mobile === 'string' ? item.mobile : '',
        serviceType: safeService,
        date: typeof item.date === 'string' ? item.date : todayString(1),
        time: typeof item.time === 'string' ? item.time : '10:30',
        note: typeof item.note === 'string' ? item.note : '',
        status: safeStatus,
        createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
      }
    })
}

Component({
  data: {
    loading: false,
    saving: false,
    role: 'sales' as UserRole,
    form: defaultForm(),
    serviceOptions,
    serviceIndex: 0,
    list: [] as AppointmentItem[],
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
      return (current && current.options) || {}
    },
    applyRouteParams() {
      const options = this.getRouteOptions()
      if (options.customerName) {
        this.setData({
          'form.customerName': decodeURIComponent(options.customerName),
        })
      }
      if (options.mobile) {
        this.setData({
          'form.mobile': decodeURIComponent(options.mobile),
        })
      }
    },
    readList(): AppointmentItem[] {
      return parseAppointmentList(wx.getStorageSync(APPOINTMENT_STORAGE_KEY))
    },
    saveList(list: AppointmentItem[]) {
      wx.setStorageSync(APPOINTMENT_STORAGE_KEY, list)
    },
    sortList(list: AppointmentItem[]): AppointmentItem[] {
      return [...list].sort((a, b) => b.createdAt - a.createdAt)
    },
    async refreshList() {
      this.setData({ loading: true })
      try {
        const auth = await ensureAuthReady()
        const list = this.sortList(this.readList())
        this.setData({
          role: auth.role,
          list,
        })
        if (auth.role === 'customer') {
          this.setData({
            'form.customerName': auth.userName || this.data.form.customerName,
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载预约数据失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as keyof AppointmentForm
      const value = e.detail.value || ''
      this.setData({
        [`form.${field}`]: value,
      })
    },
    onServiceChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const idx = Number(e.detail.value || 0)
      const option = serviceOptions[idx] || serviceOptions[0]
      this.setData({
        serviceIndex: idx,
        'form.serviceType': option.value,
      })
    },
    onDateChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        'form.date': e.detail.value,
      })
    },
    onTimeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        'form.time': e.detail.value,
      })
    },
    async submit() {
      if (this.data.saving) {
        return
      }
      const payload = this.data.form
      if (!payload.customerName.trim()) {
        wx.showToast({ title: '请输入预约人姓名', icon: 'none' })
        return
      }
      if (!/^1\d{10}$/.test(payload.mobile.trim())) {
        wx.showToast({ title: '请输入正确手机号', icon: 'none' })
        return
      }

      this.setData({ saving: true })
      try {
        const list = this.readList()
        const next: AppointmentItem = {
          id: `APT-${Date.now()}`,
          customerName: payload.customerName.trim(),
          mobile: payload.mobile.trim(),
          serviceType: payload.serviceType,
          date: payload.date,
          time: payload.time,
          note: payload.note.trim(),
          status: 'pending',
          createdAt: Date.now(),
        }
        list.unshift(next)
        this.saveList(list)
        this.setData({
          form: {
            ...defaultForm(),
            customerName: this.data.role === 'customer' ? payload.customerName.trim() : '',
          },
          serviceIndex: 0,
          list: this.sortList(list),
        })
        wx.showToast({
          title: '预约提交成功',
          icon: 'success',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '预约提交失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    },
    markArrived(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      if (!id) {
        return
      }
      const list = this.readList().map((item) => {
        if (item.id !== id) {
          return item
        }
        return {
          ...item,
          status: 'done' as AppointmentStatus,
        }
      })
      this.saveList(list)
      this.setData({
        list: this.sortList(list),
      })
      wx.showToast({
        title: '已标记到店',
        icon: 'success',
      })
    },
    serviceLabel(item: AppointmentItem): string {
      return toServiceLabel(item.serviceType)
    },
    statusLabel(item: AppointmentItem): string {
      return toStatusLabel(item.status)
    },
    createdText(item: AppointmentItem): string {
      return formatTime(new Date(item.createdAt))
    },
  },
})
