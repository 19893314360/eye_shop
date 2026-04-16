export type PurchaseType = 'order' | 'inbound' | 'return' | 'frame'

export interface PurchaseRecord {
  id: string
  type: PurchaseType
  itemName: string
  sku: string
  qty: number
  unitCost: number
  supplier: string
  operator: string
  note: string
  createdAt: number
}
