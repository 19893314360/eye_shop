import { createOrderDriver, deliverOrderDriver, listOrdersDriver, payOrderDriver } from '../drivers/order-driver'
import { CreateOrderPayload, ListOrdersParams, PayOrderPayload, SalesOrder } from '../types/sales'

export function createOrder(payload: CreateOrderPayload): Promise<SalesOrder> {
  return createOrderDriver(payload)
}

export function listOrders(params: ListOrdersParams = {}): Promise<SalesOrder[]> {
  return listOrdersDriver(params)
}

export async function getOrderById(orderId: string): Promise<SalesOrder> {
  const orders = await listOrders()
  const target = orders.find((item) => item.id === orderId)
  if (!target) {
    throw new Error('订单不存在')
  }
  return target
}

export function payOrder(orderId: string, payload: PayOrderPayload): Promise<SalesOrder> {
  return payOrderDriver(orderId, payload)
}

export function deliverOrder(orderId: string): Promise<SalesOrder> {
  return deliverOrderDriver(orderId)
}
