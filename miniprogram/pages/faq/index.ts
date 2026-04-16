interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
  expanded: boolean
}

const STORAGE_EXPANDED = 'yanjing-faq-expanded'

const faqCategoryOptions: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'order', label: '订单相关' },
  { key: 'member', label: '会员服务' },
  { key: 'product', label: '产品知识' },
  { key: 'service', label: '售后服务' },
]

const faqData: FaqItem[] = [
  {
    id: 'F001',
    category: 'order',
    question: '配镜需要多长时间？',
    answer: '普通配镜通常需要 3-5 个工作日完成。特殊定制镜片（如渐进多焦点、高折射率镜片）可能需要 7-10 个工作日。具体工期以订单通知为准，您也可以在"我的订单"中查看实时进度。',
    expanded: false,
  },
  {
    id: 'F002',
    category: 'order',
    question: '如何查询订单进度？',
    answer: '登录小程序后，进入"首页-我的订单"或"功能-订单查询"，输入订单号即可查看订单状态。订单状态包括：待支付、待加工、加工中、待取件、已完成。',
    expanded: false,
  },
  {
    id: 'F003',
    category: 'order',
    question: '可以修改已提交的订单吗？',
    answer: '订单在"待支付"状态下可以直接修改或取消。进入"待加工"状态后，如需修改请联系门店客服。已进入加工环节的订单无法修改，但可以申请售后处理。',
    expanded: false,
  },
  {
    id: 'F004',
    category: 'member',
    question: '如何成为会员？',
    answer: '在门店完成首次消费即可自动成为会员。会员等级根据积分自动升级：普通（0-49积分）、白银（50-199积分）、黄金（200-499积分）、钻石（500积分以上）。',
    expanded: false,
  },
  {
    id: 'F005',
    category: 'member',
    question: '积分如何获得和使用？',
    answer: '每消费 10 元获得 1 积分。积分可用于：1) 兑换抵扣券（100积分=1元）；2) 兑换指定礼品；3) 参与会员专属活动。积分有效期为获得之日起 12 个月。',
    expanded: false,
  },
  {
    id: 'F006',
    category: 'member',
    question: '会员充值有什么优惠？',
    answer: '会员充值享受以下优惠：充 500 送 30，充 1000 送 80，充 2000 送 200，充 5000 送 600。充值金额可直接用于消费，不支持提现。',
    expanded: false,
  },
  {
    id: 'F007',
    category: 'product',
    question: '如何选择适合的镜片？',
    answer: '镜片选择建议：1) 日常使用选 1.56/1.60 折射率；2) 高度近视选 1.67/1.74 高折射率；3) 长时间用电脑选防蓝光镜片；4) 中老年选渐进多焦点镜片。验光师会根据您的度数和需求推荐合适的镜片。',
    expanded: false,
  },
  {
    id: 'F008',
    category: 'product',
    question: '镜架保修范围是什么？',
    answer: '镜架享受 1 年免费保修服务，保修范围包括：非人为损坏的焊点断裂、镀层脱落、螺丝松动等。人为损坏（如摔坏、挤压变形）不在保修范围内，但可享受优惠维修价格。',
    expanded: false,
  },
  {
    id: 'F009',
    category: 'service',
    question: '退换货政策是什么？',
    answer: '我们支持 7 天无理由退换货（定制镜片除外）。退换货条件：1) 商品完好无损；2) 携带购买凭证；3) 到原购买门店办理。镜片定制产品因属于个人定制，不支持无理由退换。',
    expanded: false,
  },
  {
    id: 'F010',
    category: 'service',
    question: '多久需要复查一次视力？',
    answer: '建议配镜后 3 个月进行首次复查，之后每 6-12 个月复查一次。青少年（18岁以下）建议每 3-6 个月复查一次。如发现视力下降、眼镜不适等情况，请随时到店复查。',
    expanded: false,
  },
]

Component({
  data: {
    keyword: '',
    currentCategory: 'all',
    categoryOptions: faqCategoryOptions,
    filteredFaqs: [] as FaqItem[],
  },
  lifetimes: {
    attached() {
      this.loadExpandedState()
      this.filterFaqs()
    },
  },
  methods: {
    loadExpandedState() {
      const expandedIds: string[] = wx.getStorageSync(STORAGE_EXPANDED) || []
      faqData.forEach((item) => {
        item.expanded = expandedIds.includes(item.id)
      })
    },
    saveExpandedState() {
      const expandedIds = faqData.filter((item) => item.expanded).map((item) => item.id)
      wx.setStorageSync(STORAGE_EXPANDED, expandedIds)
    },
    filterFaqs() {
      const { keyword, currentCategory } = this.data
      const normalizedKeyword = keyword.trim().toLowerCase()

      const filtered = faqData.filter((item) => {
        const matchCategory = currentCategory === 'all' || item.category === currentCategory
        const matchKeyword = !normalizedKeyword ||
          item.question.toLowerCase().includes(normalizedKeyword) ||
          item.answer.toLowerCase().includes(normalizedKeyword)
        return matchCategory && matchKeyword
      })

      this.setData({ filteredFaqs: filtered })
    },
    onSearchInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ keyword: e.detail.value || '' })
    },
    onSearch() {
      this.filterFaqs()
    },
    onCategoryChange(e: WechatMiniprogram.TouchEvent) {
      const category = e.currentTarget.dataset.category as string
      if (!category || category === this.data.currentCategory) return
      this.setData({ currentCategory: category })
      this.filterFaqs()
    },
    toggleFaq(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const item = faqData.find((f) => f.id === id)
      if (item) {
        item.expanded = !item.expanded
        this.saveExpandedState()
        this.filterFaqs()
      }
    },
  },
})
