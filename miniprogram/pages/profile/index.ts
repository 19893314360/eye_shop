import { ensureAuthReady } from '../../services/auth-session'
import { ROLE_LABEL } from '../../utils/role'
import { formatTime } from '../../utils/util'

interface ProfileField {
  label: string
  value: string
  editable: boolean
  key: string
}

const STORAGE_KEY = 'yanjing-profile-extra'

Component({
  data: {
    loading: true,
    role: 'sales' as UserRole,
    roleLabel: '',
    fields: [] as ProfileField[],
    editing: false,
    editData: {} as Record<string, string>,
    lastLoginText: '',
    canSwitchRole: true,
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
        const extra = this.loadExtra()

        const roleLabel = ROLE_LABEL[state.role] || state.role
        const fields: ProfileField[] = [
          { label: '姓名', value: state.userName || extra.userName || '', editable: true, key: 'userName' },
          { label: '手机号', value: state.mobile || extra.mobile || '', editable: true, key: 'mobile' },
          { label: '角色', value: roleLabel, editable: false, key: 'role' },
          { label: '所属门店', value: state.storeName || '', editable: false, key: 'storeName' },
        ]

        if (state.role !== 'customer') {
          fields.push({ label: '门店编号', value: state.storeId || '', editable: false, key: 'storeId' })
          fields.push({ label: '人员编号', value: state.userId || '', editable: false, key: 'userId' })
        }

        const lastLoginTime = wx.getStorageSync('yanjing-last-login-time') as number | undefined
        const lastLoginText = lastLoginTime ? formatTime(new Date(lastLoginTime)) : '--'

        this.setData({
          role: state.role,
          roleLabel,
          fields,
          lastLoginText,
          canSwitchRole: true,
          loading: false,
        })
      } catch {
        this.setData({ loading: false })
      }
    },
    loadExtra(): Record<string, string> {
      const raw = wx.getStorageSync(STORAGE_KEY)
      if (!raw || typeof raw !== 'object') return {}
      return raw as Record<string, string>
    },
    saveExtra(data: Record<string, string>) {
      wx.setStorageSync(STORAGE_KEY, data)
    },
    startEdit() {
      const editData: Record<string, string> = {}
      this.data.fields.forEach((f) => {
        if (f.editable) {
          editData[f.key] = f.value
        }
      })
      this.setData({ editing: true, editData })
    },
    cancelEdit() {
      this.setData({ editing: false, editData: {} })
    },
    onFieldInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const key = e.currentTarget.dataset.key as string
      this.setData({
        ['editData.' + key]: e.detail.value || '',
      })
    },
    async saveEdit() {
      const { editData, fields } = this.data
      const userName = (editData.userName || '').trim()
      const mobile = (editData.mobile || '').trim()

      if (!userName) {
        wx.showToast({ title: '姓名不能为空', icon: 'none' })
        return
      }
      if (mobile && !/^1\d{10}$/.test(mobile)) {
        wx.showToast({ title: '手机号格式错误', icon: 'none' })
        return
      }

      const extra = this.loadExtra()
      if (userName) extra.userName = userName
      if (mobile) extra.mobile = mobile
      this.saveExtra(extra)

      const updatedFields = fields.map((f) => {
        if (f.editable && editData[f.key] !== undefined) {
          return { ...f, value: editData[f.key] }
        }
        return f
      })

      this.setData({ fields: updatedFields, editing: false, editData: {} })
      wx.showToast({ title: '保存成功', icon: 'success' })
    },
    switchRole() {
      wx.navigateTo({ url: '/pages/entry/index' })
    },
  },
})
