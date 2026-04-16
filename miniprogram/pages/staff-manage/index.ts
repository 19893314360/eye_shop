import { ROLE_LABEL } from '../../utils/role'

type StaffStatus = 'active' | 'inactive'

interface StaffMember {
  id: string
  name: string
  role: UserRole
  phone: string
  storeName: string
  status: StaffStatus
  joinDate: string
  permissions: string[]
  wechatBound: boolean
}

const STAFF_STORAGE_KEY = 'yanjing-staff'

const defaultStaff: StaffMember[] = [
  {
    id: 'S001',
    name: '徐明',
    role: 'sales',
    phone: '13800000002',
    storeName: '徐记总店',
    status: 'active',
    joinDate: '2025-06-15',
    permissions: ['member:create', 'member:read', 'order:create', 'order:pay', 'order:deliver', 'report:read:self'],
    wechatBound: true,
  },
  {
    id: 'S002',
    name: '周宁',
    role: 'sales',
    phone: '13800000003',
    storeName: '徐记总店',
    status: 'active',
    joinDate: '2025-08-20',
    permissions: ['member:create', 'member:read', 'order:create', 'order:pay', 'order:deliver', 'report:read:self'],
    wechatBound: true,
  },
  {
    id: 'M001',
    name: '徐店长',
    role: 'manager',
    phone: '13800000001',
    storeName: '徐记总店',
    status: 'active',
    joinDate: '2025-01-01',
    permissions: ['member:create', 'member:read', 'order:create', 'order:pay', 'order:deliver', 'report:read:all', 'inventory:manage', 'purchase:manage', 'setting:manage'],
    wechatBound: true,
  },
  {
    id: 'S003',
    name: '林安',
    role: 'sales',
    phone: '13800000004',
    storeName: '徐记东城店',
    status: 'inactive',
    joinDate: '2025-03-10',
    permissions: ['member:read', 'order:create'],
    wechatBound: false,
  },
]

const permissionLabels: Record<string, string> = {
  'member:create': '新增会员',
  'member:read': '查看会员',
  'order:create': '创建订单',
  'order:pay': '订单收款',
  'order:deliver': '取件核销',
  'report:read:self': '个人报表',
  'report:read:all': '全店报表',
  'inventory:manage': '库存管理',
  'purchase:manage': '采购管理',
  'setting:manage': '系统设置',
}

const storeOptions = ['徐记总店', '徐记东城店', '徐记西城店', '徐记北城店']

