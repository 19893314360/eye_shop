import { createPurchaseRecordDriver, listPurchaseRecordsDriver, PurchasePayload } from '../drivers/purchase-driver'
import { PurchaseRecord } from '../types/purchase'

export interface CreatePurchasePayload extends PurchasePayload {}

export function listPurchaseRecords(): Promise<PurchaseRecord[]> {
  return listPurchaseRecordsDriver()
}

export function createPurchaseRecord(payload: CreatePurchasePayload): Promise<PurchaseRecord> {
  return createPurchaseRecordDriver(payload)
}
