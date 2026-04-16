interface StoreItem {
  id: string
  name: string
  address: string
  phone: string
  managerName: string
  status: 'active' | 'inactive'
  orderCount: number
  monthAmount: string
}

const defaultStores: StoreItem[] = [
  {
    id: 'STORE-001',
    name: '徐记总店',
    address: '东城区光明路 88 号',
    phone: '010-88880001',
    managerName: '徐店长',
    status: 'active',
    orderCount: 933,
    monthAmount: '3.6万',
  },
  {
    id: 'STORE-002',
    name: '徐记东城店',
    address: '东城区建国门大街 12 号',
    phone: '010-88880002',
    managerName: '周店长',
    status: 'active',
    orderCount: 612,
    monthAmount: '3.2万',
  },
  {
    id: 'STORE-003',
    name: '徐记西城店',
    address: '西城区金融街 56 号',
    phone: '010-88880003',
    managerName: '林店长',
    status: 'active',
    orderCount: 487,
    monthAmount: '2.8万',
  },
  {
    id: 'STORE-004',
    name: '徐记北城店',
    address: '朝阳区望京路 33 号',
    phone: '010-88880004',
    managerName: '陈店长',
    status: 'inactive',
    orderCount: 0,
    monthAmount: '0',
  },
]

const STORE_STORAGE_KEY = 'yanjing-stores'

Component({
  data: {
    stores: [] as StoreItem[],
    keyword: '',
    loading: true,
  },
  lifetimes: {
    attached() {
      this.loadStores()
    },
  },
  methods: {
    loadStores() {
      let stores: StoreItem[] = wx.getStorageSync(STORE_STORAGE_KEY)
      if (!Array.isArray(stores) || stores.length === 0) {
        stores = defaultStores
        wx.setStorageSync(STORE_STORAGE_KEY, stores)
      }
      this.setData({ stores, loading: false })
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ keyword: e.detail.value || '' })
    },
    onSearch() {
      const keyword = this.data.keyword.trim()
      if (!keyword) {
        this.loadStores()
        return
      }
      const stores = (wx.getStorageSync(STORE_STORAGE_KEY) as StoreItem[] || defaultStores).filter(
        (s) => s.name.includes(keyword) || s.address.includes(keyword) || s.managerName.includes(keyword)
      )
      this.setData({ stores })
    },
    viewStore(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const store = this.data.stores.find((s) => s.id === id)
      if (!store) return
      wx.showModal({
        title: store.name,
        content: `地址：${store.address}\n电话：${store.phone}\n店长：${store.managerName}\n状态：${store.status === 'active' ? '营业中' : '已停业'}\n本月订单：${store.orderCount}\n本月营业额：${store.monthAmount}`,
        showCancel: false,
      })
    },
    toggleStoreStatus(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const stores = this.data.stores.map((s) => {
        if (s.id === id) {
          return { ...s, status: (s.status === 'active' ? 'inactive' : 'active') as 'active' | 'inactive' }
        }
        return s
      })
      wx.setStorageSync(STORE_STORAGE_KEY, stores)
      this.setData({ stores })
      const store = stores.find((item) => item.id === id)
      if (store) {
        wx.showToast({
          title: store.name + ' 已' + (store.status === 'active' ? '启用' : '停用'),
          icon: 'success',
        })
      }
    },
  },
})
