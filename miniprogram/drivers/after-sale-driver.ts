import { getRuntimeConfig } from '../services/runtime-config'
import { getAppState } from '../store/app-state'
import { AfterSaleApply, AfterSaleApplyStatus, AfterSaleRecord, AfterSaleType, CreateAfterSaleApplyPayload } from '../types/after-sale'
import { http } from '../utils/request'
import { readBoolean, readNumber, readString, readStringArray } from './codec'
import { buildRequestPayload } from './payload'

const RECORD_STORAGE_KEY = 'yanjing-after-sale-records'
const APPLY_STORAGE_KEY = 'yanjing-after-sale-applies'

function normalizeAfterSaleType(value: string): AfterSaleType {
  if (value === 'exchange' || value === 'repair' || value === 'refund' || value === 'return') {
    return value
  }
  return 'return'
}

function normalizeApplyStatus(value: string): AfterSaleApplyStatus {
  if (value === 'followed_up' || value === 'completed') {
    return value
  }
  return 'pending'
}

function toAfterSaleRecord(raw: unknown): AfterSaleRecord {
  return {
    orderId: readString(raw, ['orderId', 'order_id']),
    followed: readBoolean(raw, ['followed'], false),
    rechecked: readBoolean(raw, ['rechecked'], false),
    updatedAt: readNumber(raw, ['updatedAt', 'updated_at']),
  }
}

function toAfterSaleApply(raw: unknown): AfterSaleApply {
  return {
    id: readString(raw, ['id', 'apply_id']),
    orderId: readString(raw, ['orderId', 'order_id']),
    type: normalizeAfterSaleType(readString(raw, ['type', 'apply_type'])),
    reason: readString(raw, ['reason']),
    remark: readString(raw, ['remark', 'note']),
    phone: readString(raw, ['phone', 'mobile']),
    images: readStringArray(raw, ['images', 'image_list']),
    status: normalizeApplyStatus(readString(raw, ['status'])),
    applicant: readString(raw, ['applicant', 'customerName', 'customer_name']),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
  }
}

function toCreateAfterSaleApplyDTO(payload: CreateAfterSaleApplyPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'order_id', camel: 'orderId', value: payload.orderId },
    { snake: 'apply_type', camel: 'type', value: payload.type },
    { snake: 'reason', camel: 'reason', value: payload.reason },
    { snake: 'remark', camel: 'remark', value: payload.remark },
    { snake: 'phone', camel: 'phone', value: payload.phone },
    { snake: 'image_list', camel: 'images', value: payload.images },
  ])
}

function readRecordMap(): Record<string, AfterSaleRecord> {
  const raw = wx.getStorageSync(RECORD_STORAGE_KEY)
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  const result: Record<string, AfterSaleRecord> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    result[key] = toAfterSaleRecord({
      orderId: key,
      ...(value && typeof value === 'object' ? value : {}),
    })
  }
  return result
}

function saveRecordMap(map: Record<string, AfterSaleRecord>) {
  wx.setStorageSync(RECORD_STORAGE_KEY, map)
}

function readApplyList(): AfterSaleApply[] {
  const raw = wx.getStorageSync(APPLY_STORAGE_KEY)
  if (!Array.isArray(raw)) {
    wx.setStorageSync(APPLY_STORAGE_KEY, [])
    return []
  }
  return raw.map((item) => toAfterSaleApply(item))
}

function saveApplyList(list: AfterSaleApply[]) {
  wx.setStorageSync(APPLY_STORAGE_KEY, list)
}

function filterAppliesForViewer(list: AfterSaleApply[]): AfterSaleApply[] {
  const state = getAppState()
  if (state.role !== 'customer') {
    return list
  }
  const mobile = state.mobile.trim()
  const userName = state.userName.trim()
  return list.filter((item) => {
    if (mobile) {
      return item.phone === mobile
    }
    return userName ? item.applicant === userName : false
  })
}

export async function listAfterSaleRecordsDriver(): Promise<AfterSaleRecord[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/after-sale-records')
    if (!Array.isArray(raw)) {
      return []
    }
    return raw.map((item) => toAfterSaleRecord(item))
  }

  return Object.values(readRecordMap()).filter((item) => item.orderId)
}

export async function listAfterSaleAppliesDriver(): Promise<AfterSaleApply[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/after-sale-applies')
    if (!Array.isArray(raw)) {
      return []
    }
    return raw.map((item) => toAfterSaleApply(item)).sort((a, b) => b.createdAt - a.createdAt)
  }

  return filterAppliesForViewer(readApplyList()).sort((a, b) => b.createdAt - a.createdAt)
}

export async function createAfterSaleApplyDriver(payload: CreateAfterSaleApplyPayload): Promise<AfterSaleApply> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>('/after-sale-applies', toCreateAfterSaleApplyDTO(payload))
    return toAfterSaleApply(raw)
  }

  const state = getAppState()
  const next: AfterSaleApply = {
    id: `AS-${Date.now()}`,
    orderId: payload.orderId,
    type: payload.type,
    reason: payload.reason,
    remark: payload.remark,
    phone: state.role === 'customer' && state.mobile ? state.mobile : payload.phone,
    images: payload.images.slice(0, 3),
    status: 'pending',
    applicant: state.userName || '客户',
    createdAt: Date.now(),
  }
  const list = readApplyList()
  list.unshift(next)
  saveApplyList(list)
  return next
}

export async function markAfterSaleFollowupDriver(orderId: string): Promise<AfterSaleRecord> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, never>>(`/after-sale-records/${orderId}/followup`, {})
    return toAfterSaleRecord(raw)
  }

  const map = readRecordMap()
  const current = map[orderId] || { orderId, followed: false, rechecked: false, updatedAt: 0 }
  const updated: AfterSaleRecord = {
    ...current,
    followed: true,
    updatedAt: Date.now(),
  }
  map[orderId] = updated
  saveRecordMap(map)

  const applies = readApplyList().map((apply) => {
    if (apply.orderId === orderId && apply.status === 'pending') {
      return { ...apply, status: 'followed_up' as AfterSaleApplyStatus }
    }
    return apply
  })
  saveApplyList(applies)
  return updated
}

export async function markAfterSaleRecheckDriver(orderId: string): Promise<AfterSaleRecord> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, never>>(`/after-sale-records/${orderId}/recheck`, {})
    return toAfterSaleRecord(raw)
  }

  const map = readRecordMap()
  const current = map[orderId] || { orderId, followed: false, rechecked: false, updatedAt: 0 }
  const updated: AfterSaleRecord = {
    ...current,
    followed: true,
    rechecked: true,
    updatedAt: Date.now(),
  }
  map[orderId] = updated
  saveRecordMap(map)

  const applies = readApplyList().map((apply) => {
    if (apply.orderId === orderId && (apply.status === 'pending' || apply.status === 'followed_up')) {
      return { ...apply, status: 'completed' as AfterSaleApplyStatus }
    }
    return apply
  })
  saveApplyList(applies)
  return updated
}
