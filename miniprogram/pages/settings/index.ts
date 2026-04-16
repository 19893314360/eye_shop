import { ensureAuthReady, getCurrentAuthState, switchRole } from '../../services/auth-session'
import { createMember } from '../../services/member'
import { createOrder, deliverOrder, payOrder } from '../../services/sales'
import { listMembers } from '../../services/member'
import { listOrders } from '../../services/sales'
import { getRuntimeConfig, RuntimeConfig, saveRuntimeConfig } from '../../services/runtime-config'
import { getSettingsData, saveSettingsData, SettingsData } from '../../services/settings'
import { formatTime } from '../../utils/util'
import { AppRequestError } from '../../types/common'

type SettingsTab = 'system' | 'notice' | 'print' | 'rate' | 'permission'

const tabOptions: Array<{ key: SettingsTab; label: string }> = [
  { key: 'system', label: '系统设置' },
  { key: 'notice', label: '公告管理' },
  { key: 'print', label: '打印模板' },
  { key: 'rate', label: '费率配置' },
  { key: 'permission', label: '权限管理' },
]

function defaultSettings(): SettingsData {
  return {
    system: { notifyTakeaway: true, notifyRecheck: true, notifyTraining: true },
    notice: { content: '', updatedAt: Date.now() },
    print: { printTicket: true, printOrder: true, printDelivery: false },
    rate: { merchantNo: '', rate: '', autoSettle: true },
    permission: { salesCanPurchase: true, salesCanRateView: true, customerCanAfterSale: true },
  }
}

