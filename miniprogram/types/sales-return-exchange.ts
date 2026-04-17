export type SalesRefundChannel = '原路退回' | '余额退回' | '现金退款'

export interface SalesReturnRecord {
  id: string
  orderId: string
  orderNo: string
  memberName: string
  itemName: string
  amount: number
  reason: string
  refundChannel: SalesRefundChannel
  createdAt: number
}

export interface CreateSalesReturnPayload {
  orderId: string
  orderNo: string
  memberName: string
  itemName: string
  amount: number
  reason: string
  refundChannel: SalesRefundChannel
}

export interface SalesExchangeRecord {
  id: string
  orderId: string
  orderNo: string
  memberName: string
  originalItem: string
  newItem: string
  priceDiff: number
  reason: string
  createdAt: number
}

export interface CreateSalesExchangePayload {
  orderId: string
  orderNo: string
  memberName: string
  originalItem: string
  amount: number
  newItem: string
  newItemPrice?: number
  reason: string
}
