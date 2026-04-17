import { listAfterSaleApplies, listAfterSaleRecords, markAfterSaleFollowup, markAfterSaleRecheck } from '../../services/after-sale'
import { ensureAuthReady } from '../../services/auth-session'
import { listOrders } from '../../services/sales'
import { AfterSaleApply, AfterSaleRecord } from '../../types/after-sale'
import { SalesOrder } from '../../types/sales'
import { formatTime } from '../../utils/util'

type AfterSaleTab = 'followup' | 'recheck' | 'history'

interface AfterSaleItem {
  itemKey: string
  sortAt: number
  orderId: string
  orderNo: string
  memberName: string
  itemName: string
  amount: number
  createdText: string
  updatedText: string
  canFollowup: boolean
  canRecheck: boolean
  applyId?: string
  applyType?: string
  applyReason?: string
  applyStatus?: string
  isCustomerApply?: boolean
}

const tabOptions: Array<{ key: AfterSaleTab; label: string }> = [
  { key: 'followup', label: '待回访' },
  { key: 'recheck', label: '待复查' },
  { key: 'history', label: '已处理' },
]

Component({
  data: {
    loading: false,
    actingOrderId: '',
    role: 'sales' as UserRole,
    tabOptions,
    currentTab: 'followup' as AfterSaleTab,
    keyword: '',
    list: [] as AfterSaleItem[],
    orderIdFromRoute: '',
  },
  lifetimes: {
    attached() {
      this.applyRouteParams()
      this.refreshList()
    },
  },
  pageLifetimes: {
    show() {
      this.applyRouteParams()
      this.refreshList()
    },
  },
  methods: {
    getRouteOptions(): Record<string, string> {
      const pages = getCurrentPages()
      const current = pages[pages.length - 1] as unknown as { options?: Record<string, string> }
      return (current && current.options) || {}
    },
    applyRouteParams() {
      const options = this.getRouteOptions()
      const tab = options.tab
      const orderId = options.orderId || ''
      if (tab === 'followup' || tab === 'recheck' || tab === 'history') {
        this.setData({
          currentTab: tab,
          orderIdFromRoute: orderId,
        })
        return
      }
      this.setData({
        orderIdFromRoute: orderId,
      })
    },
    toRecordMap(list: AfterSaleRecord[]): Record<string, AfterSaleRecord> {
      return list.reduce<Record<string, AfterSaleRecord>>((result, item) => {
        if (item.orderId) {
          result[item.orderId] = item
        }
        return result
      }, {})
    },
    async ensureAccess(): Promise<boolean> {
      try {
        const state = await ensureAuthReady()
        if (state.role === 'customer') {
          this.setData({
            role: state.role,
            tabOptions: tabOptions.filter((item) => item.key === 'history'),
            currentTab: 'history',
          })
          return true
        }
        this.setData({
          role: state.role,
          tabOptions,
        })
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : '鉴权失败'
        wx.showToast({ title: message, icon: 'none' })
        return false
      }
    },
    mapToAfterSaleItems(
      orders: SalesOrder[],
      recordMap: Record<string, AfterSaleRecord>,
      currentTab: AfterSaleTab,
      keyword: string,
      orderIdFromRoute: string,
      role: UserRole
    ): AfterSaleItem[] {
      const normalizedKeyword = keyword.trim()
      if (role === 'customer') {
        return []
      }
      const base = orders
        .filter((order) => order.status === 'completed')
        .map((order) => {
          const record = recordMap[order.id] || { followed: false, rechecked: false, updatedAt: 0 }
          return {
            order,
            record,
          }
        })

      const filteredByTab = base.filter(({ record, order }) => {
        if (orderIdFromRoute && order.id !== orderIdFromRoute) {
          return false
        }
        if (currentTab === 'followup') {
          return !record.followed
        }
        if (currentTab === 'recheck') {
          return record.followed && !record.rechecked
        }
        return record.followed || record.rechecked
      })

      const filteredByKeyword = filteredByTab.filter(({ order }) => {
        if (!normalizedKeyword) {
          return true
        }
        return (
          order.orderNo.includes(normalizedKeyword) ||
          order.memberName.includes(normalizedKeyword) ||
          order.itemName.includes(normalizedKeyword)
        )
      })

      return filteredByKeyword
        .sort((a, b) => b.order.createdAt - a.order.createdAt)
        .map(({ order, record }) => ({
          itemKey: `order:${order.id}`,
          sortAt: order.createdAt,
          orderId: order.id,
          orderNo: order.orderNo,
          memberName: order.memberName,
          itemName: order.itemName,
          amount: order.amount,
          createdText: formatTime(new Date(order.createdAt)),
          updatedText: record.updatedAt ? formatTime(new Date(record.updatedAt)) : '--',
          canFollowup: !record.followed,
          canRecheck: record.followed && !record.rechecked,
        }))
    },
    mapCustomerAppliesToItems(
      applies: AfterSaleApply[],
      recordMap: Record<string, AfterSaleRecord>,
      currentTab: AfterSaleTab,
      keyword: string,
      role: UserRole
    ): AfterSaleItem[] {
      const normalizedKeyword = keyword.trim()
      const typeLabels: Record<string, string> = {
        return: '退货',
        exchange: '换货',
        repair: '维修',
        refund: '退款',
      }

      const filtered = applies.filter((apply) => {
        if (role === 'customer') {
          return true
        }
        if (currentTab === 'followup') {
          return apply.status === 'pending'
        }
        if (currentTab === 'recheck') {
          const record = recordMap[apply.orderId]
          return apply.status === 'pending' && record && record.followed === true && !record.rechecked
        }
        // history: show pending or processed
        return true
      })

      const filteredByKeyword = filtered.filter((apply) => {
        if (!normalizedKeyword) {
          return true
        }
        return (
          apply.id.includes(normalizedKeyword) ||
          apply.orderId.includes(normalizedKeyword) ||
          apply.applicant.includes(normalizedKeyword) ||
          apply.reason.includes(normalizedKeyword)
        )
      })

      return filteredByKeyword
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((apply) => {
          const record = recordMap[apply.orderId] || { followed: false, rechecked: false, updatedAt: 0 }
          const typeLabel = typeLabels[apply.type] || apply.type
          return {
            itemKey: `apply:${apply.id}`,
            sortAt: apply.createdAt,
            orderId: apply.orderId,
            orderNo: apply.id,
            memberName: apply.applicant,
            itemName: `${typeLabel}申请`,
            amount: 0,
            createdText: formatTime(new Date(apply.createdAt)),
            updatedText: record.updatedAt ? formatTime(new Date(record.updatedAt)) : '--',
            canFollowup: role !== 'customer' && apply.status === 'pending' && !record.followed,
            canRecheck: role !== 'customer' && apply.status === 'pending' && record.followed && !record.rechecked,
            applyId: apply.id,
            applyType: typeLabel,
            applyReason: apply.reason,
            applyStatus: apply.status,
            isCustomerApply: true,
          }
        })
    },
    async refreshList() {
      const allowed = await this.ensureAccess()
      if (!allowed) {
        return
      }
      this.setData({ loading: true })
      try {
        const [orders, records, applies] = await Promise.all([
          listOrders({
            status: 'completed',
            keyword: this.data.keyword.trim(),
          }),
          listAfterSaleRecords(),
          listAfterSaleApplies(),
        ])
        const recordMap = this.toRecordMap(records)

        // Merge: order-based items + customer application items
        const orderItems = this.mapToAfterSaleItems(
          orders,
          recordMap,
          this.data.currentTab,
          this.data.keyword,
          this.data.orderIdFromRoute,
          this.data.role
        )
        const applyItems = this.mapCustomerAppliesToItems(
          applies,
          recordMap,
          this.data.currentTab,
          this.data.keyword,
          this.data.role
        )

        // Combine and sort by creation time
        const allItems = [...orderItems, ...applyItems].sort((a, b) => b.sortAt - a.sortAt)
        this.setData({ list: allItems })
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载售后列表失败'
        wx.showToast({
          title: message,
          icon: 'none',
        })
      } finally {
        this.setData({ loading: false })
      }
    },
    onTabChange(e: WechatMiniprogram.TouchEvent) {
      const tab = e.currentTarget.dataset.tab as AfterSaleTab
      if (!tab || tab === this.data.currentTab) {
        return
      }
      this.setData({
        currentTab: tab,
        orderIdFromRoute: '',
      })
      this.refreshList()
    },
    onKeywordInput(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
      this.setData({
        keyword: e.detail.value || '',
      })
    },
    onSearch() {
      this.refreshList()
    },
    async markFollowupDone(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId || this.data.actingOrderId) {
        return
      }
      this.setData({ actingOrderId: orderId })
      try {
        await markAfterSaleFollowup(orderId)
        wx.showToast({
          title: '回访已登记',
          icon: 'success',
        })
        await this.refreshList()
      } catch (error) {
        const message = error instanceof Error ? error.message : '登记回访失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ actingOrderId: '' })
      }
    },
    async markRecheckDone(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId || this.data.actingOrderId) {
        return
      }
      this.setData({ actingOrderId: orderId })
      try {
        await markAfterSaleRecheck(orderId)
        wx.showToast({
          title: '复查已处理',
          icon: 'success',
        })
        await this.refreshList()
      } catch (error) {
        const message = error instanceof Error ? error.message : '处理复查失败'
        wx.showToast({ title: message, icon: 'none' })
      } finally {
        this.setData({ actingOrderId: '' })
      }
    },
    goOrderDetail(e: WechatMiniprogram.TouchEvent) {
      const orderId = e.currentTarget.dataset.id as string
      if (!orderId) {
        return
      }
      wx.navigateTo({
        url: `/pages/order-detail/index?orderId=${orderId}`,
      })
    },
  },
})
