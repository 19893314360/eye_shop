import {
  adjustInventoryItemDriver,
  createInventoryCheckTaskDriver,
  listInventoryCheckItemsDriver,
  listInventoryItemsDriver,
  listInventoryMovementsDriver,
  resolveInventoryCheckItemDriver,
  submitInventoryCheckItemDriver,
  submitInventoryCheckItemsBatchDriver,
} from '../drivers/inventory-driver'
import {
  AdjustInventoryPayload,
  CreateInventoryCheckTaskPayload,
  InventoryCheckItem,
  InventoryItem,
  InventoryMovement,
  ListInventoryCheckItemsParams,
  ListInventoryParams,
  ResolveInventoryCheckItemPayload,
  SubmitInventoryCheckItemPayload,
} from '../types/inventory'

export function listInventoryItems(params: ListInventoryParams = {}): Promise<InventoryItem[]> {
  return listInventoryItemsDriver(params)
}

export function listInventoryMovements(keyword = ''): Promise<InventoryMovement[]> {
  return listInventoryMovementsDriver(keyword)
}

export function adjustInventoryItem(payload: AdjustInventoryPayload): Promise<InventoryItem> {
  return adjustInventoryItemDriver(payload)
}

export function createInventoryCheckTask(payload: CreateInventoryCheckTaskPayload) {
  return createInventoryCheckTaskDriver(payload)
}

export function listInventoryCheckItems(params: ListInventoryCheckItemsParams = {}): Promise<InventoryCheckItem[]> {
  return listInventoryCheckItemsDriver(params)
}

export function submitInventoryCheckItem(payload: SubmitInventoryCheckItemPayload): Promise<InventoryCheckItem> {
  return submitInventoryCheckItemDriver(payload)
}

export function submitInventoryCheckItemsBatch(items: SubmitInventoryCheckItemPayload[]): Promise<InventoryCheckItem[]> {
  return submitInventoryCheckItemsBatchDriver(items)
}

export function resolveInventoryCheckItem(payload: ResolveInventoryCheckItemPayload): Promise<InventoryCheckItem> {
  return resolveInventoryCheckItemDriver(payload)
}
