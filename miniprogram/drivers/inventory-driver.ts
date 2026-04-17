import { getRuntimeConfig } from '../services/runtime-config'
import { http } from '../utils/request'
import { readNumber, readString } from './codec'
import { buildRequestPayload } from './payload'
import {
  AdjustInventoryPayload,
  CreateInventoryCheckTaskPayload,
  InventoryCheckItem,
  InventoryCheckItemStatus,
  InventoryCheckTask,
  InventoryCheckTaskStatus,
  InventoryCheckScope,
  InventoryItem,
  InventoryMovement,
  InventoryStatus,
  ListInventoryCheckItemsParams,
  ListInventoryParams,
  ResolveInventoryCheckItemPayload,
  SubmitInventoryCheckItemPayload,
} from '../types/inventory'

const INVENTORY_ITEMS_KEY = 'yanjing-inventory-list'
const INVENTORY_MOVEMENTS_KEY = 'yanjing-inventory-trace'
const INVENTORY_CHECK_ITEMS_KEY = 'yanjing-check-items'
const INVENTORY_CHECK_TASKS_KEY = 'yanjing-check-tasks'

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  return raw as Record<string, unknown>
}

function readOptionalNumber(raw: unknown, keys: string[]): number | undefined {
  const source = asRecord(raw)
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string' && value.trim()) {
      const converted = Number(value)
      if (Number.isFinite(converted)) {
        return converted
      }
    }
  }
  return undefined
}

const defaultInventoryItems: InventoryItem[] = [
  {
    id: 'INV-1001',
    sku: 'LENS-001',
    name: '超薄镜片 1.67',
    qty: 18,
    safeMin: 20,
    safeMax: 80,
    location: 'A-01',
    status: 'low',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'INV-1002',
    sku: 'FRAME-010',
    name: '金属镜架 M10',
    qty: 96,
    safeMin: 10,
    safeMax: 90,
    location: 'B-03',
    status: 'high',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 6 * 60 * 60 * 1000,
  },
  {
    id: 'INV-1003',
    sku: 'LENS-022',
    name: '防蓝光镜片 1.60',
    qty: 45,
    safeMin: 20,
    safeMax: 70,
    location: 'A-06',
    status: 'normal',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 24 * 60 * 60 * 1000,
  },
  {
    id: 'INV-1004',
    sku: 'LENS-005',
    name: '渐进镜片 1.60',
    qty: 12,
    safeMin: 15,
    safeMax: 60,
    location: 'A-02',
    status: 'low',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 28 * 60 * 60 * 1000,
  },
  {
    id: 'INV-1005',
    sku: 'FRAME-001',
    name: '钛架镜框 T1',
    qty: 8,
    safeMin: 10,
    safeMax: 40,
    location: 'B-01',
    status: 'low',
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 30 * 60 * 60 * 1000,
  },
]

const defaultInventoryMovements: InventoryMovement[] = [
  {
    id: 'LOG-1001',
    itemId: 'INV-1001',
    sku: 'LENS-001',
    itemName: '超薄镜片 1.67',
    actionType: 'purchase_order',
    qtyChange: 10,
    beforeQty: 8,
    afterQty: 18,
    operator: '店长',
    note: '',
    relatedId: 'PO-1001',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
  },
  {
    id: 'LOG-1002',
    itemId: 'INV-1002',
    sku: 'FRAME-010',
    itemName: '金属镜架 M10',
    actionType: 'purchase_inbound',
    qtyChange: 10,
    beforeQty: 86,
    afterQty: 96,
    operator: '徐明',
    note: '',
    relatedId: 'PO-1002',
    createdAt: Date.now() - 6 * 60 * 60 * 1000,
  },
  {
    id: 'LOG-1003',
    itemId: 'INV-1004',
    sku: 'LENS-005',
    itemName: '渐进镜片 1.60',
    actionType: 'manual_adjust',
    qtyChange: -1,
    beforeQty: 13,
    afterQty: 12,
    operator: '周宁',
    note: '盘点调整',
    relatedId: 'INV-1004',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
  },
]

function normalizeInventoryStatus(value: string): InventoryStatus {
  if (value === 'low' || value === 'high' || value === 'normal') {
    return value
  }
  return 'normal'
}

