import {
  createSalesExchangeDriver,
  createSalesReturnDriver,
  listSalesExchangesDriver,
  listSalesReturnsDriver,
} from '../drivers/sales-return-exchange-driver'
import {
  CreateSalesExchangePayload,
  CreateSalesReturnPayload,
  SalesExchangeRecord,
  SalesReturnRecord,
} from '../types/sales-return-exchange'

export function listSalesReturns(): Promise<SalesReturnRecord[]> {
  return listSalesReturnsDriver()
}

export function createSalesReturn(payload: CreateSalesReturnPayload): Promise<SalesReturnRecord> {
  return createSalesReturnDriver(payload)
}

export function listSalesExchanges(): Promise<SalesExchangeRecord[]> {
  return listSalesExchangesDriver()
}

export function createSalesExchange(payload: CreateSalesExchangePayload): Promise<SalesExchangeRecord> {
  return createSalesExchangeDriver(payload)
}
