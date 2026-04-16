import { formatTime } from '../../utils/util'

type MessageType = 'order' | 'system' | 'promo' | 'service'

interface Message {
  id: string
  type: MessageType
  typeIcon: string
  title: string
  content: string
  time: number
  timeText: string
  read: boolean
}

const STORAGE_KEY = 'yanjing-messages'

function getDefaultMessages(): Message[] {
  const now = Date.now()
  return [
    {
      id: 'M001',
      type: 'order',
      typeIcon: '📦',
      title: '取件提醒',
      content: '您的配镜订单已完成，请于 3 个工作日内到店取件。',
      time: now - 2 * 60 * 60 * 1000,
      timeText: '',
      read: false,
    },
    {
      id: 'M002',
      type: 'service',
      typeIcon: '👓',
      title: '复查提醒',
      content: '您的配镜已满 3 个月，建议到店进行视力复查。',
      time: now - 24 * 60 * 60 * 1000,
      timeText: '',
      read: false,
    },
    {
      id: 'M003',
      type: 'promo',
      typeIcon: '🎁',
      title: '会员日活动',
      content: '每月 18 日会员日，积分双倍赠送，还有专属优惠券等你来领！',
      time: now - 3 * 24 * 60 * 60 * 1000,
      timeText: '',
      read: true,
    },
    {
      id: 'M004',
      type: 'system',
      typeIcon: '📢',
      title: '系统升级通知',
      content: '系统将于本周日凌晨 2:00-4:00 进行升级维护，届时部分功能可能暂时不可用。',
      time: now - 5 * 24 * 60 * 60 * 1000,
      timeText: '',
      read: true,
    },
    {
      id: 'M005',
      type: 'order',
      typeIcon: '📦',
      title: '订单状态更新',
      content: '您的订单 ORD-20260410-002 已进入加工环节，预计 3-5 个工作日完成。',
      time: now - 7 * 24 * 60 * 60 * 1000,
      timeText: '',
      read: true,
    },
  ]
}

Component({
  data: {
    messages: [] as Message[],
    unreadCount: 0,
    totalCount: 0,
  },
  lifetimes: {
    attached() {
      this.loadMessages()
    },
  },
  pageLifetimes: {
    show() {
      this.loadMessages()
    },
  },
  methods: {
    loadMessages() {
      let messages: Message[] = wx.getStorageSync(STORAGE_KEY)
      if (!Array.isArray(messages) || messages.length === 0) {
        messages = getDefaultMessages()
        wx.setStorageSync(STORAGE_KEY, messages)
      }

      const formatted = messages.map((m) => ({
        ...m,
        timeText: formatTime(new Date(m.time)),
      }))

      const unreadCount = formatted.filter((m) => !m.read).length

      this.setData({
        messages: formatted.sort((a, b) => b.time - a.time),
        unreadCount,
        totalCount: formatted.length,
      })
    },
    viewDetail(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const messages = this.data.messages.map((m) => {
        if (m.id === id) {
          return { ...m, read: true }
        }
        return m
      })

      const msg = messages.find((m) => m.id === id)
      if (!msg) return

      wx.setStorageSync(STORAGE_KEY, messages)

      wx.showModal({
        title: msg.title,
        content: msg.content,
        showCancel: false,
      })

      const unreadCount = messages.filter((m) => !m.read).length
      this.setData({ messages, unreadCount })
    },
    markAllRead() {
      const messages = this.data.messages.map((m) => ({ ...m, read: true }))
      wx.setStorageSync(STORAGE_KEY, messages)
      this.setData({ messages, unreadCount: 0 })
      wx.showToast({ title: '已全部标记为已读', icon: 'success' })
    },
    clearRead() {
      const unreadMessages = this.data.messages.filter((m) => !m.read)
      if (unreadMessages.length === this.data.totalCount) {
        wx.showToast({ title: '没有已读消息可清空', icon: 'none' })
        return
      }
      wx.setStorageSync(STORAGE_KEY, unreadMessages)
      this.loadMessages()
      wx.showToast({ title: '已清空已读消息', icon: 'success' })
    },
  },
})
