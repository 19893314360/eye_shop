import { getRuntimeConfig } from '../services/runtime-config'
import { http } from '../utils/request'
import type {
  NoticeConfig,
  PermissionConfig,
  PrintConfig,
  RateConfig,
  SettingsData,
  SystemConfig,
} from '../services/settings'
import { readBoolean, readNumber, readString } from './codec'
import { buildRequestPayload } from './payload'

const SETTINGS_STORAGE_KEY = 'yanjing-settings'

const defaultSettings: SettingsData = {
  system: {
    notifyTakeaway: true,
    notifyRecheck: true,
    notifyTraining: true,
  },
  notice: {
    content: '点击查看系统更新公告（2026-03-12）',
    updatedAt: Date.now(),
  },
  print: {
    printTicket: true,
    printOrder: true,
    printDelivery: false,
    ticketContent: '店铺名\n日期：{{date}}\n商品：{{itemName}}\n金额：￥{{amount}}\n感谢惠顾！',
    orderContent: '配镜单\n客户：{{customerName}}\n右眼：{{rightEye}}\n左眼：{{leftEye}}\nPD：{{pd}}',
    deliveryContent: '取件通知\n客户：{{customerName}}\n订单号：{{orderNo}}\n商品：{{itemName}}\n请凭此单到店取件',
  },
  rate: {
    merchantNo: 'MCH_XJ001',
    rate: '0.3%',
    autoSettle: true,
  },
  permission: {
    salesCanPurchase: true,
    salesCanRateView: true,
    customerCanAfterSale: true,
  },
}

function toSystemConfig(raw: unknown): SystemConfig {
  return {
    notifyTakeaway: readBoolean(raw, ['notifyTakeaway', 'notify_takeaway'], true),
    notifyRecheck: readBoolean(raw, ['notifyRecheck', 'notify_recheck'], true),
    notifyTraining: readBoolean(raw, ['notifyTraining', 'notify_training'], true),
  }
}

function toNoticeConfig(raw: unknown): NoticeConfig {
  return {
    content: readString(raw, ['content', 'notice_content'], defaultSettings.notice.content),
    updatedAt: readNumber(raw, ['updatedAt', 'updated_at'], Date.now()),
  }
}

function toPrintConfig(raw: unknown): PrintConfig {
  return {
    printTicket: readBoolean(raw, ['printTicket', 'print_ticket'], true),
    printOrder: readBoolean(raw, ['printOrder', 'print_order'], true),
    printDelivery: readBoolean(raw, ['printDelivery', 'print_delivery'], false),
    ticketContent: readString(raw, ['ticketContent', 'ticket_content'], defaultSettings.print.ticketContent || ''),
    orderContent: readString(raw, ['orderContent', 'order_content'], defaultSettings.print.orderContent || ''),
    deliveryContent: readString(raw, ['deliveryContent', 'delivery_content'], defaultSettings.print.deliveryContent || ''),
  }
}

function toRateConfig(raw: unknown): RateConfig {
  return {
    merchantNo: readString(raw, ['merchantNo', 'merchant_no'], defaultSettings.rate.merchantNo),
    rate: readString(raw, ['rate'], defaultSettings.rate.rate),
    autoSettle: readBoolean(raw, ['autoSettle', 'auto_settle'], true),
  }
}

function toPermissionConfig(raw: unknown): PermissionConfig {
  return {
    salesCanPurchase: readBoolean(raw, ['salesCanPurchase', 'sales_can_purchase'], true),
    salesCanRateView: readBoolean(raw, ['salesCanRateView', 'sales_can_rate_view'], true),
    customerCanAfterSale: readBoolean(raw, ['customerCanAfterSale', 'customer_can_after_sale'], true),
  }
}

function normalize(raw: unknown): SettingsData {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultSettings }
  }
  const source = raw as Record<string, unknown>
  return {
    system: toSystemConfig(source.system),
    notice: toNoticeConfig(source.notice),
    print: toPrintConfig(source.print),
    rate: toRateConfig(source.rate),
    permission: toPermissionConfig(source.permission),
  }
}

function toSystemDTO(config: SystemConfig): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'notify_takeaway', camel: 'notifyTakeaway', value: config.notifyTakeaway },
    { snake: 'notify_recheck', camel: 'notifyRecheck', value: config.notifyRecheck },
    { snake: 'notify_training', camel: 'notifyTraining', value: config.notifyTraining },
  ])
}

function toNoticeDTO(config: NoticeConfig): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'content', camel: 'content', value: config.content },
    { snake: 'updated_at', camel: 'updatedAt', value: config.updatedAt },
  ])
}

function toPrintDTO(config: PrintConfig): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'print_ticket', camel: 'printTicket', value: config.printTicket },
    { snake: 'print_order', camel: 'printOrder', value: config.printOrder },
    { snake: 'print_delivery', camel: 'printDelivery', value: config.printDelivery },
    { snake: 'ticket_content', camel: 'ticketContent', value: config.ticketContent || '' },
    { snake: 'order_content', camel: 'orderContent', value: config.orderContent || '' },
    { snake: 'delivery_content', camel: 'deliveryContent', value: config.deliveryContent || '' },
  ])
}

function toRateDTO(config: RateConfig): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'merchant_no', camel: 'merchantNo', value: config.merchantNo },
    { snake: 'rate', camel: 'rate', value: config.rate },
    { snake: 'auto_settle', camel: 'autoSettle', value: config.autoSettle },
  ])
}

function toPermissionDTO(config: PermissionConfig): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'sales_can_purchase', camel: 'salesCanPurchase', value: config.salesCanPurchase },
    { snake: 'sales_can_rate_view', camel: 'salesCanRateView', value: config.salesCanRateView },
    { snake: 'customer_can_after_sale', camel: 'customerCanAfterSale', value: config.customerCanAfterSale },
  ])
}

function toSettingsDTO(data: SettingsData): Record<string, unknown> {
  return {
    system: toSystemDTO(data.system),
    notice: toNoticeDTO(data.notice),
    print: toPrintDTO(data.print),
    rate: toRateDTO(data.rate),
    permission: toPermissionDTO(data.permission),
  }
}

export async function getSettingsDataDriver(): Promise<SettingsData> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown>('/settings')
    return normalize(raw)
  }

  const raw = wx.getStorageSync(SETTINGS_STORAGE_KEY)
  const next = normalize(raw)
  wx.setStorageSync(SETTINGS_STORAGE_KEY, next)
  return next
}

export async function saveSettingsDataDriver(data: SettingsData): Promise<void> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    await http.put('/settings', toSettingsDTO(data))
    return
  }

  wx.setStorageSync(SETTINGS_STORAGE_KEY, data)
}