function normalizeInventoryCheckScope(value: string): InventoryCheckScope {
  if (value === 'low' || value === 'high' || value === 'location' || value === 'all') {
    return value
  }
  return 'all'
}

function normalizeInventoryCheckTaskStatus(value: string): InventoryCheckTaskStatus {
  return value === 'done' ? 'done' : 'ongoing'
}

function normalizeInventoryCheckItemStatus(value: string): InventoryCheckItemStatus {
  if (value === 'difference' || value === 'done' || value === 'pending') {
    return value
  }
  return 'pending'
}

function normalizeMovementActionType(value: string): string {
  return value || 'manual_adjust'
}

function computeInventoryStatus(item: Pick<InventoryItem, 'qty' | 'safeMin' | 'safeMax'>): InventoryStatus {
  if (item.qty < item.safeMin) {
    return 'low'
  }
  if (item.qty > item.safeMax) {
    return 'high'
  }
  return 'normal'
}

function sortByUpdatedAtDesc<T extends { updatedAt: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
}

function sortByCreatedAtDesc<T extends { createdAt: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.createdAt - a.createdAt)
}

function toInventoryItem(raw: unknown): InventoryItem {
  const item: InventoryItem = {
    id: readString(raw, ['id', 'item_id']),
    sku: readString(raw, ['sku']),
    name: readString(raw, ['name', 'itemName', 'item_name']),
    qty: readNumber(raw, ['qty', 'quantity']),
    safeMin: readNumber(raw, ['safeMin', 'safe_min']),
    safeMax: readNumber(raw, ['safeMax', 'safe_max']),
    location: readString(raw, ['location']),
    status: normalizeInventoryStatus(readString(raw, ['status'])),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
    updatedAt: readNumber(raw, ['updatedAt', 'updated_at']),
  }
  return {
    ...item,
    status: item.status || computeInventoryStatus(item),
  }
}

function toInventoryMovement(raw: unknown): InventoryMovement {
  return {
    id: readString(raw, ['id', 'log_id']),
    itemId: readString(raw, ['itemId', 'item_id']),
    sku: readString(raw, ['sku']),
    itemName: readString(raw, ['itemName', 'item_name']),
    actionType: normalizeMovementActionType(readString(raw, ['actionType', 'action_type'])),
    qtyChange: readNumber(raw, ['qtyChange', 'qty_change']),
    beforeQty: readNumber(raw, ['beforeQty', 'before_qty']),
    afterQty: readNumber(raw, ['afterQty', 'after_qty']),
    operator: readString(raw, ['operator']),
    note: readString(raw, ['note']),
    relatedId: readString(raw, ['relatedId', 'related_id']),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
  }
}

function toInventoryCheckTask(raw: unknown): InventoryCheckTask {
  const completedAt = readOptionalNumber(raw, ['completedAt', 'completed_at'])
  return {
    id: readString(raw, ['id', 'task_id']),
    scope: normalizeInventoryCheckScope(readString(raw, ['scope'])),
    note: readString(raw, ['note']),
    status: normalizeInventoryCheckTaskStatus(readString(raw, ['status'])),
    operator: readString(raw, ['operator']),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
    completedAt: completedAt && completedAt > 0 ? completedAt : undefined,
  }
}

function toInventoryCheckItem(raw: unknown): InventoryCheckItem {
  const actualQty = readOptionalNumber(raw, ['actualQty', 'actual_qty'])
  const difference = readOptionalNumber(raw, ['difference', 'difference_qty'])
  const updatedAt = readOptionalNumber(raw, ['updatedAt', 'updated_at'])
  return {
    id: readString(raw, ['id', 'check_item_id']),
    taskId: readString(raw, ['taskId', 'task_id']),
    inventoryItemId: readString(raw, ['inventoryItemId', 'inventory_item_id']),
    sku: readString(raw, ['sku']),
    name: readString(raw, ['name', 'itemName', 'item_name']),
    location: readString(raw, ['location']),
    systemQty: readNumber(raw, ['systemQty', 'system_qty']),
    actualQty,
    difference,
    status: normalizeInventoryCheckItemStatus(readString(raw, ['status'])),
    note: readString(raw, ['note']),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
    updatedAt: updatedAt && updatedAt > 0 ? updatedAt : undefined,
  }
}

