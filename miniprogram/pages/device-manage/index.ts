import { ensureAuthReady } from '../../services/auth-session'

type DeviceStatus = 'online' | 'offline' | 'error'
type DeviceType = 'printer' | 'cashbox' | 'scanner'

interface Device {
  id: string
  name: string
  type: DeviceType
  model: string
  status: DeviceStatus
  storeName: string
  lastActive: string
  sn: string
}

const typeLabels: Record<DeviceType, string> = {
  printer: '打印机',
  cashbox: '收款盒子',
  scanner: '扫码枪',
}

const statusLabels: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  error: '异常',
}

const STORAGE_KEY = 'yanjing-devices'

const defaultDevices: Device[] = [
  { id: 'DEV-001', name: '前台小票打印机', type: 'printer', model: '热敏58mm', status: 'online', storeName: '徐记总店', lastActive: '2026-04-16 12:30', sn: 'PRN-20250101' },
  { id: 'DEV-002', name: '配镜单打印机', type: 'printer', model: 'A4激光', status: 'online', storeName: '徐记总店', lastActive: '2026-04-16 11:45', sn: 'PRN-20250102' },
  { id: 'DEV-003', name: '1号收款盒子', type: 'cashbox', model: 'CB-300', status: 'online', storeName: '徐记总店', lastActive: '2026-04-16 13:00', sn: 'CAX-20250201' },
  { id: 'DEV-004', name: '2号收款盒子', type: 'cashbox', model: 'CB-300', status: 'offline', storeName: '徐记东城店', lastActive: '2026-04-14 18:00', sn: 'CAX-20250202' },
  { id: 'DEV-005', name: '条码扫描枪', type: 'scanner', model: 'SC-200', status: 'error', storeName: '徐记总店', lastActive: '2026-04-15 09:20', sn: 'SCN-20250301' },
]

const supportDocs = [
  { title: '打印机驱动安装指南', type: 'printer' },
  { title: '收款盒子绑定流程', type: 'cashbox' },
  { title: '扫码枪配对说明', type: 'scanner' },
  { title: '常见故障排查', type: 'all' },
]

Component({
  data: {
    role: 'sales' as UserRole,
    devices: [] as Device[],
    filteredDevices: [] as Device[],
    keyword: '',
    filterType: 'all' as 'all' | DeviceType,
    typeOptions: [
      { key: 'all', label: '全部' },
      { key: 'printer', label: '打印机' },
      { key: 'cashbox', label: '收款盒子' },
      { key: 'scanner', label: '扫码枪' },
    ],
    typeLabels,
    statusLabels,
    supportDocs,
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
        this.setData({ role: state.role })
      } catch {
        // ignore
      }
      this.loadDevices()
    },
    loadDevices() {
      let devices: Device[] = wx.getStorageSync(STORAGE_KEY)
      if (!Array.isArray(devices) || devices.length === 0) {
        devices = defaultDevices
        wx.setStorageSync(STORAGE_KEY, devices)
      }
      this.setData({ devices, loading: false })
      this.applyFilter()
    },
    applyFilter() {
      const { devices, keyword, filterType } = this.data
      const normalizedKeyword = keyword.trim()
      const filtered = devices.filter((d) => {
        const matchType = filterType === 'all' || d.type === filterType
        const matchKeyword = !normalizedKeyword ||
          d.name.includes(normalizedKeyword) ||
          d.storeName.includes(normalizedKeyword) ||
          d.sn.includes(normalizedKeyword)
        return matchType && matchKeyword
      })
      this.setData({ filteredDevices: filtered })
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ keyword: e.detail.value || '' })
    },
    onSearch() {
      this.applyFilter()
    },
    onTypeFilter(e: WechatMiniprogram.TouchEvent) {
      const type = e.currentTarget.dataset.type as 'all' | DeviceType
      this.setData({ filterType: type })
      this.applyFilter()
    },
    viewDevice(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const device = this.data.devices.find((d) => d.id === id)
      if (!device) return
      wx.showModal({
        title: device.name,
        content: `类型：${typeLabels[device.type]}\n型号：${device.model}\n序列号：${device.sn}\n门店：${device.storeName}\n状态：${statusLabels[device.status]}\n最后活跃：${device.lastActive}`,
        showCancel: false,
      })
    },
    viewSupportDoc(e: WechatMiniprogram.TouchEvent) {
      const title = e.currentTarget.dataset.title as string
      wx.showModal({
        title,
        content: '文档详情暂未上线，请关注后续版本更新。',
        showCancel: false,
      })
    },
    bindDevice() {
      wx.showModal({
        title: '绑定设备',
        content: '请确保设备已开机并处于配对模式，然后扫描设备上的二维码进行绑定。（功能开发中）',
        showCancel: false,
      })
    },
  },
})
