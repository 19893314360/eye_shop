import { getSettingsDataDriver, saveSettingsDataDriver } from '../drivers/settings-driver'

export interface SystemConfig {
  notifyTakeaway: boolean
  notifyRecheck: boolean
  notifyTraining: boolean
}

export interface NoticeConfig {
  content: string
  updatedAt: number
}

export interface PrintConfig {
  printTicket: boolean
  printOrder: boolean
  printDelivery: boolean
}

export interface RateConfig {
  merchantNo: string
  rate: string
  autoSettle: boolean
}

export interface PermissionConfig {
  salesCanPurchase: boolean
  salesCanRateView: boolean
  customerCanAfterSale: boolean
}

export interface SettingsData {
  system: SystemConfig
  notice: NoticeConfig
  print: PrintConfig
  rate: RateConfig
  permission: PermissionConfig
}

export function getSettingsData(): Promise<SettingsData> {
  return getSettingsDataDriver()
}

export function saveSettingsData(data: SettingsData): Promise<void> {
  return saveSettingsDataDriver(data)
}