function toAdjustInventoryDTO(payload: AdjustInventoryPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'new_qty', camel: 'newQty', value: payload.newQty },
    { snake: 'operator', camel: 'operator', value: payload.operator },
    { snake: 'note', camel: 'note', value: payload.note || '' },
  ])
}

function toCreateInventoryCheckTaskDTO(payload: CreateInventoryCheckTaskPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'scope', camel: 'scope', value: payload.scope },
    { snake: 'note', camel: 'note', value: payload.note },
    { snake: 'operator', camel: 'operator', value: payload.operator },
  ])
}

function toSubmitInventoryCheckItemDTO(payload: SubmitInventoryCheckItemPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'actual_qty', camel: 'actualQty', value: payload.actualQty },
  ])
}

function toResolveInventoryCheckItemDTO(payload: ResolveInventoryCheckItemPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'action', camel: 'action', value: payload.action },
    { snake: 'operator', camel: 'operator', value: payload.operator },
    { snake: 'note', camel: 'note', value: payload.note || '' },
  ])
}

function toSubmitInventoryCheckItemsBatchDTO(items: SubmitInventoryCheckItemPayload[]): Record<string, unknown> {
  return {
    items: items.map((item) => ({
      id: item.id,
      check_item_id: item.id,
      actualQty: item.actualQty,
      actual_qty: item.actualQty,
    })),
  }
}

function readList<T>(key: string, fallback: T[], mapper: (raw: unknown) => T): T[] {
  const raw = wx.getStorageSync(key)
  if (!Array.isArray(raw)) {
    wx.setStorageSync(key, fallback)
    return [...fallback]
  }
  return raw.map((item) => mapper(item))
}

function saveList<T>(key: string, list: T[]) {
  wx.setStorageSync(key, list)
}

function readInventoryItems(): InventoryItem[] {
  return sortByUpdatedAtDesc(readList<InventoryItem>(INVENTORY_ITEMS_KEY, defaultInventoryItems, toInventoryItem).map((item) => ({
    ...item,
    status: computeInventoryStatus(item),
  })))
}

function saveInventoryItems(list: InventoryItem[]) {
  saveList(INVENTORY_ITEMS_KEY, list)
}

function readInventoryMovements(): InventoryMovement[] {
  return sortByCreatedAtDesc(readList<InventoryMovement>(INVENTORY_MOVEMENTS_KEY, defaultInventoryMovements, toInventoryMovement))
}

function saveInventoryMovements(list: InventoryMovement[]) {
  saveList(INVENTORY_MOVEMENTS_KEY, list)
}

function readInventoryCheckTasks(): InventoryCheckTask[] {
  return sortByCreatedAtDesc(readList<InventoryCheckTask>(INVENTORY_CHECK_TASKS_KEY, [], toInventoryCheckTask))
}

function saveInventoryCheckTasks(list: InventoryCheckTask[]) {
  saveList(INVENTORY_CHECK_TASKS_KEY, list)
}

function readInventoryCheckItems(): InventoryCheckItem[] {
  return sortByCreatedAtDesc(readList<InventoryCheckItem>(INVENTORY_CHECK_ITEMS_KEY, [], toInventoryCheckItem))
}

function saveInventoryCheckItems(list: InventoryCheckItem[]) {
  saveList(INVENTORY_CHECK_ITEMS_KEY, list)
}

function completeMockTaskIfNeeded(taskId: string) {
  const items = readInventoryCheckItems()
  if (items.some((item) => item.taskId === taskId && item.status === 'pending')) {
    return
  }
  const tasks = readInventoryCheckTasks()
  const updatedTasks = tasks.map((task) => {
    if (task.id !== taskId || task.status === 'done') {
      return task
    }
    return {
      ...task,
      status: 'done' as InventoryCheckTaskStatus,
      completedAt: Date.now(),
    }
  })
  saveInventoryCheckTasks(updatedTasks)
}

