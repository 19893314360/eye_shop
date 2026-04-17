const mysql = require('mysql2/promise')

function toNumber(value, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const converted = Number(value)
    if (Number.isFinite(converted)) {
      return converted
    }
  }
  return fallback
}

function toBool(value) {
  return value === true || value === 1 || value === '1'
}

function parseJson(raw, fallback) {
  if (raw == null || raw === '') {
    return fallback
  }
  if (typeof raw === 'object') {
    return raw
  }
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch (error) {
      return fallback
    }
  }
  return fallback
}

function buildOrderNo(counterValue, currentTime = Date.now()) {
  const current = new Date(currentTime)
  const year = `${current.getFullYear()}`
  const month = `${current.getMonth() + 1}`.padStart(2, '0')
  const day = `${current.getDate()}`.padStart(2, '0')
  const serial = `${counterValue}`.padStart(4, '0')
  return `SO${year}${month}${day}${serial}`
}

function mapMember(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    name: row.name,
    mobile: row.mobile,
    gender: row.gender,
    birthday: row.birthday || '',
    note: row.note || '',
    createdAt: toNumber(row.created_at),
  }
}

function mapOrder(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    orderNo: row.order_no,
    memberId: row.member_id,
    memberName: row.member_name,
    orderType: row.order_type,
    itemName: row.item_name,
    quantity: toNumber(row.quantity),
    unitPrice: toNumber(row.unit_price),
    amount: toNumber(row.amount),
    status: row.status,
    note: row.note || '',
    createdAt: toNumber(row.created_at),
    paidAt: row.paid_at == null ? undefined : toNumber(row.paid_at),
    deliveredAt: row.delivered_at == null ? undefined : toNumber(row.delivered_at),
    payChannel: row.pay_channel || undefined,
  }
}

function mapAppointment(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    customerName: row.customer_name,
    mobile: row.mobile,
    serviceType: row.service_type,
    date: row.appointment_date,
    time: row.appointment_time,
    note: row.note || '',
    status: row.status,
    createdAt: toNumber(row.created_at),
    arrivedAt: row.arrived_at == null ? undefined : toNumber(row.arrived_at),
  }
}

function mapAfterSaleRecord(row) {
  if (!row) {
    return null
  }
  return {
    orderId: row.order_id,
    followed: toBool(row.followed),
    rechecked: toBool(row.rechecked),
    updatedAt: toNumber(row.updated_at),
  }
}

function mapAfterSaleApply(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    orderId: row.order_id,
    type: row.apply_type,
    reason: row.reason,
    remark: row.remark || '',
    phone: row.phone,
    images: Array.isArray(row.images) ? row.images : parseJson(row.images, []),
    status: row.status,
    applicant: row.applicant,
    createdAt: toNumber(row.created_at),
  }
}

function mapSalesReturn(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order_no,
    memberName: row.member_name,
    itemName: row.item_name,
    amount: toNumber(row.amount),
    reason: row.reason,
    refundChannel: row.refund_channel,
    createdAt: toNumber(row.created_at),
  }
}

function mapSalesExchange(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    orderId: row.order_id,
    orderNo: row.order_no,
    memberName: row.member_name,
    originalItem: row.original_item,
    newItem: row.new_item,
    priceDiff: toNumber(row.price_diff),
    reason: row.reason,
    createdAt: toNumber(row.created_at),
  }
}

function mapVisionRecord(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    memberId: row.member_id,
    examDate: row.exam_date,
    rightEye: row.right_eye,
    leftEye: row.left_eye,
    pd: row.pd,
    suggestion: row.suggestion || '',
    doctor: row.doctor,
  }
}

function mapPurchaseRecord(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    type: row.record_type,
    itemName: row.item_name,
    sku: row.sku,
    qty: toNumber(row.qty),
    unitCost: toNumber(row.unit_cost),
    supplier: row.supplier,
    operator: row.operator,
    note: row.note || '',
    createdAt: toNumber(row.created_at),
  }
}

function mapInventoryItem(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    sku: row.sku,
    name: row.item_name,
    qty: toNumber(row.qty),
    safeMin: toNumber(row.safe_min),
    safeMax: toNumber(row.safe_max),
    location: row.location,
    createdAt: toNumber(row.created_at),
    updatedAt: toNumber(row.updated_at),
  }
}

function mapInventoryMovement(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    itemId: row.item_id,
    sku: row.sku,
    itemName: row.item_name,
    actionType: row.action_type,
    qtyChange: toNumber(row.qty_change),
    beforeQty: toNumber(row.before_qty),
    afterQty: toNumber(row.after_qty),
    operator: row.operator,
    note: row.note || '',
    relatedId: row.related_id || '',
    createdAt: toNumber(row.created_at),
  }
}

function mapInventoryCheckTask(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    scope: row.scope,
    note: row.note || '',
    status: row.status,
    operator: row.operator,
    createdAt: toNumber(row.created_at),
    completedAt: row.completed_at == null ? undefined : toNumber(row.completed_at),
  }
}

function mapInventoryCheckItem(row) {
  if (!row) {
    return null
  }
  return {
    id: row.id,
    taskId: row.task_id,
    inventoryItemId: row.inventory_item_id,
    sku: row.sku,
    name: row.item_name,
    location: row.location,
    systemQty: toNumber(row.system_qty),
    actualQty: row.actual_qty == null ? undefined : toNumber(row.actual_qty),
    difference: row.difference_qty == null ? undefined : toNumber(row.difference_qty),
    status: row.status,
    note: row.note || '',
    createdAt: toNumber(row.created_at),
    updatedAt: row.updated_at == null ? undefined : toNumber(row.updated_at),
  }
}

function getInventoryStatus(item) {
  if (!item) {
    return 'normal'
  }
  if (toNumber(item.qty) < toNumber(item.safeMin)) {
    return 'low'
  }
  if (toNumber(item.qty) > toNumber(item.safeMax)) {
    return 'high'
  }
  return 'normal'
}

function defaultDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'yanjing_dev',
  }
}

