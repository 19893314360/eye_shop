import { SalesOrder } from '../types/sales'
import type { FinanceSummary } from '../services/finance'
import { readNumber, readString } from './codec'

interface OrderAmountView {
  amount: number
  status: string
}

function toOrderAmountView(raw: unknown): OrderAmountView {
  return {
    amount: readNumber(raw, ['amount']),
    status: readString(raw, ['status']),
  }
}

export function buildFinanceSummaryDriver(rawOrders: unknown[]): FinanceSummary {
  let totalAmount = 0
  let receivedAmount = 0
  let receivableAmount = 0
  let completedCount = 0
  let awaitingPaymentCount = 0

  for (const raw of rawOrders) {
    const order = toOrderAmountView(raw)
    totalAmount += order.amount
    if (order.status === 'awaiting_payment') {
      receivableAmount += order.amount
      awaitingPaymentCount += 1
    } else {
      receivedAmount += order.amount
    }
    if (order.status === 'completed') {
      completedCount += 1
    }
  }

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    receivedAmount: Number(receivedAmount.toFixed(2)),
    receivableAmount: Number(receivableAmount.toFixed(2)),
    completedCount,
    awaitingPaymentCount,
  }
}

export function buildFinanceSummaryFromOrdersDriver(orders: SalesOrder[]): FinanceSummary {
  return buildFinanceSummaryDriver(orders)
}
