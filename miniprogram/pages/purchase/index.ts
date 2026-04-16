import { ensureAuthReady } from '../../services/auth-session'
import { createPurchaseRecord, listPurchaseRecords } from '../../services/purchase'
import { PurchaseRecord, PurchaseType } from '../../types/purchase'
import { formatTime } from '../../utils/util'

interface PurchaseForm {
  type: PurchaseType
  itemName: string
  sku: string
  qty: string
  unitCost: string
  supplier: string
  note: string
}

interface PurchaseViewItem extends PurchaseRecord {
  typeLabel: string
  createdText: string
  amountText: string
}

const tabOptions: Array<{ key: PurchaseType | 'all'; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'order', label: '采购订单' },
  { key: 'inbound', label: '采购入库' },
  { key: 'return', label: '采购退货' },
  { key: 'frame', label: '镜架入库' },
]

const typeOptions: Array<{ label: string; value: PurchaseType }> = [
  { label: '采购订单', value: 'order' },
  { label: '采购入库', value: 'inbound' },
  { label: '采购退货', value: 'return' },
  { label: '镜架入库', value: 'frame' },
]

function defaultForm(): PurchaseForm {
  return {
    type: 'order',
    itemName: '',
    sku: '',
    qty: '',
    unitCost: '',
    supplier: '',
    note: '',
  }
}

function toTypeLabel(type: PurchaseType): string {
  if (type === 'inbound') {
    return '采购入库'
  }
  if (type === 'return') {
    return '采购退货'
  }
  if (type === 'frame') {
    return '镜架入库'
  }
  return '采购订单'
}

Component({
  data: {
    loading: false,
    submitting: false,
    role: 'sales' as UserRole,
    currentTab: 'all' as PurchaseType | 'all',
    tabOptions,
    typeOptions,
    typeIndex: 0,
    form: defaultForm(),
    list: [] as PurchaseViewItem[],
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
      return current?.options || {}
    },
    applyRouteParams() {
      const tab = this.getRouteOptions().tab
      if (tab === 'order' || tab === 'inbound' || tab === 'return' || tab === 'frame' || tab === 'all') {
        const typeIndex = typeOptions.findIndex((item) => item.value === tab)
        this.setData({
          currentTab: tab,
          typeIndex: typeIndex >= 0 ? typeIndex : 0,
          'form.type': tab === 'all' ? 'order' : tab,
        })
      }
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
        this.setData({
          role: auth.role,
        })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    mapList(list: PurchaseRecord[]): PurchaseViewItem[] {
      return list.map((item) => ({
        ...item,
        typeLabel: toTypeLabel(item.type),
        createdText: formatTime(new Date(item.createdAt)),
        amountText: (item.qty * item.unitCost).toFixed(2),
      }))
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const records = await listPurchaseRecords()
        const tab = this.data.currentTab
        const filtered = tab === 'all' ? records : records.filter((item) => item.type === tab)
        this.setData({
          list: this.mapList(filtered),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载采购记录失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as PurchaseType | 'all'
      if (!tab || tab === this.data.currentTab) {
        return
      }
      const typeIndex = typeOptions.findIndex((item) => item.value === tab)
      this.setData({
        currentTab: tab,
        typeIndex: typeIndex >= 0 ? typeIndex : this.data.typeIndex,
        'form.type': tab === 'all' ? this.data.form.type : tab,
      })
      this.refreshData()
    },
    onTypeChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const idx = Number(e.detail.value || 0)
      const option = typeOptions[idx] || typeOptions[0]
      this.setData({
        typeIndex: idx,
        'form.type': option.value,
      })
    },
    onInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as keyof PurchaseForm
      this.setData({
        [`form.${field}`]: e.detail.value || '',
      })
    },
    async submit() {
      if (this.data.submitting) {
        return
      }
      const form = this.data.form
      if (!form.itemName.trim()) {
        wx.showToast({ title: '请输入商品名称', icon: 'none' })
        return
      }
      if (!form.sku.trim()) {
        wx.showToast({ title: '请输入 SKU', icon: 'none' })
        return
      }
      const qty = Number(form.qty)
      const unitCost = Number(form.unitCost)
      if (!Number.isFinite(qty) || qty <= 0) {
        wx.showToast({ title: '数量必须大于 0', icon: 'none' })
        return
      }
      if (!Number.isFinite(unitCost) || unitCost <= 0) {
        wx.showToast({ title: '单价必须大于 0', icon: 'none' })
        return
      }
      if (!form.supplier.trim()) {
        wx.showToast({ title: '请输入供应商', icon: 'none' })
        return
      }

      this.setData({ submitting: true })
      try {
        const auth = await ensureAuthReady()
        await createPurchaseRecord({
          type: form.type,
          itemName: form.itemName.trim(),
          sku: form.sku.trim(),
          qty,
          unitCost,
          supplier: form.supplier.trim(),
          operator: auth.userName || '系统',
          note: form.note.trim(),
        })
        wx.showToast({ title: '采购记录已提交', icon: 'success' })
        this.setData({
          form: {
            ...defaultForm(),
            type: this.data.form.type,
          },
        })
        this.refreshData()
      } catch (error) {
        const message = error instanceof Error ? error.message : '提交失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ submitting: false })
      }
    },
  },
})