function appendMockMovement(item: InventoryItem, actionType: string, qtyChange: number, beforeQty: number, operator: string, note: string, relatedId: string) {
  const movements = readInventoryMovements()
  movements.unshift({
    id: `LOG-${Date.now()}`,
    itemId: item.id,
    sku: item.sku,
    itemName: item.name,
    actionType,
    qtyChange,
    beforeQty,
    afterQty: item.qty,
    operator,
    note,
    relatedId,
    createdAt: Date.now(),
  })
  saveInventoryMovements(movements)
}

export async function listInventoryItemsDriver(params: ListInventoryParams = {}): Promise<InventoryItem[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/inventory-items', {
      data: {
        keyword: params.keyword,
        status: params.status,
      },
    })
    if (!Array.isArray(raw)) {
      return []
    }
    return sortByUpdatedAtDesc(raw.map((item) => toInventoryItem(item)))
  }

  const normalizedKeyword = (params.keyword || '').trim()
  const status = params.status || 'all'
  return readInventoryItems().filter((item) => {
    if (status !== 'all' && item.status !== status) {
      return false
    }
    if (!normalizedKeyword) {
      return true
    }
    return item.name.includes(normalizedKeyword) || item.sku.includes(normalizedKeyword) || item.location.includes(normalizedKeyword)
  })
}

export async function listInventoryMovementsDriver(keyword = ''): Promise<InventoryMovement[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/inventory-movements', {
      data: {
        keyword,
      },
    })
    if (!Array.isArray(raw)) {
      return []
    }
    return sortByCreatedAtDesc(raw.map((item) => toInventoryMovement(item)))
  }

  const normalizedKeyword = keyword.trim()
  return readInventoryMovements().filter((item) => {
    if (!normalizedKeyword) {
      return true
    }
    return item.sku.includes(normalizedKeyword) || item.itemName.includes(normalizedKeyword) || item.operator.includes(normalizedKeyword)
  })
}

export async function adjustInventoryItemDriver(payload: AdjustInventoryPayload): Promise<InventoryItem> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>(`/inventory-items/${payload.itemId}/adjust`, toAdjustInventoryDTO(payload))
    return toInventoryItem(raw)
  }

  const items = readInventoryItems()
  const index = items.findIndex((item) => item.id === payload.itemId)
  if (index < 0) {
    throw new Error('库存商品不存在')
  }
  const beforeQty = items[index].qty
  const updated: InventoryItem = {
    ...items[index],
    qty: payload.newQty,
    status: computeInventoryStatus({
      ...items[index],
      qty: payload.newQty,
    }),
    updatedAt: Date.now(),
  }
  items[index] = updated
  saveInventoryItems(items)
  appendMockMovement(updated, 'manual_adjust', updated.qty - beforeQty, beforeQty, payload.operator, payload.note || '', updated.id)
  return updated
}

export async function createInventoryCheckTaskDriver(payload: CreateInventoryCheckTaskPayload): Promise<InventoryCheckTask> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>('/inventory-check-tasks', toCreateInventoryCheckTaskDTO(payload))
    return toInventoryCheckTask(raw)
  }

  const sourceItems = readInventoryItems().filter((item) => {
    if (payload.scope === 'low') {
      return item.status === 'low'
    }
    if (payload.scope === 'high') {
      return item.status === 'high'
    }
    return true
  })
  if (!sourceItems.length) {
    throw new Error('该范围无商品需要盘点')
  }

  const task: InventoryCheckTask = {
    id: `TASK-${Date.now()}`,
    scope: payload.scope,
    note: payload.note.trim(),
    status: 'ongoing',
    operator: payload.operator,
    createdAt: Date.now(),
  }
  const tasks = readInventoryCheckTasks()
  tasks.unshift(task)
  saveInventoryCheckTasks(tasks)

  const items = readInventoryCheckItems()
  const nextItems = sourceItems.map((item) => ({
    id: `CHK-${Date.now()}-${item.id}`,
    taskId: task.id,
    inventoryItemId: item.id,
    sku: item.sku,
    name: item.name,
    location: item.location,
    systemQty: item.qty,
    status: 'pending' as InventoryCheckItemStatus,
    note: '',
    createdAt: Date.now(),
  }))
  saveInventoryCheckItems([...nextItems, ...items])
  return task
}

