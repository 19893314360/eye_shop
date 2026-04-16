import { createMember, listMembers } from '../../services/member'
import { ensureAuthReady } from '../../services/auth-session'
import { Member, MemberGender } from '../../types/member'

interface MemberForm {
  name: string
  mobile: string
  gender: MemberGender
  birthday: string
  note: string
}

const genderOptions: Array<{ label: string; value: MemberGender }> = [
  { label: '未知', value: 'unknown' },
  { label: '男', value: 'male' },
  { label: '女', value: 'female' },
]

function defaultForm(): MemberForm {
  return {
    name: '',
    mobile: '',
    gender: 'unknown',
    birthday: '',
    note: '',
  }
}

Component({
  data: {
    form: defaultForm(),
    genderOptions,
    genderIndex: 0,
    submitting: false,
    loadingList: false,
    recentMembers: [] as Member[],
  },
  lifetimes: {
    attached() {
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
          wx.navigateBack({
            delta: 1,
          })
          return false
        }
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    onInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as keyof MemberForm
      const value = e.detail.value || ''
      this.setData({
        [`form.${field}`]: value,
      })
    },
    onGenderChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const idx = Number(e.detail.value || 0)
      const option = genderOptions[idx] || genderOptions[0]
      this.setData({
        genderIndex: idx,
        'form.gender': option.value,
      })
    },
    async refreshMembers() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loadingList: true })
      try {
        const members = await listMembers()
        this.setData({
          recentMembers: members.slice(0, 8),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载会员失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loadingList: false })
      }
    },
    async submit() {
      if (this.data.submitting) {
        return
      }
      const payload = this.data.form
      if (!payload.name.trim()) {
        wx.showToast({ title: '请输入会员姓名', icon: 'none' })
        return
      }
      if (!/^1\d{10}$/.test(payload.mobile.trim())) {
        wx.showToast({ title: '请输入正确手机号', icon: 'none' })
        return
      }

      this.setData({ submitting: true })
      try {
        await createMember({
          name: payload.name.trim(),
          mobile: payload.mobile.trim(),
          gender: payload.gender,
          birthday: payload.birthday.trim(),
          note: payload.note.trim(),
        })
        wx.showToast({
          title: '会员创建成功',
          icon: 'success',
        })
        this.setData({
          form: defaultForm(),
          genderIndex: 0,
        })
        await this.refreshMembers()
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建会员失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ submitting: false })
      }
    },
    goOrderCreate() {
      wx.navigateTo({
        url: '/pages/order-create/index',
      })
    },
  },
})
