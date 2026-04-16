import { ensureAuthReady } from '../../services/auth-session'

Component({
  data: {
    loading: true,
    role: 'sales' as UserRole,
    storeName: '',
    qrCodeUrl: '',
    tips: [
      '将小程序码打印后放在收银台，方便客户扫码进入客户端',
      '客户扫码后可直接查看订单、预约服务、申请售后',
      '可在朋友圈或社群中分享小程序码，吸引新客户',
      '小程序码永久有效，无需重复生成',
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
        const auth = await ensureAuthReady()
        this.setData({
          role: auth.role,
          storeName: auth.storeName || '徐记眼镜店',
        })
      } catch {
        this.setData({ storeName: '徐记眼镜店' })
      }

      // 模拟小程序码（实际需要调用后端 wxacode.get 接口生成）
      this.setData({
        qrCodeUrl: '/images/placeholder-qrcode.png',
        loading: false,
      })
    },
    saveToAlbum() {
      if (!this.data.qrCodeUrl || this.data.qrCodeUrl === '/images/placeholder-qrcode.png') {
        wx.showModal({
          title: '生成小程序码',
          content: '小程序码需要通过后端接口生成。请在微信后台"设置-开发设置"中获取小程序码，或联系技术人员配置后端生成接口。',
          showCancel: false,
        })
        return
      }

      wx.saveImageToPhotosAlbum({
        filePath: this.data.qrCodeUrl,
        success: () => {
          wx.showToast({ title: '已保存到相册', icon: 'success' })
        },
        fail: () => {
          wx.showToast({ title: '保存失败，请检查权限', icon: 'none' })
        },
      })
    },
    shareToFriend() {
      wx.showModal({
        title: '分享客户端',
        content: '请点击右上角"..."按钮，选择"转发"即可将当前小程序分享给好友或群聊。好友打开后自动进入客户端首页。',
        showCancel: false,
      })
    },
    copyLink() {
      wx.setClipboardData({
        data: '打开微信搜索"徐记眼镜店"小程序',
        success: () => {
          wx.showToast({ title: '已复制分享文案', icon: 'success' })
        },
      })
    },
  },
})
