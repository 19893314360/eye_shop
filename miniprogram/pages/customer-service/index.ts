import { ensureAuthReady } from '../../services/auth-session'

Component({
  data: {
    loading: true,
    role: 'customer' as UserRole,
    storeName: '',
    storePhone: '400-888-0123',
    storeAddress: '徐记眼镜店总店 · 东城区光明路 88 号',
    workTime: '周一至周日 09:00 - 21:00',
    onlineTime: '周一至周五 09:00 - 18:00',
    faqItems: [
      { question: '配镜需要多长时间？', route: '/pages/faq/index' },
      { question: '如何查询订单进度？', route: '/pages/order-list/index' },
      { question: '退换货政策是什么？', route: '/pages/faq/index' },
      { question: '如何成为会员？', route: '/pages/member-center/index' },
    ],
  },
  lifetimes: {
    attached() {
      this.initPage()
    },
  },
  methods: {
    async initPage() {
      try {
        const state = await ensureAuthReady()
        this.setData({
          role: state.role,
          storeName: state.storeName || '徐记眼镜店',
          loading: false,
        })
      } catch {
        this.setData({ loading: false })
      }
    },
    callStore() {
      wx.makePhoneCall({
        phoneNumber: this.data.storePhone.replace(/-/g, ''),
        fail: () => {
          wx.showToast({ title: '拨号失败', icon: 'none' })
        },
      })
    },
    copyPhone() {
      wx.setClipboardData({
        data: this.data.storePhone,
        success: () => {
          wx.showToast({ title: '已复制电话号码', icon: 'success' })
        },
      })
    },
    goFaq() {
      wx.navigateTo({ url: '/pages/faq/index' })
    },
    goFaqItem(e: WechatMiniprogram.TouchEvent) {
      const route = e.currentTarget.dataset.route as string
      if (route) {
        wx.navigateTo({ url: route })
      }
    },
    openLocation() {
      wx.openLocation({
        latitude: 39.908,
        longitude: 116.407,
        name: this.data.storeName,
        address: this.data.storeAddress,
        fail: () => {
          wx.showToast({ title: '打开地图失败', icon: 'none' })
        },
      })
    },
  },
})