Component({
  data: {
    loading: false,
    saving: false,
    role: 'sales' as UserRole,
    canManage: false,
    checkingIntegration: false,
    checkingMainline: false,
    integrationResult: '',
    mainlineResult: '',
    mainlineLogs: [] as string[],
    currentTab: 'system' as SettingsTab,
    tabOptions,
    settings: defaultSettings(),
    runtimeConfig: { useMockApi: true, apiBaseUrl: '', requestKeyStyle: 'both' } as RuntimeConfig,
    requestKeyStyleOptions: [
      { label: 'snake_case', value: 'snake' },
      { label: 'camelCase', value: 'camel' },
      { label: '双写兼容', value: 'both' },
    ] as Array<{ label: string; value: RuntimeConfig['requestKeyStyle'] }>,
    requestKeyStyleIndex: 2,
    noticeUpdatedText: '--',
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
    formatError(error: unknown): string {
      if (error instanceof AppRequestError) {
        const parts = [`${error.message}`]
        if (error.code) {
          parts.push(`code=${error.code}`)
        }
        if (error.statusCode) {
          parts.push(`status=${error.statusCode}`)
        }
        if (error.requestId) {
          parts.push(`req=${error.requestId}`)
        }
        if (error.url) {
          parts.push(`url=${error.url}`)
        }
        return parts.join(' | ')
      }
      if (error instanceof Error) {
        return error.message
      }
      return '未知错误'
    },
    appendMainlineLog(text: string) {
      const next = [...this.data.mainlineLogs, text]
      this.setData({
        mainlineLogs: next,
      })
    },
    async ensureSessionMatchesRuntime(logPrefix = '') {
      const runtime = this.data.runtimeConfig
      const state = getCurrentAuthState()
      const token = state.token || ''
      const isMockToken = token.startsWith('mock-token-')

      if (runtime.useMockApi && token && !isMockToken) {
        if (logPrefix) {
          this.appendMainlineLog(`${logPrefix}检测到真实 token，已刷新为 Mock 登录态`)
        }
        await switchRole(state.role)
        return
      }
      if (!runtime.useMockApi && isMockToken) {
        if (logPrefix) {
          this.appendMainlineLog(`${logPrefix}检测到 Mock token，已刷新为真实登录态`)
        }
        await switchRole(state.role)
      }
    },
    getRouteOptions(): Record<string, string> {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> }
      return (current && current.options) || {}
    },
    applyRouteParams() {
      const tab = this.getRouteOptions().tab
      if (tab === 'system' || tab === 'notice' || tab === 'print' || tab === 'rate' || tab === 'permission') {
        this.setData({
          currentTab: tab,
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
          canManage: auth.role === 'manager',
        })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    async refreshData() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const settings = await getSettingsData()
        const runtimeConfig = getRuntimeConfig()
        const requestKeyStyleIndex = this.data.requestKeyStyleOptions.findIndex(
          (item) => item.value === runtimeConfig.requestKeyStyle
        )
        this.setData({
          settings,
          runtimeConfig,
          requestKeyStyleIndex: requestKeyStyleIndex >= 0 ? requestKeyStyleIndex : 2,
          noticeUpdatedText: formatTime(new Date(settings.notice.updatedAt)),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载配置失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as SettingsTab
      if (!tab || tab === this.data.currentTab) {
        return
      }
      this.setData({
        currentTab: tab,
      })
    },
    onNoticeInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        'settings.notice.content': e.detail.value || '',
      })
    },
    onRateInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      const field = e.currentTarget.dataset.field as 'merchantNo' | 'rate'
      this.setData({
        [`settings.rate.${field}`]: e.detail.value || '',
      })
    },
    onRuntimeInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      if (!this.assertManagePermission()) {
        return
      }
      const field = e.currentTarget.dataset.field as 'apiBaseUrl'
      this.setData({
        [`runtimeConfig.${field}`]: (e.detail.value || '').trim(),
      })
    },
    onRuntimeToggle(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
      if (!this.assertManagePermission()) {
        return
      }
      this.setData({
        'runtimeConfig.useMockApi': e.detail.value,
      })
    },
    onRequestKeyStyleChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      if (!this.assertManagePermission()) {
        return
      }
      const idx = Number(e.detail.value || 0)
      const option = this.data.requestKeyStyleOptions[idx]
      if (!option) {
        return
      }
      this.setData({
        requestKeyStyleIndex: idx,
        'runtimeConfig.requestKeyStyle': option.value,
      })
    },
    toggleBoolean(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
      const path = e.currentTarget.dataset.path as string
      if (!path) {
        return
      }
      this.setData({
        [path]: e.detail.value,
      })
    },
    assertManagePermission(): boolean {
      if (this.data.canManage) {
        return true
      }
      wx.showToast({
        title: '仅管理者可编辑此项',
        icon: 'none',
      })
      return false
    },
    onProtectedToggle(e: WechatMiniprogram.CustomEvent<{ value: boolean }>) {
      if (!this.assertManagePermission()) {
        return
      }
      this.toggleBoolean(e)
    },
    onProtectedInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      if (!this.assertManagePermission()) {
        return
      }
      this.onRateInput(e)
    },
    persistRuntimeConfig(): RuntimeConfig {
      const runtimeConfig = saveRuntimeConfig(this.data.runtimeConfig)
      this.setData({ runtimeConfig })
      return runtimeConfig
    },
    async save() {
      if (this.data.saving) {
        return
      }
      if (this.data.currentTab === 'rate' || this.data.currentTab === 'permission') {
        if (!this.assertManagePermission()) {
          return
        }
      }
      this.setData({ saving: true })
      try {
        const next = {
          ...this.data.settings,
          notice: {
            ...this.data.settings.notice,
            updatedAt: this.data.currentTab === 'notice' ? Date.now() : this.data.settings.notice.updatedAt,
          },
        }
        await saveSettingsData(next)
        this.persistRuntimeConfig()
        this.setData({
          settings: next,
          noticeUpdatedText: formatTime(new Date(next.notice.updatedAt)),
        })
        wx.showToast({
          title: '设置已保存',
          icon: 'success',
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : '保存失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ saving: false })
      }
    },
    async runIntegrationCheck() {
      if (this.data.checkingIntegration) {
        return
      }
      this.setData({
        checkingIntegration: true,
        integrationResult: '',
      })
      try {
        const runtimeConfig = this.persistRuntimeConfig()
        await this.ensureSessionMatchesRuntime()
        const auth = await ensureAuthReady()
        const [members, orders] = await Promise.all([
          listMembers({ keyword: '' }),
          listOrders(),
        ])
        const mode = runtimeConfig.useMockApi ? 'Mock' : 'Real'
        const style = runtimeConfig.requestKeyStyle
        const summary = `模式:${mode} 字段:${style} 用户:${auth.userName} 会员:${members.length} 订单:${orders.length}`
        this.setData({
          integrationResult: summary,
        })
        wx.showToast({
          title: '联调自检通过',
          icon: 'success',
        })
      } catch (error) {
        const message = this.formatError(error)
        this.setData({
          integrationResult: `失败: ${message}`,
        })
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ checkingIntegration: false })
      }
    },
    async runMainlineCheck() {
      if (this.data.checkingMainline) {
        return
      }
      if (!this.assertManagePermission()) {
        return
      }
      this.setData({
        checkingMainline: true,
        mainlineResult: '',
        mainlineLogs: [],
      })
      try {
        const runtimeConfig = this.persistRuntimeConfig()
        const mode = runtimeConfig.useMockApi ? 'Mock' : 'Real'
        this.appendMainlineLog(`开始联调，模式: ${mode}`)
        await this.ensureSessionMatchesRuntime('[准备]')

        const auth = await ensureAuthReady()
        this.appendMainlineLog(`1/5 登录通过，用户: ${auth.userName}`)

        const uniq = `${Date.now()}`.slice(-8)
        const mobile = `199${uniq}`
        const member = await createMember({
          name: `联调用户${uniq.slice(-4)}`,
          mobile,
          gender: 'unknown',
          birthday: '',
          note: '主链路联调自动创建',
        })
        this.appendMainlineLog(`2/5 新增会员成功: ${member.id}`)

        const order = await createOrder({
          memberId: member.id,
          orderType: 'normal',
          itemName: '联调镜片套餐',
          quantity: 1,
          unitPrice: 1,
          note: '主链路联调自动创建',
        })
        this.appendMainlineLog(`3/5 开单成功: ${order.orderNo}`)

        const paid = await payOrder(order.id, {
          payChannel: 'cash',
          paidAmount: order.amount,
        })
        this.appendMainlineLog(`4/5 收款成功: 状态=${paid.status}`)

        const delivered = await deliverOrder(order.id)
        this.appendMainlineLog(`5/5 取件成功: 状态=${delivered.status}`)

        const result = `主链路通过: member=${member.id}, order=${order.orderNo}`
        this.setData({
          mainlineResult: result,
        })
        wx.showToast({
          title: '主链路联调通过',
          icon: 'success',
        })
      } catch (error) {
        const message = this.formatError(error)
        this.appendMainlineLog(`失败: ${message}`)
        this.setData({
          mainlineResult: `失败: ${message}`,
        })
        wx.showToast({
          title: '主链路联调失败',
          icon: 'none',
        })
      } finally {
        this.setData({
          checkingMainline: false,
        })
      }
    },
  },
})
