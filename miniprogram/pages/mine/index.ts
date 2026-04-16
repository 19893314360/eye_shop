import { ensureAuthReady } from '../../services/auth-session'
import { MineSection, getMineSections } from '../../utils/mock-data'
import { getModuleRoute } from '../../utils/module-route'
import { ROLE_LABEL } from '../../utils/role'

function setPageChrome() {
  wx.setNavigationBarTitle({ title: '个人中心' })
  wx.setNavigationBarColor({
    frontColor: '#ffffff',
    backgroundColor: '#f57c00',
    animation: {
      duration: 0,
      timingFunc: 'linear',
    },
  })
}

Component({
  data: {
    role: 'sales' as UserRole,
    roleLabel: ROLE_LABEL.sales,
    userName: '',
    storeName: '',
    sections: [] as MineSection[],
    loading: true,
  },
  lifetimes: {
    attached() {
      this.refreshPage()
    },
  },
  pageLifetimes: {
    show() {
      this.refreshPage()
    },
  },
  methods: {
    async refreshPage() {
      this.setData({ loading: true })

      try {
        const state = await ensureAuthReady()
        setPageChrome()

        this.setData({
          role: state.role,
          roleLabel: ROLE_LABEL[state.role],
          userName: state.userName,
          storeName: state.storeName,
          sections: getMineSections(state.role),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '个人中心初始化失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },

    onTapMenu(e: WechatMiniprogram.TouchEvent) {
      const name = e.currentTarget.dataset.name as string
      const route = getModuleRoute(name)

      if (route) {
        wx.navigateTo({ url: route })
        return
      }

      wx.showToast({
        title: `${name} 暂未接入页面`,
        icon: 'none',
      })
    },

    switchRole() {
      wx.navigateTo({
        url: '/pages/entry/index',
      })
    },
  },
})
