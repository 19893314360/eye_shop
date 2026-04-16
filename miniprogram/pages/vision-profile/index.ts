import { ensureAuthReady } from '../../services/auth-session'
import { listMembers } from '../../services/member'
import { listVisionRecords } from '../../services/vision'
import { Member } from '../../types/member'
import { VisionRecord } from '../../types/vision'

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    memberList: [] as Member[],
    memberIndex: 0,
    memberIdFromRoute: '',
    selectedMember: null as Member | null,
    records: [] as VisionRecord[],
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
      this.setData({
        memberIdFromRoute: options.memberId || '',
      })
    },
    async refreshData() {
      this.setData({ loading: true })
      try {
        const auth = await ensureAuthReady()
        const members = await listMembers()
        const preferredMemberId = this.data.memberIdFromRoute
        const preferredIdx = preferredMemberId ? members.findIndex((item) => item.id === preferredMemberId) : -1
        const memberIndex = preferredIdx >= 0 ? preferredIdx : 0
        const selectedMember = members[memberIndex] || null
        const records = selectedMember ? await listVisionRecords(selectedMember.id) : []

        this.setData({
          role: auth.role,
          memberList: members,
          memberIndex,
          selectedMember,
          records,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载视力档案失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    async onMemberChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const idx = Number(e.detail.value || 0)
      const member = this.data.memberList[idx]
      if (!member) {
        return
      }
      this.setData({
        memberIndex: idx,
        selectedMember: member,
      })
      const records = await listVisionRecords(member.id)
      this.setData({ records })
    },
    goAppointment() {
      const member = this.data.selectedMember
      if (!member) {
        return
      }
      const query = `customerName=${encodeURIComponent(member.name)}&mobile=${encodeURIComponent(member.mobile)}`
      wx.navigateTo({
        url: `/pages/appointment/index?${query}`,
      })
    },
    goMemberQuery() {
      wx.navigateTo({
        url: '/pages/member-query/index',
      })
    },
  },
})
