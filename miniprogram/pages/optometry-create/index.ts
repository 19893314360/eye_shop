import { ensureAuthReady } from '../../services/auth-session'
import { listMembers } from '../../services/member'
import { createVisionRecord } from '../../services/vision'
import { Member } from '../../types/member'

interface OptometryForm {
  memberId: string
  examDate: string
  rightEyeSph: string
  rightEyeCyl: string
  rightEyeAxis: string
  leftEyeSph: string
  leftEyeCyl: string
  leftEyeAxis: string
  pd: string
  doctor: string
  suggestion: string
}

function todayString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = `${now.getMonth() + 1}`.padStart(2, '0')
  const d = `${now.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function defaultForm(): OptometryForm {
  return {
    memberId: '',
    examDate: todayString(),
    rightEyeSph: '',
    rightEyeCyl: '',
    rightEyeAxis: '',
    leftEyeSph: '',
    leftEyeCyl: '',
    leftEyeAxis: '',
    pd: '',
    doctor: '',
    suggestion: '',
  }
}

function toEyeString(sph: string, cyl: string, axis: string): string {
  const safeSph = sph.trim() || '--'
  const safeCyl = cyl.trim() || '--'
  const safeAxis = axis.trim() || '--'
  return `S ${safeSph} C ${safeCyl} A ${safeAxis}`
}

Component({
  data: {
    loading: false,
    submitting: false,
    memberList: [] as Member[],
    memberIndex: 0,
    memberIdFromRoute: '',
    form: defaultForm(),
  },
  lifetimes: {
    attached() {
      this.applyRouteParams()
      this.refreshMembers()
    },
  },
  pageLifetimes: {
    show() {
      this.applyRouteParams()
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
    async ensureAccess(): Promise<boolean> {
      try {
        const auth = await ensureAuthReady()
        if (auth.role === 'customer') {
          wx.showToast({
            title: '客户端无此权限',
            icon: 'none',
          })
          wx.navigateBack({ delta: 1 })
          return false
        }
        if (!this.data.form.doctor.trim()) {
          this.setData({
            'form.doctor': auth.userName || '',
          })
        }
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    async refreshMembers() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const members = await listMembers()
        const preferredId = this.data.memberIdFromRoute
        const preferredIdx = preferredId ? members.findIndex((item) => item.id === preferredId) : -1
        const memberIndex = preferredIdx >= 0 ? preferredIdx : 0
        const selected = members[memberIndex]
        this.setData({
          memberList: members,
          memberIndex,
          'form.memberId': selected ? selected.id : '',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载会员失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onMemberChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const idx = Number(e.detail.value || 0)
      const member = this.data.memberList[idx]
      if (!member) {
        return
      }
      this.setData({
        memberIndex: idx,
        'form.memberId': member.id,
      })
    },
    onInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as keyof OptometryForm
      this.setData({
        [`form.${field}`]: e.detail.value || '',
      })
    },
    onDateChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        'form.examDate': e.detail.value,
      })
    },
    async submit() {
      if (this.data.submitting) {
        return
      }
      const form = this.data.form
      if (!form.memberId) {
        wx.showToast({ title: '请选择会员', icon: 'none' })
        return
      }
      if (!form.pd.trim()) {
        wx.showToast({ title: '请输入 PD', icon: 'none' })
        return
      }
      if (!form.doctor.trim()) {
        wx.showToast({ title: '请输入验光师', icon: 'none' })
        return
      }

      this.setData({ submitting: true })
      try {
        await createVisionRecord({
          memberId: form.memberId,
          examDate: form.examDate,
          rightEye: toEyeString(form.rightEyeSph, form.rightEyeCyl, form.rightEyeAxis),
          leftEye: toEyeString(form.leftEyeSph, form.leftEyeCyl, form.leftEyeAxis),
          pd: form.pd.trim(),
          suggestion: form.suggestion.trim(),
          doctor: form.doctor.trim(),
        })
        wx.showToast({
          title: '验光记录已保存',
          icon: 'success',
        })
        const selected = this.data.memberList[this.data.memberIndex]
        this.setData({
          form: {
            ...defaultForm(),
            memberId: selected ? selected.id : '',
            doctor: form.doctor.trim(),
          },
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '保存失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
    goVisionProfile() {
      const member = this.data.memberList[this.data.memberIndex]
      if (!member) {
        return
      }
      wx.navigateTo({
        url: `/pages/vision-profile/index?memberId=${member.id}`,
      })
    },
  },
})
