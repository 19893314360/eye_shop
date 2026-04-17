import { getRuntimeConfig } from '../services/runtime-config'
import { http } from '../utils/request'
import { readNumber, readString } from './codec'
import { buildRequestPayload } from './payload'
import { PurchaseRecord, PurchaseType } from '../types/purchase'

export interface PurchasePayload {
  type: PurchaseType
  itemName: string
  sku: string
  qty: number
  unitCost: number
  supplier: string
  operator: string
  note: string
}

const PURCHASE_STORAGE_KEY = 'yanjing-purchase-records'

const defaultRecords: PurchaseRecord[] = [
  {
    id: 'PO-001',
    type: 'order',
    itemName: '超薄镜片 1.67',
    sku: 'LENS-001',
    qty: 50,
    unitCost: 128,
    supplier: '华光供应链',
    operator: '徐店长',
    note: '',
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'PO-002',
    type: 'inbound',
    itemName: '金属镜架 M10',
    sku: 'FRAME-010',
    qty: 20,
    unitCost: 62,
    supplier: '徐记镜架仓',
    operator: '徐明',
    note: '',
    createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'PO-003',
    type: 'return',
    itemName: '防蓝光镜片 1.60',
    sku: 'LENS-022',
    qty: 4,
    unitCost: 78,
    supplier: '华光供应链',
    operator: '周宁',
    note: '批次边缘瑕疵',
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
  },
]

function normalizeType(value: string): PurchaseType {
  if (value === 'order' || value === 'inbound' || value === 'return' || value === 'frame') {
    return value
  }
  return 'order'
}

function toPurchaseRecord(raw: unknown): PurchaseRecord {
  return {
    id: readString(raw, ['id', 'record_id']),
    type: normalizeType(readString(raw, ['type', 'record_type'])),
    itemName: readString(raw, ['itemName', 'item_name']),
    sku: readString(raw, ['sku']),
    qty: readNumber(raw, ['qty', 'quantity']),
    unitCost: readNumber(raw, ['unitCost', 'unit_cost']),
    supplier: readString(raw, ['supplier']),
    operator: readString(raw, ['operator']),
    note: readString(raw, ['note', 'remark']),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
  }
}

function toCreatePurchaseDTO(payload: PurchasePayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'record_type', camel: 'type', value: payload.type },
    { snake: 'item_name', camel: 'itemName', value: payload.itemName },
    { snake: 'sku', camel: 'sku', value: payload.sku },
    { snake: 'qty', camel: 'qty', value: payload.qty },
    { snake: 'unit_cost', camel: 'unitCost', value: payload.unitCost },
    { snake: 'supplier', camel: 'supplier', value: payload.supplier },
    { snake: 'operator', camel: 'operator', value: payload.operator },
    { snake: 'note', camel: 'note', value: payload.note },
  ])
}

function readRecords(): PurchaseRecord[] {
  const raw = wx.getStorageSync(PURCHASE_STORAGE_KEY)
  if (!Array.isArray(raw)) {
    wx.setStorageSync(PURCHASE_STORAGE_KEY, defaultRecords)
    return [...defaultRecords]
  }
  return raw.map((item) => toPurchaseRecord(item))
}

function saveRecords(list: PurchaseRecord[]) {
  wx.setStorageSync(PURCHASE_STORAGE_KEY, list)
}

export async function listPurchaseRecordsDriver(): Promise<PurchaseRecord[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/purchase-records')
    if (!Array.isArray(raw)) {
      return []
    }
    return raw
      .map((item) => toPurchaseRecord(item))
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  return readRecords().sort((a, b) => b.createdAt - a.createdAt)
}

export async function createPurchaseRecordDriver(payload: PurchasePayload): Promise<PurchaseRecord> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>('/purchase-records', toCreatePurchaseDTO(payload))
    return toPurchaseRecord(raw)
  }

  const list = readRecords()
  const next: PurchaseRecord = {
    id: `PO-${Date.now()}`,
    type: payload.type,
    itemName: payload.itemName,
    sku: payload.sku,
    qty: payload.qty,
    unitCost: payload.unitCost,
    supplier: payload.supplier,
    operator: payload.operator,
    note: payload.note,
    createdAt: Date.now(),
  }
  list.unshift(next)
  saveRecords(list)
  return next
}
