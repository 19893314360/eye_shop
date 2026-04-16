import { createVisionRecordDriver, listVisionRecordsDriver, VisionPayload } from '../drivers/vision-driver'
import { VisionRecord } from '../types/vision'

export interface CreateVisionPayload extends VisionPayload {}

export function listVisionRecords(memberId: string): Promise<VisionRecord[]> {
  return listVisionRecordsDriver(memberId)
}

export function createVisionRecord(payload: CreateVisionPayload): Promise<VisionRecord> {
  return createVisionRecordDriver(payload)
}
