import { buildFinanceSummaryFromOrdersDriver } from '../drivers/finance-driver'
import { SalesOrder } from '../types/sales'

export interface FinanceSummary {
  totalAmount: number
  receivedAmount: number
  receivableAmount: number
  completedCount: number
  awaitingPaymentCount: number
}

export function buildFinanceSummary(orders: SalesOrder[]): FinanceSummary {
  return buildFinanceSummaryFromOrdersDriver(orders)
}