Component({
  data: {
    staff: [] as StaffMember[],
    filteredStaff: [] as StaffMember[],
    keyword: '',
    filterRole: 'all' as 'all' | UserRole,
    roleOptions: [
      { key: 'all', label: '全部' },
      { key: 'sales', label: '销售员' },
      { key: 'manager', label: '管理者' },
    ],
    permissionLabels,
    loading: true,
    // 新增员工弹窗
    showAddModal: false,
    addForm: {
      name: '',
      phone: '',
      role: 'sales' as UserRole,
      storeName: '徐记总店',
    },
    storeOptions,
    roleSelectOptions: [
      { key: 'sales', label: '销售员' },
      { key: 'manager', label: '管理者' },
    ],
  },
  lifetimes: {
    attached() {
      this.loadStaff()
    },
  },
  methods: {
    loadStaff() {
      let staff: StaffMember[] = wx.getStorageSync(STAFF_STORAGE_KEY)
      if (!Array.isArray(staff) || staff.length === 0) {
        staff = defaultStaff
        wx.setStorageSync(STAFF_STORAGE_KEY, staff)
      }
      this.setData({ staff, loading: false })
      this.applyFilter()
    },
    applyFilter() {
      const { staff, keyword, filterRole } = this.data
      const normalizedKeyword = keyword.trim()
      const filtered = staff.filter((s) => {
        const matchRole = filterRole === 'all' || s.role === filterRole
        const matchKeyword = !normalizedKeyword ||
          s.name.includes(normalizedKeyword) ||
          s.phone.includes(normalizedKeyword) ||
          s.storeName.includes(normalizedKeyword)
        return matchRole && matchKeyword
      })
      this.setData({ filteredStaff: filtered })
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ keyword: e.detail.value || '' })
    },
    onSearch() {
      this.applyFilter()
    },
    onRoleFilter(e: WechatMiniprogram.TouchEvent) {
      const role = e.currentTarget.dataset.role as 'all' | UserRole
      this.setData({ filterRole: role })
      this.applyFilter()
    },
    viewStaff(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const staff = this.data.staff.find((s) => s.id === id)
      if (!staff) return
      const permLabels = staff.permissions.map((p) => permissionLabels[p] || p).join('、')
      const wechatStatus = staff.wechatBound ? '已绑定' : '未绑定'
      wx.showModal({
        title: staff.name,
        content: '角色：' + ROLE_LABEL[staff.role] + '\n手机：' + staff.phone + '\n门店：' + staff.storeName + '\n入职：' + staff.joinDate + '\n状态：' + (staff.status === 'active' ? '在职' : '离职') + '\n微信：' + wechatStatus + '\n权限：' + (permLabels || '无'),
        showCancel: false,
      })
    },
    toggleStatus(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const staff = this.data.staff.map((s) => {
        if (s.id === id) {
          return { ...s, status: (s.status === 'active' ? 'inactive' : 'active') as StaffStatus }
        }
        return s
      })
      wx.setStorageSync(STAFF_STORAGE_KEY, staff)
      this.setData({ staff })
      this.applyFilter()
      const s = staff.find((item) => item.id === id)
      if (s) {
        wx.showToast({ title: s.name + ' 已' + (s.status === 'active' ? '启用' : '停用'), icon: 'success' })
      }
    },

    // ========== 新增员工 ==========
    showAddStaff() {
      this.setData({
        showAddModal: true,
        addForm: {
          name: '',
          phone: '',
          role: 'sales',
          storeName: '徐记总店',
        },
      })
    },
    hideAddModal() {
      this.setData({ showAddModal: false })
    },
    onAddFormInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as string
      this.setData({ ['addForm.' + field]: e.detail.value || '' })
    },
    onAddRoleChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ ['addForm.role']: e.detail.value })
    },
    onAddStoreChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ ['addForm.storeName']: e.detail.value })
    },
    confirmAddStaff() {
      const { name, phone, role, storeName } = this.data.addForm

      if (!name.trim()) {
        wx.showToast({ title: '请输入姓名', icon: 'none' })
        return
      }
      if (!phone.trim() || !/^1\d{10}$/.test(phone.trim())) {
        wx.showToast({ title: '请输入正确手机号', icon: 'none' })
        return
      }

      const staff = this.data.staff
      const maxId = staff.reduce((max, s) => {
        const num = parseInt(s.id.replace(/\D/g, ''), 10) || 0
        return num > max ? num : max
      }, 0)

      const newStaff: StaffMember = {
        id: 'S' + String(maxId + 1).padStart(3, '0'),
        name: name.trim(),
        phone: phone.trim(),
        role: role,
        storeName,
        status: 'active',
        joinDate: new Date().toISOString().split('T')[0],
        permissions: role === 'manager'
          ? ['member:create', 'member:read', 'order:create', 'order:pay', 'order:deliver', 'report:read:all', 'inventory:manage', 'purchase:manage', 'setting:manage']
          : ['member:create', 'member:read', 'order:create', 'order:pay', 'order:deliver', 'report:read:self'],
        wechatBound: false,
      }

      const updated = [...staff, newStaff]
      wx.setStorageSync(STAFF_STORAGE_KEY, updated)
      this.setData({ staff: updated, showAddModal: false })
      this.applyFilter()
      wx.showToast({ title: '员工已添加', icon: 'success' })
    },

    // ========== 绑定微信 ==========
    bindWechat(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const staff = this.data.staff
      const s = staff.find((item) => item.id === id)
      if (!s) return

      if (s.wechatBound) {
        wx.showModal({
          title: '解绑微信',
          content: '确定要解除 ' + s.name + ' 的微信绑定吗？解绑后该员工将无法自动登录。',
          success: (res) => {
            if (res.confirm) {
              const updated = staff.map((item) => {
                if (item.id === id) {
                  return { ...item, wechatBound: false }
                }
                return item
              })
              wx.setStorageSync(STAFF_STORAGE_KEY, updated)
              this.setData({ staff: updated })
              this.applyFilter()
              wx.showToast({ title: '已解绑', icon: 'success' })
            }
          },
        })
        return
      }

      wx.showModal({
        title: '绑定微信',
        content: '请让 ' + s.name + ' 使用微信扫码打开小程序，系统将自动绑定。当前为模拟操作，确认绑定？',
        success: (res) => {
          if (res.confirm) {
            const updated = staff.map((item) => {
              if (item.id === id) {
                return { ...item, wechatBound: true }
              }
              return item
            })
            wx.setStorageSync(STAFF_STORAGE_KEY, updated)
            this.setData({ staff: updated })
            this.applyFilter()
            wx.showToast({ title: '绑定成功', icon: 'success' })
          }
        },
      })
    },
  },
})