function createSqlStore({ createDefaultDb }) {
  const dbConfig = defaultDbConfig()
  const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
  })

  let readyTask = null

  async function queryRows(sql, params = []) {
    await ensureReady()
    const [rows] = await pool.execute(sql, params)
    return rows
  }

  async function queryOne(sql, params = []) {
    const rows = await queryRows(sql, params)
    return rows[0] || null
  }

  async function withTransaction(task, skipEnsure = false) {
    if (!skipEnsure) {
      await ensureReady()
    }
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const result = await task(connection)
      await connection.commit()
      return result
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  async function nextCounterValue(connection, counterKey) {
    const [result] = await connection.execute(
      'UPDATE app_counters SET current_value = LAST_INSERT_ID(current_value + 1) WHERE counter_key = ?',
      [counterKey]
    )
    if (!result || result.affectedRows !== 1) {
      throw new Error(`缺少计数器: ${counterKey}`)
    }
    const [rows] = await connection.query('SELECT LAST_INSERT_ID() AS value')
    return toNumber(rows[0] && rows[0].value)
  }

  async function ensureReady() {
    if (!readyTask) {
      readyTask = (async () => {
        await pool.query('SELECT 1')
        const [rows] = await pool.query("SHOW TABLES LIKE 'app_counters'")
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error(`MySQL 库 ${dbConfig.database} 尚未初始化，请先执行 SQL 初始化脚本`)
        }
        const [counterRows] = await pool.query('SELECT COUNT(*) AS count FROM app_counters')
        if (toNumber(counterRows[0] && counterRows[0].count) === 0) {
          await withTransaction(async (connection) => {
            await seedDatabase(connection)
          }, true)
        }
      })().catch((error) => {
        readyTask = null
        throw error
      })
    }
    return readyTask
  }

  async function seedDatabase(connection) {
    const seed = createDefaultDb()
    await connection.query('SET FOREIGN_KEY_CHECKS = 0')
    await connection.execute('DELETE FROM inventory_check_items')
    await connection.execute('DELETE FROM inventory_check_tasks')
    await connection.execute('DELETE FROM inventory_movements')
    await connection.execute('DELETE FROM inventory_items')
    await connection.execute('DELETE FROM sales_exchanges')
    await connection.execute('DELETE FROM sales_returns')
    await connection.execute('DELETE FROM after_sale_records')
    await connection.execute('DELETE FROM after_sale_applies')
    await connection.execute('DELETE FROM appointments')
    await connection.execute('DELETE FROM vision_records')
    await connection.execute('DELETE FROM purchase_records')
    await connection.execute('DELETE FROM orders')
    await connection.execute('DELETE FROM members')
    await connection.execute('DELETE FROM settings')
    await connection.execute('DELETE FROM app_counters')
    await connection.query('SET FOREIGN_KEY_CHECKS = 1')

    for (const [counterKey, currentValue] of Object.entries({
      member: seed.counters.member,
      order: seed.counters.order,
      vision: seed.counters.vision,
      purchase: seed.counters.purchase,
      appointment: seed.counters.appointment,
      after_sale_apply: seed.counters.afterSaleApply,
      sales_return: seed.counters.salesReturn,
      sales_exchange: seed.counters.salesExchange,
      inventory_item: seed.counters.inventoryItem,
      inventory_movement: seed.counters.inventoryMovement,
      inventory_check_task: seed.counters.inventoryCheckTask,
      inventory_check_item: seed.counters.inventoryCheckItem,
    })) {
      await connection.execute(
        'INSERT INTO app_counters (counter_key, current_value) VALUES (?, ?)',
        [counterKey, currentValue]
      )
    }

    for (const member of seed.members) {
      await connection.execute(
        'INSERT INTO members (id, name, mobile, gender, birthday, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [member.id, member.name, member.mobile, member.gender, member.birthday, member.note, member.createdAt]
      )
    }

    for (const order of seed.orders) {
      await connection.execute(
        `INSERT INTO orders
          (id, order_no, member_id, member_name, order_type, item_name, quantity, unit_price, amount, status, note, created_at, paid_at, delivered_at, pay_channel)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id,
          order.orderNo,
          order.memberId,
          order.memberName,
          order.orderType,
          order.itemName,
          order.quantity,
          order.unitPrice,
          order.amount,
          order.status,
          order.note || '',
          order.createdAt,
          order.paidAt || null,
          order.deliveredAt || null,
          order.payChannel || null,
        ]
      )
    }

    for (const appointment of seed.appointments || []) {
      await connection.execute(
        `INSERT INTO appointments
          (id, customer_name, mobile, service_type, appointment_date, appointment_time, note, status, created_at, arrived_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointment.id,
          appointment.customerName,
          appointment.mobile,
          appointment.serviceType,
          appointment.date,
          appointment.time,
          appointment.note || '',
          appointment.status,
          appointment.createdAt,
          appointment.arrivedAt || null,
        ]
      )
    }

    for (const record of seed.afterSaleRecords || []) {
      await connection.execute(
        'INSERT INTO after_sale_records (order_id, followed, rechecked, updated_at) VALUES (?, ?, ?, ?)',
        [record.orderId, record.followed ? 1 : 0, record.rechecked ? 1 : 0, record.updatedAt]
      )
    }

    for (const apply of seed.afterSaleApplies || []) {
      await connection.execute(
        `INSERT INTO after_sale_applies
          (id, order_id, apply_type, reason, remark, phone, images, status, applicant, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          apply.id,
          apply.orderId,
          apply.type,
          apply.reason,
          apply.remark || '',
          apply.phone,
          JSON.stringify(apply.images || []),
          apply.status,
          apply.applicant,
          apply.createdAt,
        ]
      )
    }

    for (const record of seed.salesReturns || []) {
      await connection.execute(
        `INSERT INTO sales_returns
          (id, order_id, order_no, member_name, item_name, amount, reason, refund_channel, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.orderId,
          record.orderNo,
          record.memberName,
          record.itemName,
          record.amount,
          record.reason,
          record.refundChannel,
          record.createdAt,
        ]
      )
    }

    for (const record of seed.salesExchanges || []) {
      await connection.execute(
        `INSERT INTO sales_exchanges
          (id, order_id, order_no, member_name, original_item, original_amount, new_item, new_item_price, price_diff, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          record.id,
          record.orderId,
          record.orderNo,
          record.memberName,
          record.originalItem,
          record.originalAmount,
          record.newItem,
          record.newItemPrice,
          record.priceDiff,
          record.reason,
          record.createdAt,
        ]
      )
    }

    for (const record of seed.visionRecords) {
      await connection.execute(
        `INSERT INTO vision_records
          (id, member_id, exam_date, right_eye, left_eye, pd, suggestion, doctor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [record.id, record.memberId, record.examDate, record.rightEye, record.leftEye, record.pd, record.suggestion, record.doctor]
      )
    }

    for (const record of seed.purchaseRecords) {
      await connection.execute(
        `INSERT INTO purchase_records
          (id, record_type, item_name, sku, qty, unit_cost, supplier, operator, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [record.id, record.type, record.itemName, record.sku, record.qty, record.unitCost, record.supplier, record.operator, record.note || '', record.createdAt]
      )
    }

    for (const item of seed.inventoryItems || []) {
      await connection.execute(
        `INSERT INTO inventory_items
          (id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.id, item.sku, item.name, item.location, item.qty, item.safeMin, item.safeMax, item.createdAt, item.updatedAt]
      )
    }

    for (const movement of seed.inventoryMovements || []) {
      await connection.execute(
        `INSERT INTO inventory_movements
          (id, item_id, sku, item_name, action_type, qty_change, before_qty, after_qty, operator, note, related_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movement.id,
          movement.itemId,
          movement.sku,
          movement.itemName,
          movement.actionType,
          movement.qtyChange,
          movement.beforeQty,
          movement.afterQty,
          movement.operator,
          movement.note || '',
          movement.relatedId || '',
          movement.createdAt,
        ]
      )
    }

    for (const task of seed.inventoryCheckTasks || []) {
      await connection.execute(
        `INSERT INTO inventory_check_tasks
          (id, scope, note, status, operator, created_at, completed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [task.id, task.scope, task.note || '', task.status, task.operator, task.createdAt, task.completedAt || null]
      )
    }

    for (const item of seed.inventoryCheckItems || []) {
      await connection.execute(
        `INSERT INTO inventory_check_items
          (id, task_id, inventory_item_id, sku, item_name, location, system_qty, actual_qty, difference_qty, status, note, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.taskId,
          item.inventoryItemId,
          item.sku,
          item.name,
          item.location,
          item.systemQty,
          item.actualQty == null ? null : item.actualQty,
          item.difference == null ? null : item.difference,
          item.status,
          item.note || '',
          item.createdAt,
          item.updatedAt || null,
        ]
      )
    }

    await connection.execute(
      'INSERT INTO settings (id, payload, updated_at) VALUES (1, ?, ?)',
      [JSON.stringify(seed.settings), seed.settings.notice.updatedAt || Date.now()]
    )
  }

  async function findInventoryItemBySkuInConnection(connection, sku) {
    if (!sku) {
      return null
    }
    const [rows] = await connection.execute(
      'SELECT id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at FROM inventory_items WHERE sku = ? LIMIT 1',
      [sku]
    )
    return mapInventoryItem(rows[0] || null)
  }

  async function findInventoryItemByNameInConnection(connection, itemName) {
    if (!itemName) {
      return null
    }
    const [rows] = await connection.execute(
      'SELECT id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at FROM inventory_items WHERE item_name = ? ORDER BY updated_at DESC LIMIT 1',
      [itemName]
    )
    return mapInventoryItem(rows[0] || null)
  }

  async function findInventoryItemByIdInConnection(connection, itemId) {
    if (!itemId) {
      return null
    }
    const [rows] = await connection.execute(
      'SELECT id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at FROM inventory_items WHERE id = ? LIMIT 1',
      [itemId]
    )
    return mapInventoryItem(rows[0] || null)
  }

  async function createInventoryItemInConnection(connection, payload) {
    const currentValue = await nextCounterValue(connection, 'inventory_item')
    const createdAt = Date.now()
    const item = {
      id: `INV-${currentValue}`,
      sku: payload.sku || `AUTO-${currentValue}`,
      name: payload.itemName || payload.name || `库存商品 ${currentValue}`,
      location: payload.location || '待上架',
      qty: toNumber(payload.qty),
      safeMin: Math.max(0, toNumber(payload.safeMin, 10)),
      safeMax: Math.max(Math.max(0, toNumber(payload.safeMax, 50)), Math.max(0, toNumber(payload.safeMin, 10))),
      createdAt,
      updatedAt: createdAt,
    }
    await connection.execute(
      `INSERT INTO inventory_items
        (id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, item.sku, item.name, item.location, item.qty, item.safeMin, item.safeMax, item.createdAt, item.updatedAt]
    )
    return item
  }

  async function ensureInventoryItemInConnection(connection, payload) {
    const sku = payload.sku || ''
    const itemName = payload.itemName || payload.name || ''
    let item = null
    if (sku) {
      item = await findInventoryItemBySkuInConnection(connection, sku)
    }
    if (!item && itemName) {
      item = await findInventoryItemByNameInConnection(connection, itemName)
    }
    if (item) {
      if (itemName && itemName !== item.name) {
        await connection.execute(
          'UPDATE inventory_items SET item_name = ?, updated_at = ? WHERE id = ?',
          [itemName, Date.now(), item.id]
        )
        item.name = itemName
      }
      return item
    }
    return createInventoryItemInConnection(connection, {
      sku,
      itemName,
      qty: toNumber(payload.initialQty),
      safeMin: payload.safeMin,
      safeMax: payload.safeMax,
      location: payload.location,
    })
  }

  async function updateInventoryItemQtyInConnection(connection, itemId, nextQty, updatedAt) {
    await connection.execute(
      'UPDATE inventory_items SET qty = ?, updated_at = ? WHERE id = ?',
      [nextQty, updatedAt, itemId]
    )
  }

  async function insertInventoryMovementInConnection(connection, payload) {
    const currentValue = await nextCounterValue(connection, 'inventory_movement')
    const movement = {
      id: `LOG-${currentValue}`,
      itemId: payload.itemId,
      sku: payload.sku,
      itemName: payload.itemName,
      actionType: payload.actionType,
      qtyChange: payload.qtyChange,
      beforeQty: payload.beforeQty,
      afterQty: payload.afterQty,
      operator: payload.operator || '系统',
      note: payload.note || '',
      relatedId: payload.relatedId || '',
      createdAt: payload.createdAt || Date.now(),
    }
    await connection.execute(
      `INSERT INTO inventory_movements
        (id, item_id, sku, item_name, action_type, qty_change, before_qty, after_qty, operator, note, related_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        movement.id,
        movement.itemId,
        movement.sku,
        movement.itemName,
        movement.actionType,
        movement.qtyChange,
        movement.beforeQty,
        movement.afterQty,
        movement.operator,
        movement.note,
        movement.relatedId,
        movement.createdAt,
      ]
    )
    return movement
  }

  async function applyInventoryDeltaInConnection(connection, payload) {
    const item = await ensureInventoryItemInConnection(connection, {
      sku: payload.sku,
      itemName: payload.itemName,
      initialQty: 0,
      location: payload.location,
      safeMin: payload.safeMin,
      safeMax: payload.safeMax,
    })
    const beforeQty = toNumber(item.qty)
    const qtyChange = toNumber(payload.qtyChange)
    const updatedAt = payload.createdAt || Date.now()
    const afterQty = beforeQty + qtyChange
    await updateInventoryItemQtyInConnection(connection, item.id, afterQty, updatedAt)
    const movement = await insertInventoryMovementInConnection(connection, {
      itemId: item.id,
      sku: item.sku,
      itemName: item.name,
      actionType: payload.actionType,
      qtyChange,
      beforeQty,
      afterQty,
      operator: payload.operator,
      note: payload.note,
      relatedId: payload.relatedId,
      createdAt: updatedAt,
    })
    return {
      item: {
        ...item,
        qty: afterQty,
        updatedAt,
      },
      movement,
    }
  }

  async function setInventoryQtyInConnection(connection, payload) {
    const existingItem = payload.itemId
      ? await findInventoryItemByIdInConnection(connection, payload.itemId)
      : (await findInventoryItemBySkuInConnection(connection, payload.sku || '') || await findInventoryItemByNameInConnection(connection, payload.itemName || ''))
    if (!existingItem) {
      throw new Error('库存商品不存在')
    }
    const beforeQty = toNumber(existingItem.qty)
    const nextQty = toNumber(payload.newQty)
    const updatedAt = Date.now()
    await updateInventoryItemQtyInConnection(connection, existingItem.id, nextQty, updatedAt)
    const movement = await insertInventoryMovementInConnection(connection, {
      itemId: existingItem.id,
      sku: existingItem.sku,
      itemName: existingItem.name,
      actionType: payload.actionType,
      qtyChange: nextQty - beforeQty,
      beforeQty,
      afterQty: nextQty,
      operator: payload.operator,
      note: payload.note,
      relatedId: payload.relatedId,
      createdAt: updatedAt,
    })
    return {
      item: {
        ...existingItem,
        qty: nextQty,
        updatedAt,
      },
      movement,
    }
  }

  async function completeInventoryCheckTaskIfNeeded(connection, taskId) {
    const [rows] = await connection.execute(
      'SELECT COUNT(*) AS pendingCount FROM inventory_check_items WHERE task_id = ? AND status = ?',
      [taskId, 'pending']
    )
    const pendingCount = toNumber(rows[0] && rows[0].pendingCount)
    if (pendingCount === 0) {
      await connection.execute(
        'UPDATE inventory_check_tasks SET status = ?, completed_at = ? WHERE id = ? AND status <> ?',
        ['done', Date.now(), taskId, 'done']
      )
    }
  }

  return {
    async init() {
      await ensureReady()
      return {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
      }
    },

    async close() {
      await pool.end()
    },

    getDbConfig() {
      return {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
      }
    },

    async getCounts() {
      const row = await queryOne(
        `SELECT
           (SELECT COUNT(*) FROM members) AS members,
           (SELECT COUNT(*) FROM orders) AS orders,
           (SELECT COUNT(*) FROM appointments) AS appointments,
           (SELECT COUNT(*) FROM after_sale_applies) AS afterSaleApplies,
           (SELECT COUNT(*) FROM sales_returns) AS salesReturns,
           (SELECT COUNT(*) FROM sales_exchanges) AS salesExchanges,
           (SELECT COUNT(*) FROM inventory_items) AS inventoryItems,
           (SELECT COUNT(*) FROM inventory_check_tasks) AS inventoryCheckTasks`
      )
      return {
        members: toNumber(row && row.members),
        orders: toNumber(row && row.orders),
        appointments: toNumber(row && row.appointments),
        afterSaleApplies: toNumber(row && row.afterSaleApplies),
        salesReturns: toNumber(row && row.salesReturns),
        salesExchanges: toNumber(row && row.salesExchanges),
        inventoryItems: toNumber(row && row.inventoryItems),
        inventoryCheckTasks: toNumber(row && row.inventoryCheckTasks),
      }
    },

    async reset() {
      return withTransaction(async (connection) => {
        await seedDatabase(connection)
      })
    },

    async listMembers(keyword = '') {
      const normalizedKeyword = keyword.trim()
      const params = []
      let sql = 'SELECT id, name, mobile, gender, birthday, note, created_at FROM members'
      if (normalizedKeyword) {
        sql += ' WHERE name LIKE ? OR mobile LIKE ?'
        const pattern = `%${normalizedKeyword}%`
        params.push(pattern, pattern)
      }
      sql += ' ORDER BY created_at DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapMember(row))
    },

    async findMemberById(memberId) {
      const row = await queryOne(
        'SELECT id, name, mobile, gender, birthday, note, created_at FROM members WHERE id = ? LIMIT 1',
        [memberId]
      )
      return mapMember(row)
    },

    async findMemberByMobile(mobile) {
      const row = await queryOne(
        'SELECT id, name, mobile, gender, birthday, note, created_at FROM members WHERE mobile = ? LIMIT 1',
        [mobile]
      )
      return mapMember(row)
    },

    async createMember(payload) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'member')
        const created = {
          id: `MEM-${currentValue}`,
          name: payload.name,
          mobile: payload.mobile,
          gender: payload.gender,
          birthday: payload.birthday,
          note: payload.note,
          createdAt: Date.now(),
        }
        await connection.execute(
          'INSERT INTO members (id, name, mobile, gender, birthday, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [created.id, created.name, created.mobile, created.gender, created.birthday, created.note, created.createdAt]
        )
        return created
      })
    },

    async listOrders({ status = '', keyword = '' } = {}) {
      const conditions = []
      const params = []
      if (status) {
        conditions.push('status = ?')
        params.push(status)
      }
      if (keyword.trim()) {
        const pattern = `%${keyword.trim()}%`
        conditions.push('(order_no LIKE ? OR member_name LIKE ? OR item_name LIKE ?)')
        params.push(pattern, pattern, pattern)
      }
      let sql = 'SELECT * FROM orders'
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`
      }
      sql += ' ORDER BY created_at DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapOrder(row))
    },

    async findOrderById(orderId) {
      const row = await queryOne('SELECT * FROM orders WHERE id = ? LIMIT 1', [orderId])
      return mapOrder(row)
    },

    async createOrder(payload, member) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'order')
        const createdAt = Date.now()
        const created = {
          id: `ORD-${currentValue}`,
          orderNo: buildOrderNo(currentValue, createdAt),
          memberId: member.id,
          memberName: member.name,
          orderType: payload.orderType,
          itemName: payload.itemName,
          quantity: payload.quantity,
          unitPrice: payload.unitPrice,
          amount: Number((payload.quantity * payload.unitPrice).toFixed(2)),
          status: 'awaiting_payment',
          note: payload.note || '',
          createdAt,
        }
        await connection.execute(
          `INSERT INTO orders
            (id, order_no, member_id, member_name, order_type, item_name, quantity, unit_price, amount, status, note, created_at, paid_at, delivered_at, pay_channel)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)`,
          [
            created.id,
            created.orderNo,
            created.memberId,
            created.memberName,
            created.orderType,
            created.itemName,
            created.quantity,
            created.unitPrice,
            created.amount,
            created.status,
            created.note,
            created.createdAt,
          ]
        )
        return created
      })
    },

    async markOrderPaid(orderId, payChannel) {
      const paidAt = Date.now()
      await queryRows(
        'UPDATE orders SET status = ?, paid_at = ?, pay_channel = ? WHERE id = ?',
        ['ready_delivery', paidAt, payChannel, orderId]
      )
      return this.findOrderById(orderId)
    },

    async markOrderDelivered(orderId) {
      const deliveredAt = Date.now()
      await queryRows(
        'UPDATE orders SET status = ?, delivered_at = ? WHERE id = ?',
        ['completed', deliveredAt, orderId]
      )
      return this.findOrderById(orderId)
    },

    async listAppointments({ status = '', keyword = '', viewer = null } = {}) {
      const conditions = []
      const params = []
      if (viewer && viewer.role === 'customer') {
        conditions.push('mobile = ?')
        params.push(viewer.mobile)
      }
      if (status) {
        conditions.push('status = ?')
        params.push(status)
      }
      if (keyword.trim()) {
        const pattern = `%${keyword.trim()}%`
        conditions.push('(id LIKE ? OR customer_name LIKE ? OR mobile LIKE ? OR note LIKE ? OR appointment_date LIKE ? OR appointment_time LIKE ?)')
        params.push(pattern, pattern, pattern, pattern, pattern, pattern)
      }
      let sql = 'SELECT * FROM appointments'
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`
      }
      sql += ' ORDER BY created_at DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapAppointment(row))
    },

    async findAppointmentById(appointmentId) {
      const row = await queryOne('SELECT * FROM appointments WHERE id = ? LIMIT 1', [appointmentId])
      return mapAppointment(row)
    },

    async createAppointment(payload) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'appointment')
        const created = {
          id: `APT-${currentValue}`,
          customerName: payload.customerName,
          mobile: payload.mobile,
          serviceType: payload.serviceType,
          date: payload.date,
          time: payload.time,
          note: payload.note || '',
          status: 'pending',
          createdAt: Date.now(),
        }
        await connection.execute(
          `INSERT INTO appointments
            (id, customer_name, mobile, service_type, appointment_date, appointment_time, note, status, created_at, arrived_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
          [
            created.id,
            created.customerName,
            created.mobile,
            created.serviceType,
            created.date,
            created.time,
            created.note,
            created.status,
            created.createdAt,
          ]
        )
        return created
      })
    },

    async markAppointmentArrived(appointmentId) {
      const arrivedAt = Date.now()
      await queryRows(
        'UPDATE appointments SET status = ?, arrived_at = ? WHERE id = ?',
        ['done', arrivedAt, appointmentId]
      )
      return this.findAppointmentById(appointmentId)
    },

    async listAfterSaleRecords(viewer = null) {
      let sql = 'SELECT order_id, followed, rechecked, updated_at FROM after_sale_records'
      const params = []
      if (viewer && viewer.role === 'customer') {
        sql += ' WHERE order_id IN (SELECT DISTINCT order_id FROM after_sale_applies WHERE phone = ?)'
        params.push(viewer.mobile)
      }
      sql += ' ORDER BY updated_at DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapAfterSaleRecord(row))
    },

    async findAfterSaleRecordByOrderId(orderId) {
      const row = await queryOne(
        'SELECT order_id, followed, rechecked, updated_at FROM after_sale_records WHERE order_id = ? LIMIT 1',
        [orderId]
      )
      return mapAfterSaleRecord(row)
    },

    async listAfterSaleApplies({ status = '', keyword = '', viewer = null } = {}) {
      const conditions = []
      const params = []
      if (viewer && viewer.role === 'customer') {
        conditions.push('phone = ?')
        params.push(viewer.mobile)
      }
      if (status) {
        conditions.push('status = ?')
        params.push(status)
      }
      if (keyword.trim()) {
        const pattern = `%${keyword.trim()}%`
        conditions.push('(id LIKE ? OR order_id LIKE ? OR applicant LIKE ? OR reason LIKE ? OR remark LIKE ?)')
        params.push(pattern, pattern, pattern, pattern, pattern)
      }
      let sql = 'SELECT * FROM after_sale_applies'
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`
      }
      sql += ' ORDER BY created_at DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapAfterSaleApply(row))
    },

    async listSalesReturns() {
      const rows = await queryRows(
        'SELECT id, order_id, order_no, member_name, item_name, amount, reason, refund_channel, created_at FROM sales_returns ORDER BY created_at DESC'
      )
      return rows.map((row) => mapSalesReturn(row))
    },

    async createSalesReturn(payload) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'sales_return')
        const created = {
          id: `RT-${currentValue}`,
          orderId: payload.orderId,
          orderNo: payload.orderNo,
          memberName: payload.memberName,
          itemName: payload.itemName,
          amount: payload.amount,
          reason: payload.reason,
          refundChannel: payload.refundChannel,
          createdAt: Date.now(),
        }
        await connection.execute(
          `INSERT INTO sales_returns
            (id, order_id, order_no, member_name, item_name, amount, reason, refund_channel, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            created.id,
            created.orderId,
            created.orderNo,
            created.memberName,
            created.itemName,
            created.amount,
            created.reason,
            created.refundChannel,
            created.createdAt,
          ]
        )
        await applyInventoryDeltaInConnection(connection, {
          itemName: created.itemName,
          qtyChange: Math.max(1, toNumber(payload.quantity, 1)),
          actionType: 'sales_return',
          operator: payload.operator,
          note: created.reason,
          relatedId: created.id,
        })
        return created
      })
    },

    async listSalesExchanges() {
      const rows = await queryRows(
        'SELECT id, order_id, order_no, member_name, original_item, new_item, price_diff, reason, created_at FROM sales_exchanges ORDER BY created_at DESC'
      )
      return rows.map((row) => mapSalesExchange(row))
    },

    async createSalesExchange(payload) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'sales_exchange')
        const created = {
          id: `EX-${currentValue}`,
          orderId: payload.orderId,
          orderNo: payload.orderNo,
          memberName: payload.memberName,
          originalItem: payload.originalItem,
          originalAmount: payload.originalAmount,
          newItem: payload.newItem,
          newItemPrice: payload.newItemPrice,
          priceDiff: Number((payload.newItemPrice - payload.originalAmount).toFixed(2)),
          reason: payload.reason,
          createdAt: Date.now(),
        }
        await connection.execute(
          `INSERT INTO sales_exchanges
            (id, order_id, order_no, member_name, original_item, original_amount, new_item, new_item_price, price_diff, reason, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            created.id,
            created.orderId,
            created.orderNo,
            created.memberName,
            created.originalItem,
            created.originalAmount,
            created.newItem,
            created.newItemPrice,
            created.priceDiff,
            created.reason,
            created.createdAt,
          ]
        )
        const quantity = Math.max(1, toNumber(payload.quantity, 1))
        await applyInventoryDeltaInConnection(connection, {
          itemName: created.originalItem,
          qtyChange: quantity,
          actionType: 'sales_exchange_in',
          operator: payload.operator,
          note: created.reason,
          relatedId: created.id,
        })
        await applyInventoryDeltaInConnection(connection, {
          itemName: created.newItem,
          qtyChange: -quantity,
          actionType: 'sales_exchange_out',
          operator: payload.operator,
          note: created.reason,
          relatedId: created.id,
        })
        return created
      })
    },

    async createAfterSaleApply(payload) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'after_sale_apply')
        const created = {
          id: `AS-${currentValue}`,
          orderId: payload.orderId,
          type: payload.type,
          reason: payload.reason,
          remark: payload.remark || '',
          phone: payload.phone,
          images: payload.images || [],
          status: 'pending',
          applicant: payload.applicant,
          createdAt: Date.now(),
        }
        await connection.execute(
          `INSERT INTO after_sale_applies
            (id, order_id, apply_type, reason, remark, phone, images, status, applicant, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            created.id,
            created.orderId,
            created.type,
            created.reason,
            created.remark,
            created.phone,
            JSON.stringify(created.images),
            created.status,
            created.applicant,
            created.createdAt,
          ]
        )
        return created
      })
    },

    async markAfterSaleFollowup(orderId) {
      const updatedAt = Date.now()
      return withTransaction(async (connection) => {
        const [rows] = await connection.execute(
          'SELECT order_id, followed, rechecked, updated_at FROM after_sale_records WHERE order_id = ? LIMIT 1',
          [orderId]
        )
        if (Array.isArray(rows) && rows.length > 0) {
          await connection.execute(
            'UPDATE after_sale_records SET followed = 1, updated_at = ? WHERE order_id = ?',
            [updatedAt, orderId]
          )
        } else {
          await connection.execute(
            'INSERT INTO after_sale_records (order_id, followed, rechecked, updated_at) VALUES (?, 1, 0, ?)',
            [orderId, updatedAt]
          )
        }
        await connection.execute(
          "UPDATE after_sale_applies SET status = 'followed_up' WHERE order_id = ? AND status = 'pending'",
          [orderId]
        )
        const [recordRows] = await connection.execute(
          'SELECT order_id, followed, rechecked, updated_at FROM after_sale_records WHERE order_id = ? LIMIT 1',
          [orderId]
        )
        return mapAfterSaleRecord(recordRows[0] || null)
      })
    },

    async markAfterSaleRecheck(orderId) {
      const updatedAt = Date.now()
      return withTransaction(async (connection) => {
        const [rows] = await connection.execute(
          'SELECT order_id, followed, rechecked, updated_at FROM after_sale_records WHERE order_id = ? LIMIT 1',
          [orderId]
        )
        if (Array.isArray(rows) && rows.length > 0) {
          await connection.execute(
            'UPDATE after_sale_records SET followed = 1, rechecked = 1, updated_at = ? WHERE order_id = ?',
            [updatedAt, orderId]
          )
        } else {
          await connection.execute(
            'INSERT INTO after_sale_records (order_id, followed, rechecked, updated_at) VALUES (?, 1, 1, ?)',
            [orderId, updatedAt]
          )
        }
        await connection.execute(
          "UPDATE after_sale_applies SET status = 'completed' WHERE order_id = ? AND status IN ('pending', 'followed_up')",
          [orderId]
        )
        const [recordRows] = await connection.execute(
          'SELECT order_id, followed, rechecked, updated_at FROM after_sale_records WHERE order_id = ? LIMIT 1',
          [orderId]
        )
        return mapAfterSaleRecord(recordRows[0] || null)
      })
    },

    async listVisionRecords(memberId = '') {
      const params = []
      let sql = 'SELECT id, member_id, exam_date, right_eye, left_eye, pd, suggestion, doctor FROM vision_records'
      if (memberId) {
        sql += ' WHERE member_id = ?'
        params.push(memberId)
      }
      sql += ' ORDER BY exam_date DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapVisionRecord(row))
    },

    async createVisionRecord(payload) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'vision')
        const created = {
          id: `VR-${currentValue}`,
          memberId: payload.memberId,
          examDate: payload.examDate,
          rightEye: payload.rightEye,
          leftEye: payload.leftEye,
          pd: payload.pd,
          suggestion: payload.suggestion || '',
          doctor: payload.doctor,
        }
        await connection.execute(
          `INSERT INTO vision_records
            (id, member_id, exam_date, right_eye, left_eye, pd, suggestion, doctor)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [created.id, created.memberId, created.examDate, created.rightEye, created.leftEye, created.pd, created.suggestion, created.doctor]
        )
        return created
      })
    },

    async listPurchaseRecords() {
      const rows = await queryRows(
        'SELECT id, record_type, item_name, sku, qty, unit_cost, supplier, operator, note, created_at FROM purchase_records ORDER BY created_at DESC'
      )
      return rows.map((row) => mapPurchaseRecord(row))
    },

    async createPurchaseRecord(payload) {
      return withTransaction(async (connection) => {
        const currentValue = await nextCounterValue(connection, 'purchase')
        const created = {
          id: `PO-${currentValue}`,
          type: payload.type,
          itemName: payload.itemName,
          sku: payload.sku,
          qty: payload.qty,
          unitCost: payload.unitCost,
          supplier: payload.supplier,
          operator: payload.operator,
          note: payload.note || '',
          createdAt: Date.now(),
        }
        await connection.execute(
          `INSERT INTO purchase_records
            (id, record_type, item_name, sku, qty, unit_cost, supplier, operator, note, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [created.id, created.type, created.itemName, created.sku, created.qty, created.unitCost, created.supplier, created.operator, created.note, created.createdAt]
        )
        const qtyChange = created.type === 'return' ? -created.qty : created.qty
        const safeMin = created.type === 'frame' ? 5 : 10
        const safeMax = Math.max(created.qty * 2, created.type === 'frame' ? 40 : 50)
        await applyInventoryDeltaInConnection(connection, {
          sku: created.sku,
          itemName: created.itemName,
          qtyChange,
          actionType: created.type === 'return'
            ? 'purchase_return'
            : (created.type === 'frame' ? 'purchase_frame_inbound' : (created.type === 'inbound' ? 'purchase_inbound' : 'purchase_order')),
          operator: created.operator,
          note: created.note,
          relatedId: created.id,
          safeMin,
          safeMax,
        })
        return created
      })
    },

    async listInventoryItems({ status = '', keyword = '' } = {}) {
      const rows = await queryRows(
        'SELECT id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at FROM inventory_items ORDER BY updated_at DESC, created_at DESC'
      )
      const list = rows
        .map((row) => mapInventoryItem(row))
        .filter((item) => {
          if (!item) {
            return false
          }
          const inventoryStatus = getInventoryStatus(item)
          if (status && status !== 'all' && inventoryStatus !== status) {
            return false
          }
          if (!keyword.trim()) {
            return true
          }
          const normalizedKeyword = keyword.trim()
          return item.name.includes(normalizedKeyword) || item.sku.includes(normalizedKeyword) || item.location.includes(normalizedKeyword)
        })
      return list
    },

    async findInventoryItemById(itemId) {
      const row = await queryOne(
        'SELECT id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at FROM inventory_items WHERE id = ? LIMIT 1',
        [itemId]
      )
      return mapInventoryItem(row)
    },

    async listInventoryMovements(keyword = '') {
      const params = []
      let sql = 'SELECT id, item_id, sku, item_name, action_type, qty_change, before_qty, after_qty, operator, note, related_id, created_at FROM inventory_movements'
      if (keyword.trim()) {
        const pattern = `%${keyword.trim()}%`
        sql += ' WHERE sku LIKE ? OR item_name LIKE ? OR action_type LIKE ? OR operator LIKE ? OR note LIKE ?'
        params.push(pattern, pattern, pattern, pattern, pattern)
      }
      sql += ' ORDER BY created_at DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapInventoryMovement(row))
    },

    async adjustInventoryItem(itemId, payload) {
      return withTransaction(async (connection) => {
        const updated = await setInventoryQtyInConnection(connection, {
          itemId,
          newQty: payload.newQty,
          actionType: 'manual_adjust',
          operator: payload.operator,
          note: payload.note,
          relatedId: itemId,
        })
        return updated.item
      })
    },

    async listInventoryCheckTasks({ status = '' } = {}) {
      const params = []
      let sql = 'SELECT id, scope, note, status, operator, created_at, completed_at FROM inventory_check_tasks'
      if (status) {
        sql += ' WHERE status = ?'
        params.push(status)
      }
      sql += ' ORDER BY created_at DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapInventoryCheckTask(row))
    },

    async listInventoryCheckItems({ status = '', keyword = '' } = {}) {
      const params = []
      const conditions = []
      if (status) {
        conditions.push('ci.status = ?')
        params.push(status)
      }
      if (keyword.trim()) {
        const pattern = `%${keyword.trim()}%`
        conditions.push('(ci.sku LIKE ? OR ci.item_name LIKE ? OR ci.location LIKE ?)')
        params.push(pattern, pattern, pattern)
      }
      let sql = `
        SELECT
          ci.id,
          ci.task_id,
          ci.inventory_item_id,
          ci.sku,
          ci.item_name,
          ci.location,
          ci.system_qty,
          ci.actual_qty,
          ci.difference_qty,
          ci.status,
          ci.note,
          ci.created_at,
          ci.updated_at
        FROM inventory_check_items ci
      `
      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(' AND ')}`
      }
      sql += ' ORDER BY ci.created_at DESC, ci.id DESC'
      const rows = await queryRows(sql, params)
      return rows.map((row) => mapInventoryCheckItem(row))
    },

    async createInventoryCheckTask(payload) {
      return withTransaction(async (connection) => {
        const [itemRows] = await connection.execute(
          'SELECT id, sku, item_name, location, qty, safe_min, safe_max, created_at, updated_at FROM inventory_items ORDER BY updated_at DESC, created_at DESC'
        )
        const stockItems = itemRows
          .map((row) => mapInventoryItem(row))
          .filter((item) => {
            if (!item) {
              return false
            }
            const inventoryStatus = getInventoryStatus(item)
            if (payload.scope === 'low') {
              return inventoryStatus === 'low'
            }
            if (payload.scope === 'high') {
              return inventoryStatus === 'high'
            }
            return true
          })

        if (stockItems.length === 0) {
          return null
        }

        const currentValue = await nextCounterValue(connection, 'inventory_check_task')
        const createdAt = Date.now()
        const task = {
          id: `TASK-${currentValue}`,
          scope: payload.scope,
          note: payload.note || '',
          status: 'ongoing',
          operator: payload.operator || '系统',
          createdAt,
        }

        await connection.execute(
          `INSERT INTO inventory_check_tasks
            (id, scope, note, status, operator, created_at, completed_at)
           VALUES (?, ?, ?, ?, ?, ?, NULL)`,
          [task.id, task.scope, task.note, task.status, task.operator, task.createdAt]
        )

        for (const stockItem of stockItems) {
          const itemCounter = await nextCounterValue(connection, 'inventory_check_item')
          await connection.execute(
            `INSERT INTO inventory_check_items
              (id, task_id, inventory_item_id, sku, item_name, location, system_qty, actual_qty, difference_qty, status, note, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, '', ?, NULL)`,
            [`CHK-${itemCounter}`, task.id, stockItem.id, stockItem.sku, stockItem.name, stockItem.location, stockItem.qty, 'pending', createdAt]
          )
        }

        return task
      })
    },

    async submitInventoryCheckItem(itemId, actualQty) {
      return withTransaction(async (connection) => {
        const [rows] = await connection.execute(
          'SELECT id, task_id, inventory_item_id, sku, item_name, location, system_qty, actual_qty, difference_qty, status, note, created_at, updated_at FROM inventory_check_items WHERE id = ? LIMIT 1',
          [itemId]
        )
        const item = mapInventoryCheckItem(rows[0] || null)
        if (!item) {
          return null
        }
        const difference = toNumber(actualQty) - toNumber(item.systemQty)
        const updatedAt = Date.now()
        const nextStatus = difference === 0 ? 'done' : 'difference'
        await connection.execute(
          'UPDATE inventory_check_items SET actual_qty = ?, difference_qty = ?, status = ?, updated_at = ? WHERE id = ?',
          [actualQty, difference, nextStatus, updatedAt, itemId]
        )
        await completeInventoryCheckTaskIfNeeded(connection, item.taskId)
        const [updatedRows] = await connection.execute(
          'SELECT id, task_id, inventory_item_id, sku, item_name, location, system_qty, actual_qty, difference_qty, status, note, created_at, updated_at FROM inventory_check_items WHERE id = ? LIMIT 1',
          [itemId]
        )
        return mapInventoryCheckItem(updatedRows[0] || null)
      })
    },

    async submitInventoryCheckItemsBatch(items) {
      return withTransaction(async (connection) => {
        const updatedItems = []
        const touchedTaskIds = new Set()
        for (const item of items) {
          const [rows] = await connection.execute(
            'SELECT id, task_id, inventory_item_id, sku, item_name, location, system_qty, actual_qty, difference_qty, status, note, created_at, updated_at FROM inventory_check_items WHERE id = ? LIMIT 1',
            [item.id]
          )
          const currentItem = mapInventoryCheckItem(rows[0] || null)
          if (!currentItem) {
            continue
          }
          const difference = toNumber(item.actualQty) - toNumber(currentItem.systemQty)
          const updatedAt = Date.now()
          const nextStatus = difference === 0 ? 'done' : 'difference'
          await connection.execute(
            'UPDATE inventory_check_items SET actual_qty = ?, difference_qty = ?, status = ?, updated_at = ? WHERE id = ?',
            [item.actualQty, difference, nextStatus, updatedAt, item.id]
          )
          touchedTaskIds.add(currentItem.taskId)
          updatedItems.push({
            ...currentItem,
            actualQty: item.actualQty,
            difference,
            status: nextStatus,
            updatedAt,
          })
        }
        for (const taskId of touchedTaskIds) {
          await completeInventoryCheckTaskIfNeeded(connection, taskId)
        }
        return updatedItems
      })
    },

    async resolveInventoryCheckItem(itemId, payload) {
      return withTransaction(async (connection) => {
        const [rows] = await connection.execute(
          'SELECT id, task_id, inventory_item_id, sku, item_name, location, system_qty, actual_qty, difference_qty, status, note, created_at, updated_at FROM inventory_check_items WHERE id = ? LIMIT 1',
          [itemId]
        )
        const item = mapInventoryCheckItem(rows[0] || null)
        if (!item) {
          return null
        }

        const updatedAt = Date.now()
        let actualQty = item.actualQty == null ? item.systemQty : item.actualQty
        let difference = item.difference == null ? 0 : item.difference

        if (payload.action === 'adjust') {
          await setInventoryQtyInConnection(connection, {
            itemId: item.inventoryItemId,
            newQty: actualQty,
            actionType: 'stock_check_adjust',
            operator: payload.operator,
            note: payload.note || item.note,
            relatedId: item.id,
          })
          difference = 0
        } else {
          actualQty = item.systemQty
          difference = 0
        }

        await connection.execute(
          'UPDATE inventory_check_items SET actual_qty = ?, difference_qty = ?, status = ?, updated_at = ? WHERE id = ?',
          [actualQty, difference, 'done', updatedAt, itemId]
        )
        await completeInventoryCheckTaskIfNeeded(connection, item.taskId)
        const [updatedRows] = await connection.execute(
          'SELECT id, task_id, inventory_item_id, sku, item_name, location, system_qty, actual_qty, difference_qty, status, note, created_at, updated_at FROM inventory_check_items WHERE id = ? LIMIT 1',
          [itemId]
        )
        return mapInventoryCheckItem(updatedRows[0] || null)
      })
    },

    async getSettings() {
      const row = await queryOne('SELECT payload FROM settings WHERE id = 1 LIMIT 1')
      const payload = parseJson(row && row.payload, {})
      return payload
    },

    async saveSettings(settings) {
      const updatedAt = settings.notice && settings.notice.updatedAt ? settings.notice.updatedAt : Date.now()
      await queryRows(
        'REPLACE INTO settings (id, payload, updated_at) VALUES (1, ?, ?)',
        [JSON.stringify(settings), updatedAt]
      )
      return settings
    },
  }
}

module.exports = {
  createSqlStore,
}