export async function listInventoryCheckItemsDriver(params: ListInventoryCheckItemsParams = {}): Promise<InventoryCheckItem[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.get<unknown[]>('/inventory-check-items', {
      data: {
        keyword: params.keyword,
        status: params.status,
      },
    })
    if (!Array.isArray(raw)) {
      return []
    }
    return sortByCreatedAtDesc(raw.map((item) => toInventoryCheckItem(item)))
  }

  const normalizedKeyword = (params.keyword || '').trim()
  return readInventoryCheckItems().filter((item) => {
    if (params.status && item.status !== params.status) {
      return false
    }
    if (!normalizedKeyword) {
      return true
    }
    return item.name.includes(normalizedKeyword) || item.sku.includes(normalizedKeyword) || item.location.includes(normalizedKeyword)
  })
}

export async function submitInventoryCheckItemDriver(payload: SubmitInventoryCheckItemPayload): Promise<InventoryCheckItem> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>(`/inventory-check-items/${payload.id}/submit`, toSubmitInventoryCheckItemDTO(payload))
    return toInventoryCheckItem(raw)
  }

  const items = readInventoryCheckItems()
  const index = items.findIndex((item) => item.id === payload.id)
  if (index < 0) {
    throw new Error('盘点项不存在')
  }
  const current = items[index]
  const difference = payload.actualQty - current.systemQty
  const updated: InventoryCheckItem = {
    ...current,
    actualQty: payload.actualQty,
    difference,
    status: difference === 0 ? 'done' : 'difference',
    updatedAt: Date.now(),
  }
  items[index] = updated
  saveInventoryCheckItems(items)
  completeMockTaskIfNeeded(updated.taskId)
  return updated
}

export async function submitInventoryCheckItemsBatchDriver(items: SubmitInventoryCheckItemPayload[]): Promise<InventoryCheckItem[]> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown[], Record<string, unknown>>('/inventory-check-items/batch-submit', toSubmitInventoryCheckItemsBatchDTO(items))
    if (!Array.isArray(raw)) {
      return []
    }
    return raw.map((item) => toInventoryCheckItem(item))
  }

  const updatedItems: InventoryCheckItem[] = []
  for (const item of items) {
    updatedItems.push(await submitInventoryCheckItemDriver(item))
  }
  return updatedItems
}

export async function resolveInventoryCheckItemDriver(payload: ResolveInventoryCheckItemPayload): Promise<InventoryCheckItem> {
  const runtime = getRuntimeConfig()
  if (!runtime.useMockApi) {
    const raw = await http.post<unknown, Record<string, unknown>>(`/inventory-check-items/${payload.id}/resolve`, toResolveInventoryCheckItemDTO(payload))
    return toInventoryCheckItem(raw)
  }

  const checkItems = readInventoryCheckItems()
  const checkIndex = checkItems.findIndex((item) => item.id === payload.id)
  if (checkIndex < 0) {
    throw new Error('盘点项不存在')
  }
  const current = checkItems[checkIndex]
  if (payload.action === 'adjust') {
    const inventoryItems = readInventoryItems()
    const inventoryIndex = inventoryItems.findIndex((item) => item.id === current.inventoryItemId)
    if (inventoryIndex >= 0) {
      const beforeQty = inventoryItems[inventoryIndex].qty
      const nextQty = current.actualQty == null ? current.systemQty : current.actualQty
      const updatedInventoryItem: InventoryItem = {
        ...inventoryItems[inventoryIndex],
        qty: nextQty,
        status: computeInventoryStatus({
          ...inventoryItems[inventoryIndex],
          qty: nextQty,
        }),
        updatedAt: Date.now(),
      }
      inventoryItems[inventoryIndex] = updatedInventoryItem
      saveInventoryItems(inventoryItems)
      appendMockMovement(updatedInventoryItem, 'stock_check_adjust', nextQty - beforeQty, beforeQty, payload.operator, payload.note || current.note, current.id)
    }
  }

  const resolved: InventoryCheckItem = {
    ...current,
    actualQty: payload.action === 'mark_normal' ? current.systemQty : (current.actualQty == null ? current.systemQty : current.actualQty),
    difference: 0,
    status: 'done',
    updatedAt: Date.now(),
  }
  checkItems[checkIndex] = resolved
  saveInventoryCheckItems(checkItems)
  completeMockTaskIfNeeded(resolved.taskId)
  return resolved
}
