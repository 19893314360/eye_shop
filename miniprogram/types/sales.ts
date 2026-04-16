export type OrderType = 'normal' | 'optometry'
export type OrderStatus = 'awaiting_payment' | 'ready_delivery' | 'completed'
export type PayChannel = 'wechat' | 'balance' | 'cash'

export interface SalesOrder {
  id: string
  orderNo: string
  memberId: string
  memberName: string
  orderType: OrderType
  itemName: string
  quantity: number
  unitPrice: number
  amount: number
  status: OrderStatus
  createdAt: number
  paidAt?: number
  deliveredAt?: number
  payChannel?: PayChannel
}

export interface CreateOrderPayload {
  memberId: string
  orderType: OrderType
  itemName: string
  quantity: number
  unitPrice: number
  note?: string
}

export interface ListOrdersParams {
  status?: OrderStatus
  keyword?: string
}

export interface PayOrderPayload {
  payChannel: PayChannel
  paidAmount: number
}
