import { ensureAuthReady } from '../../services/auth-session'
import { listMembers } from '../../services/member'
import { Member } from '../../types/member'
import { formatTime } from '../../utils/util'

interface MemberViewItem extends Member {
  createdText: string
}

Component({
  data: {
    loading: false,
    keyword: '',
    list: [] as MemberViewItem[],
  },
  lifetimes: {
    attached() {
      this.refreshMembers()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshMembers()
    },
  },
  methods: {
    async ensureAccess(): Promise<boolean> {
      try {
        const state = await ensureAuthReady()
        if (state.role === 'customer') {
          wx.showToast({
            title: '客户端无此权限',
            icon: 'none',
          })
          wx.navigateBack({ delta: 1 })
          return false
        }
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    mapMembers(list: Member[]): MemberViewItem[] {
      return list.map((item) => ({
        ...item,
        createdText: formatTime(new Date(item.createdAt)),
      }))
    },
    async refreshMembers() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const members = await listMembers({
          keyword: this.data.keyword.trim(),
        })
        this.setData({
          list: this.mapMembers(members),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '会员加载失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        keyword: e.detail.value || '',
      })
    },
    onSearch() {
      this.refreshMembers()
    },
    goCreate() {
      wx.navigateTo({
        url: '/pages/member-create/index',
      })
    },
    goOrderCreate(e: WechatMiniprogram.TouchEvent) {
      const memberId = e.currentTarget.dataset.id as string
      if (!memberId) {
        return
      }
      wx.navigateTo({
        url: `/pages/order-create/index?memberId=${memberId}`,
      })
    },
    goVisionProfile(e: WechatMiniprogram.TouchEvent) {
      const memberId = e.currentTarget.dataset.id as string
      if (!memberId) {
        return
      }
      wx.navigateTo({
        url: `/pages/vision-profile/index?memberId=${memberId}`,
      })
    },
    goAppointment(e: WechatMiniprogram.TouchEvent) {
      const name = e.currentTarget.dataset.name as string
      const mobile = e.currentTarget.dataset.mobile as string
      const query = `customerName=${encodeURIComponent(name || '')}&mobile=${encodeURIComponent(mobile || '')}`
      wx.navigateTo({
        url: `/pages/appointment/index?${query}`,
      })
    },
    goAfterSale() {
      wx.navigateTo({
        url: '/pages/after-sale/index?tab=followup',
      })
    },
  },
})
