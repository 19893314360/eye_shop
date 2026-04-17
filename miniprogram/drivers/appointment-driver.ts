import { getRuntimeConfig } from '../services/runtime-config'
import { getAppState } from '../store/app-state'
import { AppointmentItem, AppointmentService, AppointmentStatus, CreateAppointmentPayload, ListAppointmentsParams } from '../types/appointment'
import { http } from '../utils/request'
import { readNumber, readString } from './codec'
import { buildRequestPayload } from './payload'

const APPOINTMENT_STORAGE_KEY = 'yanjing-appointments'

const defaultRecords: AppointmentItem[] = [
  {
    id: 'APT-1001',
    customerName: '阿依古丽',
    mobile: '13800001001',
    serviceType: 'optometry',
    date: '2026-04-18',
    time: '10:30',
    note: '初次验光咨询',
    status: 'pending',
    createdAt: Date.now() - 3 * 60 * 60 * 1000,
  },
  {
    id: 'APT-1002',
    customerName: '马磊',
    mobile: '13800001002',
    serviceType: 'recheck',
    date: '2026-04-17',
    time: '15:00',
    note: '复查镜片适配情况',
    status: 'done',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    arrivedAt: Date.now() - 23 * 60 * 60 * 1000,
  },
]

function normalizeService(value: string): AppointmentService {
  if (value === 'recheck' || value === 'training' || value === 'optometry') {
    return value
  }
  return 'optometry'
}

function normalizeStatus(value: string): AppointmentStatus {
  return value === 'done' ? 'done' : 'pending'
}

function toAppointment(raw: unknown): AppointmentItem {
  const arrivedAt = readNumber(raw, ['arrivedAt', 'arrived_at'])
  return {
    id: readString(raw, ['id', 'appointment_id']),
    customerName: readString(raw, ['customerName', 'customer_name']),
    mobile: readString(raw, ['mobile', 'phone']),
    serviceType: normalizeService(readString(raw, ['serviceType', 'service_type'])),
    date: readString(raw, ['date', 'appointmentDate', 'appointment_date']),
    time: readString(raw, ['time', 'appointmentTime', 'appointment_time']),
    note: readString(raw, ['note', 'remark']),
    status: normalizeStatus(readString(raw, ['status'])),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
    arrivedAt: arrivedAt > 0 ? arrivedAt : undefined,
  }
}

function toCreateAppointmentDTO(payload: CreateAppointmentPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'customer_name', camel: 'customerName', value: payload.customerName },
    { snake: 'phone', camel: 'mobile', value: payload.mobile },
    { snake: 'service_type', camel: 'serviceType', value: payload.serviceType },
    { snake: 'appointment_date', camel: 'date', value: payload.date },
    { snake: 'appointment_time', camel: 'time', value: payload.time },
    { snake: 'note', camel: 'note', value: payload.note },
  ])
}

function readRecords(): AppointmentItem[] {
  const raw = wx.getStorageSync(APPOINTMENT_STORAGE_KEY)
  if (!Array.isArray(raw)) {
    wx.setStorageSync(APPOINTMENT_STORAGE_KEY, defaultRecords)
    return [...defaultRecords]
  }
  return raw.map((item) => toAppointment(item))
}

function saveRecords(list: AppointmentItem[]) {
  wx.setStorageSync(APPOINTMENT_STORAGE_KEY, list)
}

function filterMockRecordsByViewer(list: AppointmentItem[]): AppointmentItem[] {
  const state = getAppState()
  if (state.role !== 'customer') {
    return list
  }
  const mobile = state.mobile.trim()
  const userName = state.userName.trim()
  return list.filter((item) => {
    if (mobile) {
      return item.mobile === mobile
    }
    return userName ? item.customerName === userName : false
  })
}

function sortRecords(list: AppointmentItem[]): AppointmentItem[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt)
}

export async function listAppointmentsDriver(params: ListAppointmentsParams = {}): Promise<AppointmentItem[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/appointments', {
      data: {
        status: params.status,
        keyword: params.keyword,
      },
    })
    if (!Array.isArray(raw)) {
      return []
    }
    return sortRecords(raw.map((item) => toAppointment(item)))
  }

  const normalizedKeyword = (params.keyword || '').trim()
  const visible = filterMockRecordsByViewer(readRecords())
  const filtered = visible.filter((item) => {
    if (params.status && item.status !== params.status) {
      return false
    }
    if (!normalizedKeyword) {
      return true
    }
    return (
      item.customerName.includes(normalizedKeyword) ||
      item.mobile.includes(normalizedKeyword) ||
      item.note.includes(normalizedKeyword) ||
      item.date.includes(normalizedKeyword)
    )
  })
  return sortRecords(filtered)
}

export async function createAppointmentDriver(payload: CreateAppointmentPayload): Promise<AppointmentItem> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>('/appointments', toCreateAppointmentDTO(payload))
    return toAppointment(raw)
  }

  const state = getAppState()
  const customerName = state.role === 'customer' && state.userName ? state.userName : payload.customerName.trim()
  const mobile = state.role === 'customer' && state.mobile ? state.mobile : payload.mobile.trim()
  const next: AppointmentItem = {
    id: `APT-${Date.now()}`,
    customerName,
    mobile,
    serviceType: payload.serviceType,
    date: payload.date,
    time: payload.time,
    note: payload.note.trim(),
    status: 'pending',
    createdAt: Date.now(),
  }
  const records = readRecords()
  records.unshift(next)
  saveRecords(records)
  return next
}

export async function markAppointmentArrivedDriver(appointmentId: string): Promise<AppointmentItem> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, never>>(`/appointments/${appointmentId}/arrive`, {})
    return toAppointment(raw)
  }

  const state = getAppState()
  if (state.role === 'customer') {
    throw new Error('客户端无此权限')
  }
  const records = readRecords()
  const index = records.findIndex((item) => item.id === appointmentId)
  if (index < 0) {
    throw new Error('预约不存在')
  }
  if (records[index].status === 'done') {
    throw new Error('预约已标记到店')
  }
  const updated: AppointmentItem = {
    ...records[index],
    status: 'done',
    arrivedAt: Date.now(),
  }
  records[index] = updated
  saveRecords(records)
  return updated
}
