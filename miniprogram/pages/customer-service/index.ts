import { formatTime } from '../../utils/util'

interface ChatMessage {
  id: string
  role: 'user' | 'service'
  content: string
  time: number
  timeText: string
}

const STORAGE_KEY = 'yanjing-chat-messages'

const quickReplies = [
  '如何预约验光？',
  '配镜需要多长时间？',
  '如何查询订单进度？',
  '退换货政策是什么？',
  '会员积分如何兑换？',
]

const autoReplies: Record<string, string> = {
  '如何预约验光？': '您可以通过首页的"服务预约"功能进行预约，选择验光服务并选择合适的时间段即可。我们也支持电话预约。',
  '配镜需要多长时间？': '普通配镜通常需要 3-5 个工作日，特殊定制镜片可能需要 7-10 个工作日。具体以订单通知为准。',
  '如何查询订单进度？': '您可以在"我的订单"中查看订单状态，包含待支付、待加工、待取件、已完成等状态。',
  '退换货政策是什么？': '我们支持 7 天无理由退换货（定制镜片除外），请保持商品完好并携带购买凭证到门店办理。',
  '会员积分如何兑换？': '积分可在"会员中心-积分明细"中查看，满 100 积分可兑换 1 元抵扣券，也可兑换指定礼品。',
  'default': '感谢您的咨询，我会尽快为您处理。如需人工服务，请拨打客服热线：400-888-9999。',
}

Component({
  data: {
    messages: [] as ChatMessage[],
    inputValue: '',
    sending: false,
    typing: false,
    quickReplies,
    scrollToView: '',
  },
  lifetimes: {
    attached() {
      this.loadMessages()
      if (this.data.messages.length === 0) {
        this.addServiceMessage('您好！欢迎来到徐记眼镜在线客服，请问有什么可以帮您？')
      }
    },
  },
  methods: {
    loadMessages() {
      const raw = wx.getStorageSync(STORAGE_KEY)
      if (Array.isArray(raw)) {
        this.setData({ messages: raw })
      }
    },
    saveMessages() {
      wx.setStorageSync(STORAGE_KEY, this.data.messages)
    },
    addMessage(role: 'user' | 'service', content: string) {
      const now = Date.now()
      const msg: ChatMessage = {
        id: `msg-${now}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
        time: now,
        timeText: formatTime(new Date(now)),
      }
      const messages = [...this.data.messages, msg]
      this.setData({ messages, scrollToView: `msg-${msg.id}` })
      this.saveMessages()
    },
    addServiceMessage(content: string) {
      this.addMessage('service', content)
    },
    onInput(e: WechatMiniprogram.Input) {
      this.setData({ inputValue: e.detail.value || '' })
    },
    sendMessage() {
      if (this.data.sending || !this.data.inputValue.trim()) return

      const content = this.data.inputValue.trim()
      this.setData({ inputValue: '', sending: true })
      this.addMessage('user', content)

      // Simulate auto reply
      this.setData({ typing: true })
      const delay = 800 + Math.random() * 1200
      setTimeout(() => {
        const reply = autoReplies[content] || autoReplies.default
        this.setData({ typing: false, sending: false })
        this.addServiceMessage(reply)
      }, delay)
    },
    sendQuickReply(e: WechatMiniprogram.TouchEvent) {
      const text = e.currentTarget.dataset.text as string
      this.setData({ inputValue: text })
      this.sendMessage()
    },
    onUnload() {
      this.saveMessages()
    },
  },
})
