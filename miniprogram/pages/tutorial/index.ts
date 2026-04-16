interface Tutorial {
  id: string
  title: string
  category: string
  duration: string
  description: string
  coverText: string
}

const TUTORIAL_STORAGE_KEY = 'yanjing-tutorial-progress'

const tutorialCategoryOptions: Array<{ key: string; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'basic', label: '基础操作' },
  { key: 'sales', label: '销售流程' },
  { key: 'inventory', label: '库存管理' },
  { key: 'system', label: '系统配置' },
]

const tutorials: Tutorial[] = [
  { id: 'T001', title: '快速上手：首次登录与角色切换', category: 'basic', duration: '3分钟', description: '了解如何登录小程序、选择角色以及切换身份。', coverText: '登录' },
  { id: 'T002', title: '新增会员完整流程', category: 'sales', duration: '5分钟', description: '从填写会员信息到提交，演示完整的会员新增操作。', coverText: '会员' },
  { id: 'T003', title: '验光开单操作指南', category: 'sales', duration: '8分钟', description: '详细演示验光数据录入与配镜开单的完整流程。', coverText: '开单' },
  { id: 'T004', title: '收款与多支付方式', category: 'sales', duration: '4分钟', description: '微信支付、余额支付、现金支付及组合支付的操作方法。', coverText: '收款' },
  { id: 'T005', title: '取件核销操作', category: 'sales', duration: '3分钟', description: '顾客到店取件时的核销确认操作流程。', coverText: '取件' },
  { id: 'T006', title: '库存盘点操作指南', category: 'inventory', duration: '6分钟', description: '如何发起库存盘点、记录差异并完成盘点。', coverText: '盘点' },
  { id: 'T007', title: '调拨出库与入库', category: 'inventory', duration: '5分钟', description: '门店间库存调拨的出库和入库操作方法。', coverText: '调拨' },
  { id: 'T008', title: '采购管理流程', category: 'inventory', duration: '7分钟', description: '从创建采购单到入库的全流程操作。', coverText: '采购' },
  { id: 'T009', title: '系统设置与联调配置', category: 'system', duration: '5分钟', description: 'Mock/真实后端切换、API地址配置及联调自检操作。', coverText: '设置' },
  { id: 'T010', title: '打印模板配置', category: 'system', duration: '4分钟', description: '小票、配镜单、取件单打印模板的配置方法。', coverText: '打印' },
]

Component({
  data: {
    tutorials,
    filteredTutorials: [] as Tutorial[],
    categoryOptions: tutorialCategoryOptions,
    currentCategory: 'all',
    keyword: '',
    watchedIds: [] as string[],
  },
  lifetimes: {
    attached() {
      this.loadProgress()
      this.applyFilter()
    },
  },
  methods: {
    loadProgress() {
      const watchedIds: string[] = wx.getStorageSync(TUTORIAL_STORAGE_KEY) || []
      this.setData({ watchedIds })
    },
    saveProgress() {
      wx.setStorageSync(TUTORIAL_STORAGE_KEY, this.data.watchedIds)
    },
    applyFilter() {
      const { tutorials, keyword, currentCategory } = this.data
      const normalizedKeyword = keyword.trim().toLowerCase()
      const filtered = tutorials.filter((t) => {
        const matchCategory = currentCategory === 'all' || t.category === currentCategory
        const matchKeyword = !normalizedKeyword ||
          t.title.toLowerCase().includes(normalizedKeyword) ||
          t.description.toLowerCase().includes(normalizedKeyword)
        return matchCategory && matchKeyword
      })
      this.setData({ filteredTutorials: filtered })
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({ keyword: e.detail.value || '' })
    },
    onSearch() {
      this.applyFilter()
    },
    onCategoryChange(e: WechatMiniprogram.TouchEvent) {
      const category = e.currentTarget.dataset.category as string
      if (!category || category === this.data.currentCategory) return
      this.setData({ currentCategory: category })
      this.applyFilter()
    },
    playTutorial(e: WechatMiniprogram.TouchEvent) {
      const id = e.currentTarget.dataset.id as string
      const tutorial = this.data.tutorials.find((t) => t.id === id)
      if (!tutorial) return

      if (!this.data.watchedIds.includes(id)) {
        const watchedIds = [...this.data.watchedIds, id]
        this.setData({ watchedIds })
        this.saveProgress()
      }

      wx.showModal({
        title: tutorial.title,
        content: `时长：${tutorial.duration}\n\n${tutorial.description}\n\n视频播放功能开发中，敬请期待。`,
        showCancel: false,
      })
    },
  },
})
