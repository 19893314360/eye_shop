import {
  createAfterSaleApplyDriver,
  listAfterSaleAppliesDriver,
  listAfterSaleRecordsDriver,
  markAfterSaleFollowupDriver,
  markAfterSaleRecheckDriver,
} from '../drivers/after-sale-driver'
import { AfterSaleApply, AfterSaleRecord, CreateAfterSaleApplyPayload } from '../types/after-sale'

export function listAfterSaleRecords(): Promise<AfterSaleRecord[]> {
  return listAfterSaleRecordsDriver()
}

export function listAfterSaleApplies(): Promise<AfterSaleApply[]> {
  return listAfterSaleAppliesDriver()
}

export function createAfterSaleApply(payload: CreateAfterSaleApplyPayload): Promise<AfterSaleApply> {
  return createAfterSaleApplyDriver(payload)
}

export function markAfterSaleFollowup(orderId: string): Promise<AfterSaleRecord> {
  return markAfterSaleFollowupDriver(orderId)
}

export function markAfterSaleRecheck(orderId: string): Promise<AfterSaleRecord> {
  return markAfterSaleRecheckDriver(orderId)
}
