import { ensureAuthReady, switchRole } from '../../services/auth-session'
import { ROLE_LABEL, ROLE_OPTIONS } from '../../utils/role'

Component({
  data: {
    roleOptions: ROLE_OPTIONS,
    currentRole: 'sales' as UserRole,
    currentRoleLabel: ROLE_LABEL.sales,
    userName: '',
    loading: true,
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
          currentRole: state.role,
          currentRoleLabel: ROLE_LABEL[state.role],
          userName: state.userName || '',
          loading: false,
        })
      } catch {
        this.setData({ loading: false })
      }
    },
    async chooseRole(e: WechatMiniprogram.TouchEvent) {
      if (this.data.loading) {
        return
      }
      const role = e.currentTarget.dataset.role as UserRole
      if (!role || role === this.data.currentRole) {
        return
      }
      this.setData({ loading: true })
      try {
        await switchRole(role)
        this.setData({
          currentRole: role,
          currentRoleLabel: ROLE_LABEL[role],
        })
        wx.reLaunch({
          url: '/pages/home/index',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '角色切换失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    goBack() {
      wx.navigateBack({
        fail() {
          wx.reLaunch({ url: '/pages/home/index' })
        },
      })
    },
  },
})
