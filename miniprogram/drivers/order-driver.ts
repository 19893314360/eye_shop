import { CreateOrderPayload, ListOrdersParams, OrderStatus, OrderType, PayChannel, PayOrderPayload, SalesOrder } from '../types/sales'
import { http } from '../utils/request'
import { readNumber, readString } from './codec'
import { buildRequestPayload } from './payload'

function normalizeOrderType(value: string): OrderType {
  return value === 'optometry' ? 'optometry' : 'normal'
}

function normalizeOrderStatus(value: string): OrderStatus {
  if (value === 'awaiting_payment' || value === 'ready_delivery' || value === 'completed') {
    return value
  }
  return 'awaiting_payment'
}

function normalizePayChannel(value: string): PayChannel | undefined {
  if (value === 'wechat' || value === 'balance' || value === 'cash') {
    return value
  }
  return undefined
}

function toCreateOrderDTO(payload: CreateOrderPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'member_id', camel: 'memberId', value: payload.memberId },
    { snake: 'order_type', camel: 'orderType', value: payload.orderType },
    { snake: 'item_name', camel: 'itemName', value: payload.itemName },
    { snake: 'quantity', camel: 'quantity', value: payload.quantity },
    { snake: 'unit_price', camel: 'unitPrice', value: payload.unitPrice },
    { snake: 'note', camel: 'note', value: payload.note || '' },
  ])
}

function toPayOrderDTO(payload: PayOrderPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'pay_channel', camel: 'payChannel', value: payload.payChannel },
    { snake: 'paid_amount', camel: 'paidAmount', value: payload.paidAmount },
  ])
}

function toSalesOrder(raw: unknown): SalesOrder {
  const paidAt = readNumber(raw, ['paidAt', 'paid_at'])
  const deliveredAt = readNumber(raw, ['deliveredAt', 'delivered_at'])
  const payChannel = normalizePayChannel(readString(raw, ['payChannel', 'pay_channel']))
  const safePaidAt = paidAt > 0 ? paidAt : undefined
  const safeDeliveredAt = deliveredAt > 0 ? deliveredAt : undefined
  return {
    id: readString(raw, ['id', 'order_id']),
    orderNo: readString(raw, ['orderNo', 'order_no']),
    memberId: readString(raw, ['memberId', 'member_id']),
    memberName: readString(raw, ['memberName', 'member_name']),
    orderType: normalizeOrderType(readString(raw, ['orderType', 'order_type'])),
    itemName: readString(raw, ['itemName', 'item_name']),
    quantity: readNumber(raw, ['quantity']),
    unitPrice: readNumber(raw, ['unitPrice', 'unit_price']),
    amount: readNumber(raw, ['amount']),
    status: normalizeOrderStatus(readString(raw, ['status'])),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
    paidAt: safePaidAt,
    deliveredAt: safeDeliveredAt,
    payChannel,
  }
}

export async function createOrderDriver(payload: CreateOrderPayload): Promise<SalesOrder> {
  const raw = await http.post<unknown, Record<string, unknown>>('/orders', toCreateOrderDTO(payload))
  return toSalesOrder(raw)
}

export async function listOrdersDriver(params: ListOrdersParams = {}): Promise<SalesOrder[]> {
  const raw = await http.get<unknown[]>('/orders', {
    data: {
      status: params.status,
      keyword: params.keyword,
    },
  })
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => toSalesOrder(item))
}

export async function payOrderDriver(orderId: string, payload: PayOrderPayload): Promise<SalesOrder> {
  const raw = await http.post<unknown, Record<string, unknown>>(`/orders/${orderId}/pay`, toPayOrderDTO(payload))
  return toSalesOrder(raw)
}

export async function deliverOrderDriver(orderId: string): Promise<SalesOrder> {
  const raw = await http.post<unknown, Record<string, never>>(`/orders/${orderId}/deliver`, {})
  return toSalesOrder(raw)
}
