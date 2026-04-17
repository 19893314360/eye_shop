import { getRuntimeConfig } from '../services/runtime-config'
import {
  CreateSalesExchangePayload,
  CreateSalesReturnPayload,
  SalesExchangeRecord,
  SalesRefundChannel,
  SalesReturnRecord,
} from '../types/sales-return-exchange'
import { http } from '../utils/request'
import { readNumber, readString } from './codec'
import { buildRequestPayload } from './payload'

const SALES_RETURN_STORAGE_KEY = 'yanjing-sales-returns'
const SALES_EXCHANGE_STORAGE_KEY = 'yanjing-sales-exchanges'

function normalizeRefundChannel(value: string): SalesRefundChannel {
  if (value === '余额退回' || value === '现金退款' || value === '原路退回') {
    return value
  }
  return '原路退回'
}

function toSalesReturnRecord(raw: unknown): SalesReturnRecord {
  return {
    id: readString(raw, ['id', 'record_id']),
    orderId: readString(raw, ['orderId', 'order_id']),
    orderNo: readString(raw, ['orderNo', 'order_no']),
    memberName: readString(raw, ['memberName', 'member_name']),
    itemName: readString(raw, ['itemName', 'item_name']),
    amount: readNumber(raw, ['amount']),
    reason: readString(raw, ['reason']),
    refundChannel: normalizeRefundChannel(readString(raw, ['refundChannel', 'refund_channel'])),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
  }
}

function toSalesExchangeRecord(raw: unknown): SalesExchangeRecord {
  return {
    id: readString(raw, ['id', 'record_id']),
    orderId: readString(raw, ['orderId', 'order_id']),
    orderNo: readString(raw, ['orderNo', 'order_no']),
    memberName: readString(raw, ['memberName', 'member_name']),
    originalItem: readString(raw, ['originalItem', 'original_item']),
    newItem: readString(raw, ['newItem', 'new_item']),
    priceDiff: readNumber(raw, ['priceDiff', 'price_diff']),
    reason: readString(raw, ['reason']),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
  }
}

function toCreateSalesReturnDTO(payload: CreateSalesReturnPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'order_id', camel: 'orderId', value: payload.orderId },
    { snake: 'reason', camel: 'reason', value: payload.reason },
    { snake: 'refund_channel', camel: 'refundChannel', value: payload.refundChannel },
  ])
}

function toCreateSalesExchangeDTO(payload: CreateSalesExchangePayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'order_id', camel: 'orderId', value: payload.orderId },
    { snake: 'new_item', camel: 'newItem', value: payload.newItem },
    { snake: 'new_item_price', camel: 'newItemPrice', value: payload.newItemPrice != null ? payload.newItemPrice : '' },
    { snake: 'reason', camel: 'reason', value: payload.reason },
  ])
}

function readSalesReturnRecords(): SalesReturnRecord[] {
  const raw = wx.getStorageSync(SALES_RETURN_STORAGE_KEY)
  if (!Array.isArray(raw)) {
    wx.setStorageSync(SALES_RETURN_STORAGE_KEY, [])
    return []
  }
  return raw.map((item) => toSalesReturnRecord(item))
}

function saveSalesReturnRecords(list: SalesReturnRecord[]) {
  wx.setStorageSync(SALES_RETURN_STORAGE_KEY, list)
}

function readSalesExchangeRecords(): SalesExchangeRecord[] {
  const raw = wx.getStorageSync(SALES_EXCHANGE_STORAGE_KEY)
  if (!Array.isArray(raw)) {
    wx.setStorageSync(SALES_EXCHANGE_STORAGE_KEY, [])
    return []
  }
  return raw.map((item) => toSalesExchangeRecord(item))
}

function saveSalesExchangeRecords(list: SalesExchangeRecord[]) {
  wx.setStorageSync(SALES_EXCHANGE_STORAGE_KEY, list)
}

function sortByCreatedAtDesc<T extends { createdAt: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt)
}

export async function listSalesReturnsDriver(): Promise<SalesReturnRecord[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/sales-returns')
    if (!Array.isArray(raw)) {
      return []
    }
    return sortByCreatedAtDesc(raw.map((item) => toSalesReturnRecord(item)))
  }

  return sortByCreatedAtDesc(readSalesReturnRecords())
}

export async function createSalesReturnDriver(payload: CreateSalesReturnPayload): Promise<SalesReturnRecord> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>('/sales-returns', toCreateSalesReturnDTO(payload))
    return toSalesReturnRecord(raw)
  }

  const next: SalesReturnRecord = {
    id: `RT-${Date.now()}`,
    orderId: payload.orderId,
    orderNo: payload.orderNo,
    memberName: payload.memberName,
    itemName: payload.itemName,
    amount: payload.amount,
    reason: payload.reason,
    refundChannel: payload.refundChannel,
    createdAt: Date.now(),
  }
  const list = [next, ...readSalesReturnRecords()]
  saveSalesReturnRecords(list)
  return next
}

export async function listSalesExchangesDriver(): Promise<SalesExchangeRecord[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/sales-exchanges')
    if (!Array.isArray(raw)) {
      return []
    }
    return sortByCreatedAtDesc(raw.map((item) => toSalesExchangeRecord(item)))
  }

  return sortByCreatedAtDesc(readSalesExchangeRecords())
}

export async function createSalesExchangeDriver(payload: CreateSalesExchangePayload): Promise<SalesExchangeRecord> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>('/sales-exchanges', toCreateSalesExchangeDTO(payload))
    return toSalesExchangeRecord(raw)
  }

  const nextPrice = payload.newItemPrice != null && Number.isFinite(payload.newItemPrice) ? payload.newItemPrice : payload.amount
  const next: SalesExchangeRecord = {
    id: `EX-${Date.now()}`,
    orderId: payload.orderId,
    orderNo: payload.orderNo,
    memberName: payload.memberName,
    originalItem: payload.originalItem,
    newItem: payload.newItem,
    priceDiff: Number((nextPrice - payload.amount).toFixed(2)),
    reason: payload.reason,
    createdAt: Date.now(),
  }
  const list = [next, ...readSalesExchangeRecords()]
  saveSalesExchangeRecords(list)
  return next
}
