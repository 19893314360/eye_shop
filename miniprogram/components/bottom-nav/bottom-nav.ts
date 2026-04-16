interface TabItem {
  key: 'home' | 'workbench' | 'stats' | 'mine'
  label: string
  path: string
}

const tabList: TabItem[] = [
  { key: 'home', label: '首页', path: '/pages/home/index' },
  { key: 'workbench', label: '功能', path: '/pages/workbench/index' },
  { key: 'stats', label: '统计', path: '/pages/stats/index' },
  { key: 'mine', label: '我的', path: '/pages/mine/index' },
]

Component({
  properties: {
    current: {
      type: String,
      value: 'home',
    },
  },
  data: {
    tabList,
  },
  methods: {
    onSwitch(e: WechatMiniprogram.TouchEvent) {
      const next = e.currentTarget.dataset.key as TabItem['key']
      const current = this.data.current as TabItem['key']
      if (!next || next === current) {
        return
      }
      const target = tabList.find((item) => item.key === next)
      if (!target) {
        return
      }
      wx.redirectTo({
        url: target.path,
      })
    },
  },
})
