export type InventoryStatus = 'normal' | 'low' | 'high'

export interface InventoryItem {
  id: string
  sku: string
  name: string
  qty: number
  safeMin: number
  safeMax: number
  location: string
  status: InventoryStatus
  createdAt: number
  updatedAt: number
}

export interface InventoryMovement {
  id: string
  itemId: string
  sku: string
  itemName: string
  actionType: string
  qtyChange: number
  beforeQty: number
  afterQty: number
  operator: string
  note: string
  relatedId: string
  createdAt: number
}

export interface ListInventoryParams {
  keyword?: string
  status?: 'all' | 'low' | 'high'
}

export interface AdjustInventoryPayload {
  itemId: string
  newQty: number
  operator: string
  note?: string
}

export type InventoryCheckScope = 'all' | 'low' | 'high' | 'location'
export type InventoryCheckTaskStatus = 'ongoing' | 'done'
export type InventoryCheckItemStatus = 'pending' | 'done' | 'difference'

export interface InventoryCheckTask {
  id: string
  scope: InventoryCheckScope
  note: string
  status: InventoryCheckTaskStatus
  operator: string
  createdAt: number
  completedAt?: number
}

export interface InventoryCheckItem {
  id: string
  taskId: string
  inventoryItemId: string
  sku: string
  name: string
  location: string
  systemQty: number
  actualQty?: number
  difference?: number
  status: InventoryCheckItemStatus
  note: string
  createdAt: number
  updatedAt?: number
}

export interface CreateInventoryCheckTaskPayload {
  scope: InventoryCheckScope
  note: string
  operator: string
}

export interface ListInventoryCheckItemsParams {
  keyword?: string
  status?: InventoryCheckItemStatus
}

export interface SubmitInventoryCheckItemPayload {
  id: string
  actualQty: number
}

export interface ResolveInventoryCheckItemPayload {
  id: string
  action: 'adjust' | 'mark_normal'
  operator: string
  note?: string
}
