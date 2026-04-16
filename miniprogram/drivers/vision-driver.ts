import { readString } from './codec'
import { VisionRecord } from '../types/vision'

export interface VisionPayload {
  memberId: string
  rightEye: string
  leftEye: string
  pd: string
  suggestion: string
  doctor: string
  examDate: string
}

const VISION_STORAGE_KEY = 'yanjing-vision-records'

const defaultRecords: VisionRecord[] = [
  {
    id: 'VR-001',
    memberId: 'MEM-1001',
    examDate: '2026-04-10',
    rightEye: 'S -1.75 C -0.50 A 180',
    leftEye: 'S -1.50 C -0.25 A 170',
    pd: '63',
    suggestion: '建议防蓝光镜片，连续用眼 40 分钟休息 5 分钟。',
    doctor: '徐明',
  },
  {
    id: 'VR-002',
    memberId: 'MEM-1002',
    examDate: '2026-04-08',
    rightEye: 'S -2.25 C -0.75 A 175',
    leftEye: 'S -2.00 C -0.50 A 165',
    pd: '62',
    suggestion: '建议复查周期 3 个月，增加户外活动。',
    doctor: '周宁',
  },
]

function toVisionRecord(raw: unknown): VisionRecord {
  return {
    id: readString(raw, ['id', 'record_id']),
    memberId: readString(raw, ['memberId', 'member_id']),
    examDate: readString(raw, ['examDate', 'exam_date']),
    rightEye: readString(raw, ['rightEye', 'right_eye']),
    leftEye: readString(raw, ['leftEye', 'left_eye']),
    pd: readString(raw, ['pd']),
    suggestion: readString(raw, ['suggestion', 'remark']),
    doctor: readString(raw, ['doctor', 'optometrist']),
  }
}

function readRecords(): VisionRecord[] {
  const raw = wx.getStorageSync(VISION_STORAGE_KEY)
  if (!Array.isArray(raw)) {
    wx.setStorageSync(VISION_STORAGE_KEY, defaultRecords)
    return [...defaultRecords]
  }
  return raw.map((item) => toVisionRecord(item))
}

function saveRecords(list: VisionRecord[]) {
  wx.setStorageSync(VISION_STORAGE_KEY, list)
}

export async function listVisionRecordsDriver(memberId: string): Promise<VisionRecord[]> {
  const list = readRecords()
  return list
    .filter((item) => item.memberId === memberId)
    .sort((a, b) => (a.examDate < b.examDate ? 1 : -1))
}

export async function createVisionRecordDriver(payload: VisionPayload): Promise<VisionRecord> {
  const records = readRecords()
  const next: VisionRecord = {
    id: `VR-${Date.now()}`,
    memberId: payload.memberId,
    examDate: payload.examDate,
    rightEye: payload.rightEye,
    leftEye: payload.leftEye,
    pd: payload.pd,
    suggestion: payload.suggestion,
    doctor: payload.doctor,
  }
  records.unshift(next)
  saveRecords(records)
  return next
}
