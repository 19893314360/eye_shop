import type {
  NoticeConfig,
  PermissionConfig,
  PrintConfig,
  RateConfig,
  SettingsData,
  SystemConfig,
} from '../services/settings'
import { readBoolean, readNumber, readString } from './codec'

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

export async function getSettingsDataDriver(): Promise<SettingsData> {
  const raw = wx.getStorageSync(SETTINGS_STORAGE_KEY)
  const next = normalize(raw)
  wx.setStorageSync(SETTINGS_STORAGE_KEY, next)
  return next
}

export async function saveSettingsDataDriver(data: SettingsData): Promise<void> {
  wx.setStorageSync(SETTINGS_STORAGE_KEY, data)
}
