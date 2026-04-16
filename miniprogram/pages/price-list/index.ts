import { ensureAuthReady } from '../../services/auth-session'

type LensCategory = 'all' | 'single' | 'progressive' | 'bluecut' | 'photochromic'

interface LensItem {
  id: string
  sku: string
  name: string
  category: LensCategory
  refractiveIndex: string
  price: number
  memberPrice: number
  stock: string
  supplier: string
}

const STORAGE_KEY = 'yanjing-price-list'

const categoryOptions: Array<{ key: LensCategory; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'single', label: '单光镜片' },
  { key: 'progressive', label: '渐进镜片' },
  { key: 'bluecut', label: '防蓝光镜片' },
  { key: 'photochromic', label: '变色镜片' },
]

const categoryMap: Record<string, string> = {
  single: '单光',
  progressive: '渐进',
  bluecut: '防蓝光',
  photochromic: '变色',
}

const defaultLensList: LensItem[] = [
  { id: 'PL-001', sku: 'LENS-S-156', name: '标准单光镜片 1.56', category: 'single', refractiveIndex: '1.56', price: 128, memberPrice: 98, stock: '充足', supplier: '明月' },
  { id: 'PL-002', sku: 'LENS-S-160', name: '超薄单光镜片 1.60', category: 'single', refractiveIndex: '1.60', price: 258, memberPrice: 218, stock: '充足', supplier: '明月' },
  { id: 'PL-003', sku: 'LENS-S-167', name: '超薄单光镜片 1.67', category: 'single', refractiveIndex: '1.67', price: 468, memberPrice: 398, stock: '少量', supplier: '依视路' },
  { id: 'PL-004', sku: 'LENS-S-174', name: '超薄单光镜片 1.74', category: 'single', refractiveIndex: '1.74', price: 868, memberPrice: 768, stock: '少量', supplier: '依视路' },
  { id: 'PL-005', sku: 'LENS-P-160', name: '渐进镜片 1.60', category: 'progressive', refractiveIndex: '1.60', price: 580, memberPrice: 480, stock: '充足', supplier: '明月' },
  { id: 'PL-006', sku: 'LENS-P-167', name: '渐进镜片 1.67', category: 'progressive', refractiveIndex: '1.67', price: 980, memberPrice: 858, stock: '充足', supplier: '蔡司' },
  { id: 'PL-007', sku: 'LENS-P-174', name: '渐进镜片 1.74', category: 'progressive', refractiveIndex: '1.74', price: 1580, memberPrice: 1380, stock: '少量', supplier: '蔡司' },
  { id: 'PL-008', sku: 'LENS-B-156', name: '防蓝光镜片 1.56', category: 'bluecut', refractiveIndex: '1.56', price: 368, memberPrice: 298, stock: '充足', supplier: '依视路' },
  { id: 'PL-009', sku: 'LENS-B-160', name: '防蓝光镜片 1.60', category: 'bluecut', refractiveIndex: '1.60', price: 488, memberPrice: 428, stock: '充足', supplier: '依视路' },
  { id: 'PL-010', sku: 'LENS-B-167', name: '防蓝光镜片 1.67', category: 'bluecut', refractiveIndex: '1.67', price: 668, memberPrice: 588, stock: '少量', supplier: '蔡司' },
  { id: 'PL-011', sku: 'LENS-C-156', name: '变色镜片 1.56', category: 'photochromic', refractiveIndex: '1.56', price: 458, memberPrice: 398, stock: '充足', supplier: '全视线' },
  { id: 'PL-012', sku: 'LENS-C-160', name: '变色镜片 1.60', category: 'photochromic', refractiveIndex: '1.60', price: 598, memberPrice: 528, stock: '少量', supplier: '全视线' },
]

Component({
  data: {
    loading: false,
    role: 'sales' as UserRole,
    categoryOptions,
    categoryMap,
    filterCategory: 'all' as LensCategory,
    keyword: '',
    list: [] as LensItem[],
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
        this.setData({ role: auth.role })
      } catch {
        // ignore
      }
      this.loadData()
    },
    loadData() {
      let list = wx.getStorageSync(STORAGE_KEY)
      if (!Array.isArray(list) || list.length === 0) {
        list = defaultLensList
        wx.setStorageSync(STORAGE_KEY, list)
      }
      this.setData({ list })
      this.applyFilter()
    },
    applyFilter() {
      const { keyword, filterCategory } = this.data
      const all: LensItem[] = wx.getStorageSync(STORAGE_KEY) || defaultLensList
      const filtered = all.filter((item) => {
        const matchCategory = filterCategory === 'all' || item.category === filterCategory
        const normalizedKeyword = keyword.trim()
        const matchKeyword = !normalizedKeyword ||
          item.name.includes(normalizedKeyword) ||
          item.sku.toLowerCase().includes(normalizedKeyword.toLowerCase()) ||
          item.supplier.includes(normalizedKeyword)
        return matchCategory && matchKeyword
      })
      this.setData({ list: filtered })
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ keyword: e.detail.value || '' })
    },
    onSearch() {
      this.applyFilter()
    },
    onCategoryFilter(e: WechatMiniprogram.TouchEvent) {
      const category = e.currentTarget.dataset.category as LensCategory
      this.setData({ filterCategory: category })
      this.applyFilter()
    },
    viewDetail(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const item = this.data.list.find((l) => l.id === id)
      if (!item) return

      const catLabel = categoryMap[item.category] || item.category
      const detail = [
        'SKU：' + item.sku,
        '品类：' + catLabel,
        '折射率：' + item.refractiveIndex,
        '零售价：￥' + item.price,
        '会员价：￥' + item.memberPrice,
        '库存：' + item.stock,
        '供应商：' + item.supplier,
      ].join('\n')

      wx.showModal({
        title: item.name,
        content: detail,
        showCancel: false,
      })
    },
  },
})
