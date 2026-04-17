const express = require('express')
const { createSqlStore } = require('./sql-store')

const app = express()
app.use(express.json())

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

const DEV_TOKEN_PREFIX = 'dev-token-'
const rawUsersByToken = new Map()
const usersByToken = {
  has(token) {
    if (rawUsersByToken.has(token)) {
      return true
    }
    const role = parseRoleFromDevToken(token)
    if (!role) {
      return false
    }
    rawUsersByToken.set(token, buildUserProfile(role))
    return true
  },
  get(token) {
    if (!this.has(token)) {
      return undefined
    }
    return rawUsersByToken.get(token)
  },
  set(token, profile) {
    rawUsersByToken.set(token, profile)
    return this
  },
  clear() {
    rawUsersByToken.clear()
  },
}

function now() {
  return Date.now()
}

function createRequestId() {
  return `REQ-${now()}-${Math.random().toString(36).slice(2, 8)}`
}

function success(data, message = 'ok') {
  return {
    code: 0,
    message,
    data,
    requestId: createRequestId(),
  }
}

function failure(res, status, code, message) {
  res.status(status).json({
    code,
    message,
    data: null,
    requestId: createRequestId(),
  })
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}

function asObject(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {}
  }
  return raw
}

function readStringField(source, keys, fallback = '') {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string') {
      return value.trim()
    }
  }
  return fallback
}

function readNumberField(source, keys, fallback = 0) {
  for (const key of keys) {
    const value = Number(source[key])
    if (Number.isFinite(value)) {
      return value
    }
  }
  return fallback
}

function readBooleanField(source, keys, fallback = false) {
  for (const key of keys) {
    if (typeof source[key] === 'boolean') {
      return source[key]
    }
  }
  return fallback
}

function normalizeRole(role) {
  if (role === 'customer' || role === 'sales' || role === 'manager') {
    return role
  }
  return 'sales'
}

function parseRoleFromDevToken(token = '') {
  if (!token.startsWith(DEV_TOKEN_PREFIX)) {
    return ''
  }
  const parts = token.slice(DEV_TOKEN_PREFIX.length).split('-')
  const role = parts[0]
  return role === 'customer' || role === 'sales' || role === 'manager' ? role : ''
}

function parseBearerToken(authHeader = '') {
  const matched = authHeader.match(/^Bearer\s+(.+)$/i)
  return matched ? matched[1] : ''
}

function defaultPermissionsByRole(role) {
  if (role === 'manager') {
    return [
      'member:create',
      'member:read',
      'order:create',
      'order:pay',
      'order:deliver',
      'report:read:all',
      'inventory:manage',
      'purchase:manage',
      'setting:manage',
    ]
  }
  if (role === 'sales') {
    return [
      'member:create',
      'member:read',
      'order:create',
      'order:pay',
      'order:deliver',
      'report:read:self',
    ]
  }
  return ['order:read:self', 'appointment:create', 'profile:read:self']
}

function buildUserProfile(role) {
  const normalizedRole = normalizeRole(role)
  const profiles = {
    customer: {
      userId: 'C001',
      userName: '张先生',
      storeId: 'STORE-001',
      storeName: '大锤配镜伊宁店',
      mobile: '13800000001',
    },
    sales: {
      userId: 'S001',
      userName: '吴家伟',
      storeId: 'STORE-001',
      storeName: '大锤配镜伊宁店',
      mobile: '13800000002',
    },
    manager: {
      userId: 'M001',
      userName: '店长',
      storeId: 'STORE-001',
      storeName: '大锤配镜伊宁店',
      mobile: '13800000003',
    },
  }
  const profile = profiles[normalizedRole]
  return {
    ...profile,
    role: normalizedRole,
    permissions: defaultPermissionsByRole(normalizedRole),
  }
}

function serializeLoginResult(result) {
  return {
    token: result.token,
    refreshToken: result.refreshToken,
    refresh_token: result.refreshToken,
    expiresAt: result.expiresAt,
    expires_at: result.expiresAt,
  }
}

function serializeUserProfile(profile) {
  return {
    userId: profile.userId,
    user_id: profile.userId,
    userName: profile.userName,
    user_name: profile.userName,
    role: profile.role,
    permissions: [...profile.permissions],
    storeId: profile.storeId,
    store_id: profile.storeId,
    storeName: profile.storeName,
    store_name: profile.storeName,
    mobile: profile.mobile,
    phone: profile.mobile,
  }
}

function serializeMember(member) {
  return {
    id: member.id,
    member_id: member.id,
    name: member.name,
    member_name: member.name,
    mobile: member.mobile,
    phone: member.mobile,
    gender: member.gender,
    birthday: member.birthday,
    note: member.note,
    createdAt: member.createdAt,
    created_at: member.createdAt,
  }
}

function serializeOrder(order) {
  return {
    id: order.id,
    order_id: order.id,
    orderNo: order.orderNo,
    order_no: order.orderNo,
    memberId: order.memberId,
    member_id: order.memberId,
    memberName: order.memberName,
    member_name: order.memberName,
    orderType: order.orderType,
    order_type: order.orderType,
    itemName: order.itemName,
    item_name: order.itemName,
    quantity: order.quantity,
    unitPrice: order.unitPrice,
    unit_price: order.unitPrice,
    amount: order.amount,
    status: order.status,
    note: order.note || '',
    createdAt: order.createdAt,
    created_at: order.createdAt,
    paidAt: order.paidAt || 0,
    paid_at: order.paidAt || 0,
    deliveredAt: order.deliveredAt || 0,
    delivered_at: order.deliveredAt || 0,
    payChannel: order.payChannel || '',
    pay_channel: order.payChannel || '',
  }
}

function serializeVisionRecord(record) {
  return {
    id: record.id,
    record_id: record.id,
    memberId: record.memberId,
    member_id: record.memberId,
    examDate: record.examDate,
    exam_date: record.examDate,
    rightEye: record.rightEye,
    right_eye: record.rightEye,
    leftEye: record.leftEye,
    left_eye: record.leftEye,
    pd: record.pd,
    suggestion: record.suggestion,
    doctor: record.doctor,
  }
}

function serializePurchaseRecord(record) {
  return {
    id: record.id,
    record_id: record.id,
    type: record.type,
    record_type: record.type,
    itemName: record.itemName,
    item_name: record.itemName,
    sku: record.sku,
    qty: record.qty,
    quantity: record.qty,
    unitCost: record.unitCost,
    unit_cost: record.unitCost,
    supplier: record.supplier,
    operator: record.operator,
    note: record.note,
    remark: record.note,
    createdAt: record.createdAt,
    created_at: record.createdAt,
  }
}

function serializeAppointment(record) {
  return {
    id: record.id,
    appointment_id: record.id,
    customerName: record.customerName,
    customer_name: record.customerName,
    mobile: record.mobile,
    phone: record.mobile,
    serviceType: record.serviceType,
    service_type: record.serviceType,
    date: record.date,
    appointmentDate: record.date,
    appointment_date: record.date,
    time: record.time,
    appointmentTime: record.time,
    appointment_time: record.time,
    note: record.note,
    remark: record.note,
    status: record.status,
    createdAt: record.createdAt,
    created_at: record.createdAt,
    arrivedAt: record.arrivedAt || 0,
    arrived_at: record.arrivedAt || 0,
  }
}

function serializeAfterSaleRecord(record) {
  return {
    orderId: record.orderId,
    order_id: record.orderId,
    followed: record.followed,
    rechecked: record.rechecked,
    updatedAt: record.updatedAt,
    updated_at: record.updatedAt,
  }
}

function serializeAfterSaleApply(apply) {
  return {
    id: apply.id,
    apply_id: apply.id,
    orderId: apply.orderId,
    order_id: apply.orderId,
    type: apply.type,
    apply_type: apply.type,
    reason: apply.reason,
    remark: apply.remark,
    note: apply.remark,
    phone: apply.phone,
    mobile: apply.phone,
    images: [...apply.images],
    image_list: [...apply.images],
    status: apply.status,
    applicant: apply.applicant,
    customerName: apply.applicant,
    customer_name: apply.applicant,
    createdAt: apply.createdAt,
    created_at: apply.createdAt,
  }
}

function serializeSalesReturn(record) {
  return {
    id: record.id,
    record_id: record.id,
    orderId: record.orderId,
    order_id: record.orderId,
    orderNo: record.orderNo,
    order_no: record.orderNo,
    memberName: record.memberName,
    member_name: record.memberName,
    itemName: record.itemName,
    item_name: record.itemName,
    amount: record.amount,
    reason: record.reason,
    refundChannel: record.refundChannel,
    refund_channel: record.refundChannel,
    createdAt: record.createdAt,
    created_at: record.createdAt,
  }
}

function serializeSalesExchange(record) {
  return {
    id: record.id,
    record_id: record.id,
    orderId: record.orderId,
    order_id: record.orderId,
    orderNo: record.orderNo,
    order_no: record.orderNo,
    memberName: record.memberName,
    member_name: record.memberName,
    originalItem: record.originalItem,
    original_item: record.originalItem,
    newItem: record.newItem,
    new_item: record.newItem,
    priceDiff: record.priceDiff,
    price_diff: record.priceDiff,
    reason: record.reason,
    createdAt: record.createdAt,
    created_at: record.createdAt,
  }
}

function serializeInventoryItem(item) {
  const status = getInventoryStatusValue(item)
  return {
    id: item.id,
    item_id: item.id,
    sku: item.sku,
    name: item.name,
    itemName: item.name,
    item_name: item.name,
    qty: item.qty,
    quantity: item.qty,
    safeMin: item.safeMin,
    safe_min: item.safeMin,
    safeMax: item.safeMax,
    safe_max: item.safeMax,
    location: item.location,
    status,
    createdAt: item.createdAt,
    created_at: item.createdAt,
    updatedAt: item.updatedAt,
    updated_at: item.updatedAt,
  }
}

function serializeInventoryMovement(record) {
  return {
    id: record.id,
    log_id: record.id,
    itemId: record.itemId,
    item_id: record.itemId,
    sku: record.sku,
    itemName: record.itemName,
    item_name: record.itemName,
    actionType: record.actionType,
    action_type: record.actionType,
    qtyChange: record.qtyChange,
    qty_change: record.qtyChange,
    beforeQty: record.beforeQty,
    before_qty: record.beforeQty,
    afterQty: record.afterQty,
    after_qty: record.afterQty,
    operator: record.operator,
    note: record.note,
    relatedId: record.relatedId,
    related_id: record.relatedId,
    createdAt: record.createdAt,
    created_at: record.createdAt,
  }
}

function serializeInventoryCheckTask(task) {
  return {
    id: task.id,
    task_id: task.id,
    scope: task.scope,
    note: task.note,
    status: task.status,
    operator: task.operator,
    createdAt: task.createdAt,
    created_at: task.createdAt,
    completedAt: task.completedAt || 0,
    completed_at: task.completedAt || 0,
  }
}

function serializeInventoryCheckItem(item) {
  return {
    id: item.id,
    check_item_id: item.id,
    taskId: item.taskId,
    task_id: item.taskId,
    inventoryItemId: item.inventoryItemId,
    inventory_item_id: item.inventoryItemId,
    sku: item.sku,
    name: item.name,
    itemName: item.name,
    item_name: item.name,
    location: item.location,
    systemQty: item.systemQty,
    system_qty: item.systemQty,
    actualQty: item.actualQty == null ? null : item.actualQty,
    actual_qty: item.actualQty == null ? null : item.actualQty,
    difference: item.difference == null ? null : item.difference,
    difference_qty: item.difference == null ? null : item.difference,
    status: item.status,
    note: item.note,
    createdAt: item.createdAt,
    created_at: item.createdAt,
    updatedAt: item.updatedAt || 0,
    updated_at: item.updatedAt || 0,
  }
}

function serializeSettings(settings) {
  return {
    system: {
      notifyTakeaway: settings.system.notifyTakeaway,
      notify_takeaway: settings.system.notifyTakeaway,
      notifyRecheck: settings.system.notifyRecheck,
      notify_recheck: settings.system.notifyRecheck,
      notifyTraining: settings.system.notifyTraining,
      notify_training: settings.system.notifyTraining,
    },
    notice: {
      content: settings.notice.content,
      notice_content: settings.notice.content,
      updatedAt: settings.notice.updatedAt,
      updated_at: settings.notice.updatedAt,
    },
    print: {
      printTicket: settings.print.printTicket,
      print_ticket: settings.print.printTicket,
      printOrder: settings.print.printOrder,
      print_order: settings.print.printOrder,
      printDelivery: settings.print.printDelivery,
      print_delivery: settings.print.printDelivery,
      ticketContent: settings.print.ticketContent,
      ticket_content: settings.print.ticketContent,
      orderContent: settings.print.orderContent,
      order_content: settings.print.orderContent,
      deliveryContent: settings.print.deliveryContent,
      delivery_content: settings.print.deliveryContent,
    },
    rate: {
      merchantNo: settings.rate.merchantNo,
      merchant_no: settings.rate.merchantNo,
      rate: settings.rate.rate,
      autoSettle: settings.rate.autoSettle,
      auto_settle: settings.rate.autoSettle,
    },
    permission: {
      salesCanPurchase: settings.permission.salesCanPurchase,
      sales_can_purchase: settings.permission.salesCanPurchase,
      salesCanRateView: settings.permission.salesCanRateView,
      sales_can_rate_view: settings.permission.salesCanRateView,
      customerCanAfterSale: settings.permission.customerCanAfterSale,
      customer_can_after_sale: settings.permission.customerCanAfterSale,
    },
  }
}

function getInventoryStatusValue(item) {
  if (item.qty < item.safeMin) {
    return 'low'
  }
  if (item.qty > item.safeMax) {
    return 'high'
  }
  return 'normal'
}

function buildFinanceSummary(orders) {
  let totalAmount = 0
  let receivedAmount = 0
  let receivableAmount = 0
  let completedCount = 0
  let awaitingPaymentCount = 0

  for (const order of orders) {
    totalAmount += order.amount
    if (order.status === 'awaiting_payment') {
      receivableAmount += order.amount
      awaitingPaymentCount += 1
    } else {
      receivedAmount += order.amount
    }
    if (order.status === 'completed') {
      completedCount += 1
    }
  }

  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2)),
    receivedAmount: Number(receivedAmount.toFixed(2)),
    received_amount: Number(receivedAmount.toFixed(2)),
    receivableAmount: Number(receivableAmount.toFixed(2)),
    receivable_amount: Number(receivableAmount.toFixed(2)),
    completedCount,
    completed_count: completedCount,
    awaitingPaymentCount,
    awaiting_payment_count: awaitingPaymentCount,
  }
}

function createDefaultDb() {
  const timestamp = now()
  return {
    meta: {
      version: 1,
      updatedAt: timestamp,
    },
    counters: {
      member: 1002,
      order: 1003,
      vision: 1002,
      purchase: 1003,
      appointment: 1002,
      afterSaleApply: 1000,
      salesReturn: 1000,
      salesExchange: 1000,
      inventoryItem: 1005,
      inventoryMovement: 1003,
      inventoryCheckTask: 1000,
      inventoryCheckItem: 1000,
    },
    members: [
      {
        id: 'MEM-1001',
        name: '阿依古丽',
        mobile: '13800001001',
        gender: 'female',
        birthday: '1995-08-19',
        note: '首次配镜客户',
        createdAt: timestamp - 7 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'MEM-1002',
        name: '马磊',
        mobile: '13800001002',
        gender: 'male',
        birthday: '1992-03-12',
        note: '复购会员',
        createdAt: timestamp - 5 * 24 * 60 * 60 * 1000,
      },
    ],
    orders: [
      {
        id: 'ORD-1001',
        orderNo: 'SO202604160001',
        memberId: 'MEM-1001',
        memberName: '阿依古丽',
        orderType: 'normal',
        itemName: '超薄镜片 1.67',
        quantity: 1,
        unitPrice: 399,
        amount: 399,
        status: 'awaiting_payment',
        note: '',
        createdAt: timestamp - 2 * 60 * 60 * 1000,
      },
      {
        id: 'ORD-1002',
        orderNo: 'SO202604160002',
        memberId: 'MEM-1002',
        memberName: '马磊',
        orderType: 'optometry',
        itemName: '验光开单套餐',
        quantity: 1,
        unitPrice: 268,
        amount: 268,
        status: 'ready_delivery',
        note: '',
        createdAt: timestamp - 4 * 60 * 60 * 1000,
        paidAt: timestamp - 3 * 60 * 60 * 1000,
        payChannel: 'wechat',
      },
      {
        id: 'ORD-1003',
        orderNo: 'SO202604150003',
        memberId: 'MEM-1001',
        memberName: '阿依古丽',
        orderType: 'normal',
        itemName: '儿童防控镜片',
        quantity: 1,
        unitPrice: 612.44,
        amount: 612.44,
        status: 'completed',
        note: '',
        createdAt: timestamp - 24 * 60 * 60 * 1000,
        paidAt: timestamp - 23 * 60 * 60 * 1000,
        deliveredAt: timestamp - 20 * 60 * 60 * 1000,
        payChannel: 'cash',
      },
    ],
    visionRecords: [
      {
        id: 'VR-1001',
        memberId: 'MEM-1001',
        examDate: '2026-04-10',
        rightEye: 'S -1.75 C -0.50 A 180',
        leftEye: 'S -1.50 C -0.25 A 170',
        pd: '63',
        suggestion: '建议防蓝光镜片，连续用眼 40 分钟休息 5 分钟。',
        doctor: '吴家伟',
      },
      {
        id: 'VR-1002',
        memberId: 'MEM-1002',
        examDate: '2026-04-08',
        rightEye: 'S -2.25 C -0.75 A 175',
        leftEye: 'S -2.00 C -0.50 A 165',
        pd: '62',
        suggestion: '建议复查周期 3 个月，增加户外活动。',
        doctor: '店长',
      },
    ],
    purchaseRecords: [
      {
        id: 'PO-1001',
        type: 'order',
        itemName: '超薄镜片 1.67',
        sku: 'LENS-001',
        qty: 50,
        unitCost: 128,
        supplier: '华光供应链',
        operator: '店长',
        note: '',
        createdAt: timestamp - 3 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'PO-1002',
        type: 'inbound',
        itemName: '金属镜架 M10',
        sku: 'FRAME-010',
        qty: 20,
        unitCost: 62,
        supplier: '伊宁仓',
        operator: '吴家伟',
        note: '',
        createdAt: timestamp - 2 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'PO-1003',
        type: 'return',
        itemName: '防蓝光镜片 1.60',
        sku: 'LENS-022',
        qty: 4,
        unitCost: 78,
        supplier: '华光供应链',
        operator: '店长',
        note: '批次边缘瑕疵',
        createdAt: timestamp - 1 * 24 * 60 * 60 * 1000,
      },
    ],
    inventoryItems: [
      {
        id: 'INV-1001',
        sku: 'LENS-001',
        name: '超薄镜片 1.67',
        qty: 18,
        safeMin: 20,
        safeMax: 80,
        location: 'A-01',
        createdAt: timestamp - 4 * 24 * 60 * 60 * 1000,
        updatedAt: timestamp - 2 * 60 * 60 * 1000,
      },
      {
        id: 'INV-1002',
        sku: 'FRAME-010',
        name: '金属镜架 M10',
        qty: 96,
        safeMin: 10,
        safeMax: 90,
        location: 'B-03',
        createdAt: timestamp - 4 * 24 * 60 * 60 * 1000,
        updatedAt: timestamp - 6 * 60 * 60 * 1000,
      },
      {
        id: 'INV-1003',
        sku: 'LENS-022',
        name: '防蓝光镜片 1.60',
        qty: 45,
        safeMin: 20,
        safeMax: 70,
        location: 'A-06',
        createdAt: timestamp - 4 * 24 * 60 * 60 * 1000,
        updatedAt: timestamp - 24 * 60 * 60 * 1000,
      },
      {
        id: 'INV-1004',
        sku: 'LENS-005',
        name: '渐进镜片 1.60',
        qty: 12,
        safeMin: 15,
        safeMax: 60,
        location: 'A-02',
        createdAt: timestamp - 4 * 24 * 60 * 60 * 1000,
        updatedAt: timestamp - 28 * 60 * 60 * 1000,
      },
      {
        id: 'INV-1005',
        sku: 'FRAME-001',
        name: '钛架镜框 T1',
        qty: 8,
        safeMin: 10,
        safeMax: 40,
        location: 'B-01',
        createdAt: timestamp - 4 * 24 * 60 * 60 * 1000,
        updatedAt: timestamp - 30 * 60 * 60 * 1000,
      },
    ],
    inventoryMovements: [
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
        createdAt: timestamp - 2 * 60 * 60 * 1000,
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
        createdAt: timestamp - 6 * 60 * 60 * 1000,
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
        createdAt: timestamp - 24 * 60 * 60 * 1000,
      },
    ],
    inventoryCheckTasks: [],
    inventoryCheckItems: [],
    appointments: [
      {
        id: 'APT-1001',
        customerName: '阿依古丽',
        mobile: '13800001001',
        serviceType: 'optometry',
        date: '2026-04-18',
        time: '10:30',
        note: '初次验光咨询',
        status: 'pending',
        createdAt: timestamp - 3 * 60 * 60 * 1000,
      },
      {
        id: 'APT-1002',
        customerName: '马磊',
        mobile: '13800001002',
        serviceType: 'recheck',
        date: '2026-04-17',
        time: '15:00',
        note: '复查镜片适配情况',
        status: 'done',
        createdAt: timestamp - 24 * 60 * 60 * 1000,
        arrivedAt: timestamp - 23 * 60 * 60 * 1000,
      },
    ],
    afterSaleRecords: [],
    afterSaleApplies: [],
    salesReturns: [],
    salesExchanges: [],
    settings: {
      system: {
        notifyTakeaway: true,
        notifyRecheck: true,
        notifyTraining: true,
      },
      notice: {
        content: '点击查看系统更新公告（2026-03-12）',
        updatedAt: timestamp,
      },
      print: {
        printTicket: true,
        printOrder: true,
        printDelivery: false,
        ticketContent: '店铺名\\n日期：{{date}}\\n商品：{{itemName}}\\n金额：￥{{amount}}\\n感谢惠顾！',
        orderContent: '配镜单\\n客户：{{customerName}}\\n右眼：{{rightEye}}\\n左眼：{{leftEye}}\\nPD：{{pd}}',
        deliveryContent: '取件通知\\n客户：{{customerName}}\\n订单号：{{orderNo}}\\n商品：{{itemName}}\\n请凭此单到店取件',
      },
      rate: {
        merchantNo: 'MCH_XJ001',
        rate: '0.3%',
        autoSettle: true,
      },
      permission: {
        salesCanPurchase: true,
        salesCanRateView: true,
        customerCanAfterSale: true,
      },
    },
  }
}

function detectCounter(list, prefix, fallback = 1000) {
  let maxValue = fallback
  for (const item of list) {
    const id = typeof item.id === 'string' ? item.id : ''
    if (!id.startsWith(prefix)) {
      continue
    }
    const value = Number(id.slice(prefix.length))
    if (Number.isFinite(value)) {
      maxValue = Math.max(maxValue, value)
    }
  }
  return maxValue
}

function normalizeMemberRecord(raw) {
  const source = asObject(raw)
  return {
    id: readStringField(source, ['id', 'member_id']),
    name: readStringField(source, ['name', 'member_name']),
    mobile: readStringField(source, ['mobile', 'phone']),
    gender: readStringField(source, ['gender'], 'unknown'),
    birthday: readStringField(source, ['birthday']),
    note: readStringField(source, ['note']),
    createdAt: readNumberField(source, ['createdAt', 'created_at'], now()),
  }
}

function normalizeOrderRecord(raw) {
  const source = asObject(raw)
  return {
    id: readStringField(source, ['id', 'order_id']),
    orderNo: readStringField(source, ['orderNo', 'order_no']),
    memberId: readStringField(source, ['memberId', 'member_id']),
    memberName: readStringField(source, ['memberName', 'member_name']),
    orderType: readStringField(source, ['orderType', 'order_type'], 'normal') === 'optometry' ? 'optometry' : 'normal',
    itemName: readStringField(source, ['itemName', 'item_name']),
    quantity: readNumberField(source, ['quantity'], 0),
    unitPrice: readNumberField(source, ['unitPrice', 'unit_price'], 0),
    amount: readNumberField(source, ['amount'], 0),
    status: readStringField(source, ['status'], 'awaiting_payment'),
    note: readStringField(source, ['note']),
    createdAt: readNumberField(source, ['createdAt', 'created_at'], now()),
    paidAt: readNumberField(source, ['paidAt', 'paid_at'], 0) || undefined,
    deliveredAt: readNumberField(source, ['deliveredAt', 'delivered_at'], 0) || undefined,
    payChannel: readStringField(source, ['payChannel', 'pay_channel']) || undefined,
  }
}

function normalizeVisionRecord(raw) {
  const source = asObject(raw)
  return {
    id: readStringField(source, ['id', 'record_id']),
    memberId: readStringField(source, ['memberId', 'member_id']),
    examDate: readStringField(source, ['examDate', 'exam_date']),
    rightEye: readStringField(source, ['rightEye', 'right_eye']),
    leftEye: readStringField(source, ['leftEye', 'left_eye']),
    pd: readStringField(source, ['pd']),
    suggestion: readStringField(source, ['suggestion', 'remark']),
    doctor: readStringField(source, ['doctor', 'optometrist']),
  }
}

function normalizePurchaseRecord(raw) {
  const source = asObject(raw)
  return {
    id: readStringField(source, ['id', 'record_id']),
    type: readStringField(source, ['type', 'record_type'], 'order'),
    itemName: readStringField(source, ['itemName', 'item_name']),
    sku: readStringField(source, ['sku']),
    qty: readNumberField(source, ['qty', 'quantity'], 0),
    unitCost: readNumberField(source, ['unitCost', 'unit_cost'], 0),
    supplier: readStringField(source, ['supplier']),
    operator: readStringField(source, ['operator']),
    note: readStringField(source, ['note', 'remark']),
    createdAt: readNumberField(source, ['createdAt', 'created_at'], now()),
  }
}

function normalizeAppointmentRecord(raw) {
  const source = asObject(raw)
  const serviceType = readStringField(source, ['serviceType', 'service_type'], 'optometry')
  const status = readStringField(source, ['status'], 'pending')
  return {
    id: readStringField(source, ['id', 'appointment_id']),
    customerName: readStringField(source, ['customerName', 'customer_name']),
    mobile: readStringField(source, ['mobile', 'phone']),
    serviceType: serviceType === 'recheck' || serviceType === 'training' || serviceType === 'optometry' ? serviceType : 'optometry',
    date: readStringField(source, ['date', 'appointmentDate', 'appointment_date']),
    time: readStringField(source, ['time', 'appointmentTime', 'appointment_time']),
    note: readStringField(source, ['note', 'remark']),
    status: status === 'done' ? 'done' : 'pending',
    createdAt: readNumberField(source, ['createdAt', 'created_at'], now()),
    arrivedAt: readNumberField(source, ['arrivedAt', 'arrived_at'], 0) || undefined,
  }
}

function normalizeAfterSaleRecord(raw) {
  const source = asObject(raw)
  return {
    orderId: readStringField(source, ['orderId', 'order_id']),
    followed: readBooleanField(source, ['followed'], false),
    rechecked: readBooleanField(source, ['rechecked'], false),
    updatedAt: readNumberField(source, ['updatedAt', 'updated_at'], 0),
  }
}

function normalizeAfterSaleApply(raw) {
  const source = asObject(raw)
  const type = readStringField(source, ['type', 'apply_type'], 'return')
  const status = readStringField(source, ['status'], 'pending')
  const rawImages = Array.isArray(source.images)
    ? source.images
    : (Array.isArray(source.image_list) ? source.image_list : [])
  return {
    id: readStringField(source, ['id', 'apply_id']),
    orderId: readStringField(source, ['orderId', 'order_id']),
    type: type === 'exchange' || type === 'repair' || type === 'refund' || type === 'return' ? type : 'return',
    reason: readStringField(source, ['reason']),
    remark: readStringField(source, ['remark', 'note']),
    phone: readStringField(source, ['phone', 'mobile']),
    images: rawImages.filter((item) => typeof item === 'string'),
    status: status === 'followed_up' || status === 'completed' ? status : 'pending',
    applicant: readStringField(source, ['applicant', 'customerName', 'customer_name']),
    createdAt: readNumberField(source, ['createdAt', 'created_at'], now()),
  }
}

function normalizeSettingsData(raw, fallback) {
  const source = asObject(raw)
  const system = asObject(source.system)
  const notice = asObject(source.notice)
  const print = asObject(source.print)
  const rate = asObject(source.rate)
  const permission = asObject(source.permission)

  return {
    system: {
      notifyTakeaway: readBooleanField(system, ['notifyTakeaway', 'notify_takeaway'], fallback.system.notifyTakeaway),
      notifyRecheck: readBooleanField(system, ['notifyRecheck', 'notify_recheck'], fallback.system.notifyRecheck),
      notifyTraining: readBooleanField(system, ['notifyTraining', 'notify_training'], fallback.system.notifyTraining),
    },
    notice: {
      content: readStringField(notice, ['content', 'notice_content'], fallback.notice.content),
      updatedAt: readNumberField(notice, ['updatedAt', 'updated_at'], fallback.notice.updatedAt),
    },
    print: {
      printTicket: readBooleanField(print, ['printTicket', 'print_ticket'], fallback.print.printTicket),
      printOrder: readBooleanField(print, ['printOrder', 'print_order'], fallback.print.printOrder),
      printDelivery: readBooleanField(print, ['printDelivery', 'print_delivery'], fallback.print.printDelivery),
      ticketContent: readStringField(print, ['ticketContent', 'ticket_content'], fallback.print.ticketContent),
      orderContent: readStringField(print, ['orderContent', 'order_content'], fallback.print.orderContent),
      deliveryContent: readStringField(print, ['deliveryContent', 'delivery_content'], fallback.print.deliveryContent),
    },
    rate: {
      merchantNo: readStringField(rate, ['merchantNo', 'merchant_no'], fallback.rate.merchantNo),
      rate: readStringField(rate, ['rate'], fallback.rate.rate),
      autoSettle: readBooleanField(rate, ['autoSettle', 'auto_settle'], fallback.rate.autoSettle),
    },
    permission: {
      salesCanPurchase: readBooleanField(permission, ['salesCanPurchase', 'sales_can_purchase'], fallback.permission.salesCanPurchase),
      salesCanRateView: readBooleanField(permission, ['salesCanRateView', 'sales_can_rate_view'], fallback.permission.salesCanRateView),
      customerCanAfterSale: readBooleanField(permission, ['customerCanAfterSale', 'customer_can_after_sale'], fallback.permission.customerCanAfterSale),
    },
  }
}

function normalizeDb(raw) {
  const fallback = createDefaultDb()
  const source = asObject(raw)
  const members = Array.isArray(source.members) ? source.members.map((item) => normalizeMemberRecord(item)).filter((item) => item.id) : fallback.members
  const orders = Array.isArray(source.orders) ? source.orders.map((item) => normalizeOrderRecord(item)).filter((item) => item.id) : fallback.orders
  const visionRecords = Array.isArray(source.visionRecords) ? source.visionRecords.map((item) => normalizeVisionRecord(item)).filter((item) => item.id) : fallback.visionRecords
  const purchaseRecords = Array.isArray(source.purchaseRecords)
    ? source.purchaseRecords.map((item) => normalizePurchaseRecord(item)).filter((item) => item.id)
    : fallback.purchaseRecords
  const appointments = Array.isArray(source.appointments)
    ? source.appointments.map((item) => normalizeAppointmentRecord(item)).filter((item) => item.id)
    : fallback.appointments
  const afterSaleRecords = Array.isArray(source.afterSaleRecords)
    ? source.afterSaleRecords.map((item) => normalizeAfterSaleRecord(item)).filter((item) => item.orderId)
    : fallback.afterSaleRecords
  const afterSaleApplies = Array.isArray(source.afterSaleApplies)
    ? source.afterSaleApplies.map((item) => normalizeAfterSaleApply(item)).filter((item) => item.id)
    : fallback.afterSaleApplies
  const counters = asObject(source.counters)
  const meta = asObject(source.meta)

  return {
    meta: {
      version: 1,
      updatedAt: readNumberField(meta, ['updatedAt'], fallback.meta.updatedAt),
    },
    counters: {
      member: Math.max(readNumberField(counters, ['member'], 0), detectCounter(members, 'MEM-', fallback.counters.member)),
      order: Math.max(readNumberField(counters, ['order'], 0), detectCounter(orders, 'ORD-', fallback.counters.order)),
      vision: Math.max(readNumberField(counters, ['vision'], 0), detectCounter(visionRecords, 'VR-', fallback.counters.vision)),
      purchase: Math.max(readNumberField(counters, ['purchase'], 0), detectCounter(purchaseRecords, 'PO-', fallback.counters.purchase)),
      appointment: Math.max(readNumberField(counters, ['appointment'], 0), detectCounter(appointments, 'APT-', fallback.counters.appointment)),
      afterSaleApply: Math.max(readNumberField(counters, ['afterSaleApply', 'after_sale_apply'], 0), detectCounter(afterSaleApplies, 'AS-', fallback.counters.afterSaleApply)),
    },
    members,
    orders,
    visionRecords,
    purchaseRecords,
    appointments,
    afterSaleRecords,
    afterSaleApplies,
    settings: normalizeSettingsData(source.settings, fallback.settings),
  }
}

function mustAuth(req, res) {
  const token = parseBearerToken(req.headers.authorization || '')
  if (!token || !usersByToken.has(token)) {
    failure(res, 401, 401, '未登录或 token 失效')
    return null
  }
  return usersByToken.get(token)
}

function getKeyword(source) {
  return readStringField(asObject(source), ['keyword'])
}

function getStatus(source) {
  const status = readStringField(asObject(source), ['status'])
  if (status === 'awaiting_payment' || status === 'ready_delivery' || status === 'completed') {
    return status
  }
  return ''
}

function getAppointmentStatus(source) {
  const status = readStringField(asObject(source), ['status'])
  if (status === 'pending' || status === 'done') {
    return status
  }
  return ''
}

function getAfterSaleApplyStatus(source) {
  const status = readStringField(asObject(source), ['status'])
  if (status === 'pending' || status === 'followed_up' || status === 'completed') {
    return status
  }
  return ''
}

function getInventoryStatusFilter(source) {
  const status = readStringField(asObject(source), ['status'])
  if (status === 'all' || status === 'low' || status === 'high') {
    return status
  }
  return ''
}

function getInventoryCheckItemStatus(source) {
  const status = readStringField(asObject(source), ['status'])
  if (status === 'pending' || status === 'difference' || status === 'done') {
    return status
  }
  return ''
}

function getMemberId(source) {
  return readStringField(asObject(source), ['member_id', 'memberId'])
}

function normalizeMemberPayload(body) {
  const source = asObject(body)
  return {
    name: readStringField(source, ['member_name', 'name']),
    mobile: readStringField(source, ['phone', 'mobile']),
    gender: readStringField(source, ['gender'], 'unknown'),
    birthday: readStringField(source, ['birthday']),
    note: readStringField(source, ['note']),
  }
}

function normalizeOrderPayload(body) {
  const source = asObject(body)
  return {
    memberId: readStringField(source, ['member_id', 'memberId']),
    orderType: readStringField(source, ['order_type', 'orderType'], 'normal'),
    itemName: readStringField(source, ['item_name', 'itemName']),
    quantity: readNumberField(source, ['quantity'], 0),
    unitPrice: readNumberField(source, ['unit_price', 'unitPrice'], 0),
    note: readStringField(source, ['note']),
  }
}

function normalizePayPayload(body) {
  const source = asObject(body)
  return {
    payChannel: readStringField(source, ['pay_channel', 'payChannel']),
    paidAmount: readNumberField(source, ['paid_amount', 'paidAmount'], 0),
  }
}

function normalizeVisionPayload(body) {
  const source = asObject(body)
  return {
    memberId: readStringField(source, ['member_id', 'memberId']),
    examDate: readStringField(source, ['exam_date', 'examDate']),
    rightEye: readStringField(source, ['right_eye', 'rightEye']),
    leftEye: readStringField(source, ['left_eye', 'leftEye']),
    pd: readStringField(source, ['pd']),
    suggestion: readStringField(source, ['suggestion']),
    doctor: readStringField(source, ['doctor']),
  }
}

function normalizePurchasePayload(body) {
  const source = asObject(body)
  return {
    type: readStringField(source, ['record_type', 'type'], 'order'),
    itemName: readStringField(source, ['item_name', 'itemName']),
    sku: readStringField(source, ['sku']),
    qty: readNumberField(source, ['qty', 'quantity'], 0),
    unitCost: readNumberField(source, ['unit_cost', 'unitCost'], 0),
    supplier: readStringField(source, ['supplier']),
    operator: readStringField(source, ['operator']),
    note: readStringField(source, ['note', 'remark']),
  }
}

function normalizeInventoryAdjustPayload(body) {
  const source = asObject(body)
  return {
    newQty: readNumberField(source, ['new_qty', 'newQty', 'qty', 'quantity'], -1),
    operator: readStringField(source, ['operator']),
    note: readStringField(source, ['note', 'remark']),
  }
}

function normalizeInventoryCheckTaskPayload(body) {
  const source = asObject(body)
  return {
    scope: readStringField(source, ['scope'], 'all'),
    note: readStringField(source, ['note', 'remark']),
    operator: readStringField(source, ['operator']),
  }
}

function normalizeInventoryCheckSubmitPayload(body) {
  const source = asObject(body)
  return {
    actualQty: readNumberField(source, ['actual_qty', 'actualQty', 'qty', 'quantity'], -1),
  }
}

function normalizeInventoryCheckResolvePayload(body) {
  const source = asObject(body)
  return {
    action: readStringField(source, ['action']),
    operator: readStringField(source, ['operator']),
    note: readStringField(source, ['note', 'remark']),
  }
}

function normalizeInventoryCheckBatchPayload(body) {
  const source = asObject(body)
  const rawItems = Array.isArray(source.items) ? source.items : []
  return rawItems.map((item) => {
    const current = asObject(item)
    return {
      id: readStringField(current, ['id', 'check_item_id']),
      actualQty: readNumberField(current, ['actual_qty', 'actualQty', 'qty', 'quantity'], -1),
    }
  }).filter((item) => item.id)
}

function normalizeAppointmentPayload(body) {
  const source = asObject(body)
  return {
    customerName: readStringField(source, ['customer_name', 'customerName']),
    mobile: readStringField(source, ['phone', 'mobile']),
    serviceType: readStringField(source, ['service_type', 'serviceType'], 'optometry'),
    date: readStringField(source, ['appointment_date', 'appointmentDate', 'date']),
    time: readStringField(source, ['appointment_time', 'appointmentTime', 'time']),
    note: readStringField(source, ['note', 'remark']),
  }
}

function normalizeAfterSaleApplyPayload(body) {
  const source = asObject(body)
  const rawImages = Array.isArray(source.images)
    ? source.images
    : (Array.isArray(source.image_list) ? source.image_list : [])
  return {
    orderId: readStringField(source, ['order_id', 'orderId']),
    type: readStringField(source, ['apply_type', 'type'], 'return'),
    reason: readStringField(source, ['reason']),
    remark: readStringField(source, ['remark', 'note']),
    phone: readStringField(source, ['phone', 'mobile']),
    images: rawImages.filter((item) => typeof item === 'string'),
  }
}

function normalizeSalesReturnPayload(body) {
  const source = asObject(body)
  const rawRefundChannel = readStringField(source, ['refund_channel', 'refundChannel'])
  let refundChannel = rawRefundChannel
  if (rawRefundChannel === 'original') {
    refundChannel = '原路退回'
  } else if (rawRefundChannel === 'balance') {
    refundChannel = '余额退回'
  } else if (rawRefundChannel === 'cash') {
    refundChannel = '现金退款'
  }
  return {
    orderId: readStringField(source, ['order_id', 'orderId']),
    reason: readStringField(source, ['reason']),
    refundChannel,
  }
}

function normalizeSalesExchangePayload(body) {
  const source = asObject(body)
  return {
    orderId: readStringField(source, ['order_id', 'orderId']),
    newItem: readStringField(source, ['new_item', 'newItem']),
    newItemPrice: readNumberField(source, ['new_item_price', 'newItemPrice'], 0),
    reason: readStringField(source, ['reason']),
  }
}

const store = createSqlStore({ createDefaultDb })

app.get('/', asyncHandler(async (req, res) => {
  const counts = await store.getCounts()
  const database = store.getDbConfig()
  res.json(success({
    service: 'yanjing-local-api',
    status: 'ok',
    time: now(),
    database,
    ...counts,
  }))
}))

app.get('/health', asyncHandler(async (req, res) => {
  res.json(success({
    status: 'ok',
    time: now(),
    database: store.getDbConfig(),
  }))
}))

app.post('/__dev/reset', asyncHandler(async (req, res) => {
  usersByToken.clear()
  await store.reset()
  const [members, orders, visionRecords, purchaseRecords, appointments, afterSaleApplies, salesReturns, salesExchanges, inventoryItems, inventoryCheckTasks] = await Promise.all([
    store.listMembers(),
    store.listOrders(),
    store.listVisionRecords(),
    store.listPurchaseRecords(),
    store.listAppointments(),
    store.listAfterSaleApplies(),
    store.listSalesReturns(),
    store.listSalesExchanges(),
    store.listInventoryItems(),
    store.listInventoryCheckTasks(),
  ])
  res.json(success({
    status: 'reset',
    database: store.getDbConfig(),
    members: members.length,
    orders: orders.length,
    visionRecords: visionRecords.length,
    purchaseRecords: purchaseRecords.length,
    appointments: appointments.length,
    afterSaleApplies: afterSaleApplies.length,
    salesReturns: salesReturns.length,
    salesExchanges: salesExchanges.length,
    inventoryItems: inventoryItems.length,
    inventoryCheckTasks: inventoryCheckTasks.length,
  }, 'dev db reset'))
}))

app.post('/auth/login', (req, res) => {
  const body = asObject(req.body)
  const code = readStringField(body, ['code'])
  const desiredRole = normalizeRole(readStringField(body, ['desired_role', 'desiredRole'], 'sales'))

  if (!code) {
    failure(res, 400, 400, '缺少 code')
    return
  }

  const token = `${DEV_TOKEN_PREFIX}${desiredRole}-${now()}-${Math.random().toString(36).slice(2, 10)}`
  const profile = buildUserProfile(desiredRole)
  usersByToken.set(token, profile)

  res.json(success(serializeLoginResult({
    token,
    refreshToken: `refresh-${token}`,
    expiresAt: now() + 7 * 24 * 60 * 60 * 1000,
  })))
})

app.get('/auth/profile', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  res.json(success(serializeUserProfile(profile)))
})

app.get('/members', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const keyword = getKeyword(req.query)
  const list = await store.listMembers(keyword)
  res.json(success(list.map((item) => serializeMember(item))))
}))

app.post('/members', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const payload = normalizeMemberPayload(req.body)
  if (!payload.name) {
    failure(res, 400, 400, '会员姓名必填')
    return
  }
  if (!/^1\d{10}$/.test(payload.mobile)) {
    failure(res, 400, 400, '手机号格式错误')
    return
  }
  if (await store.findMemberByMobile(payload.mobile)) {
    failure(res, 409, 409, '手机号已存在')
    return
  }

  const created = await store.createMember({
    ...payload,
    gender: payload.gender === 'male' || payload.gender === 'female' || payload.gender === 'unknown' ? payload.gender : 'unknown',
  })
  res.json(success(serializeMember(created)))
}))

app.get('/orders', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const status = getStatus(req.query)
  const keyword = getKeyword(req.query)
  const list = await store.listOrders({ status, keyword })
  res.json(success(list.map((item) => serializeOrder(item))))
}))

app.post('/orders', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const payload = normalizeOrderPayload(req.body)
  const member = await store.findMemberById(payload.memberId)

  if (!member) {
    failure(res, 404, 404, '会员不存在')
    return
  }
  if (payload.orderType !== 'normal' && payload.orderType !== 'optometry') {
    failure(res, 400, 400, '订单类型错误')
    return
  }
  if (!payload.itemName) {
    failure(res, 400, 400, '商品名称不能为空')
    return
  }
  if (!Number.isFinite(payload.quantity) || payload.quantity <= 0) {
    failure(res, 400, 400, '数量必须大于 0')
    return
  }
  if (!Number.isFinite(payload.unitPrice) || payload.unitPrice <= 0) {
    failure(res, 400, 400, '单价必须大于 0')
    return
  }

  const created = await store.createOrder(payload, member)
  res.json(success(serializeOrder(created)))
}))

app.post('/orders/:id/pay', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const payload = normalizePayPayload(req.body)
  const orderId = String(req.params.id || '')
  const order = await store.findOrderById(orderId)

  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'awaiting_payment') {
    failure(res, 409, 409, '订单状态不允许收款')
    return
  }
  if (payload.payChannel !== 'wechat' && payload.payChannel !== 'balance' && payload.payChannel !== 'cash') {
    failure(res, 400, 400, '支付方式错误')
    return
  }
  if (!Number.isFinite(payload.paidAmount) || payload.paidAmount < order.amount) {
    failure(res, 400, 400, '实收金额不能小于应收金额')
    return
  }

  const paidOrder = await store.markOrderPaid(orderId, payload.payChannel)
  res.json(success(serializeOrder(paidOrder)))
}))

app.post('/orders/:id/deliver', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const orderId = String(req.params.id || '')
  const order = await store.findOrderById(orderId)
  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'ready_delivery') {
    failure(res, 409, 409, '订单状态不允许取件')
    return
  }

  const deliveredOrder = await store.markOrderDelivered(orderId)
  res.json(success(serializeOrder(deliveredOrder)))
}))

app.get('/appointments', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const keyword = getKeyword(req.query)
  const status = getAppointmentStatus(req.query)
  const list = await store.listAppointments({ status, keyword, viewer: profile })
  res.json(success(list.map((item) => serializeAppointment(item))))
}))

app.post('/appointments', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const payload = normalizeAppointmentPayload(req.body)
  const customerName = profile.role === 'customer' && profile.userName ? profile.userName : payload.customerName
  const mobile = profile.role === 'customer' && profile.mobile ? profile.mobile : payload.mobile

  if (!customerName) {
    failure(res, 400, 400, '预约人姓名必填')
    return
  }
  if (!/^1\d{10}$/.test(mobile)) {
    failure(res, 400, 400, '手机号格式错误')
    return
  }
  if (payload.serviceType !== 'optometry' && payload.serviceType !== 'recheck' && payload.serviceType !== 'training') {
    failure(res, 400, 400, '预约服务类型错误')
    return
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date) || !/^\d{2}:\d{2}$/.test(payload.time)) {
    failure(res, 400, 400, '预约日期或时间格式错误')
    return
  }

  const created = await store.createAppointment({
    customerName,
    mobile,
    serviceType: payload.serviceType,
    date: payload.date,
    time: payload.time,
    note: payload.note,
  })
  res.json(success(serializeAppointment(created)))
}))

app.post('/appointments/:id/arrive', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const appointmentId = String(req.params.id || '')
  const appointment = await store.findAppointmentById(appointmentId)
  if (!appointment) {
    failure(res, 404, 404, '预约不存在')
    return
  }
  if (appointment.status === 'done') {
    failure(res, 409, 409, '预约已标记到店')
    return
  }

  const arrived = await store.markAppointmentArrived(appointmentId)
  res.json(success(serializeAppointment(arrived)))
}))

app.get('/after-sale-records', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const list = await store.listAfterSaleRecords(profile)
  res.json(success(list.map((item) => serializeAfterSaleRecord(item))))
}))

app.get('/after-sale-applies', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const keyword = getKeyword(req.query)
  const status = getAfterSaleApplyStatus(req.query)
  const list = await store.listAfterSaleApplies({ status, keyword, viewer: profile })
  res.json(success(list.map((item) => serializeAfterSaleApply(item))))
}))

app.post('/after-sale-applies', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const payload = normalizeAfterSaleApplyPayload(req.body)
  const order = await store.findOrderById(payload.orderId)
  const type = payload.type
  const applicant = profile.userName || '客户'
  const phone = profile.role === 'customer' && profile.mobile ? profile.mobile : payload.phone

  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'completed') {
    failure(res, 409, 409, '仅已完成订单可发起售后')
    return
  }
  if (type !== 'return' && type !== 'exchange' && type !== 'repair' && type !== 'refund') {
    failure(res, 400, 400, '售后类型错误')
    return
  }
  if (!payload.reason) {
    failure(res, 400, 400, '售后原因必填')
    return
  }
  if (!/^1\d{10}$/.test(phone)) {
    failure(res, 400, 400, '手机号格式错误')
    return
  }

  const created = await store.createAfterSaleApply({
    orderId: order.id,
    type,
    reason: payload.reason,
    remark: payload.remark,
    phone,
    images: payload.images.slice(0, 3),
    applicant,
  })
  res.json(success(serializeAfterSaleApply(created)))
}))

app.post('/after-sale-records/:orderId/followup', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const orderId = String(req.params.orderId || '')
  const order = await store.findOrderById(orderId)
  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'completed') {
    failure(res, 409, 409, '仅已完成订单可登记回访')
    return
  }

  const record = await store.findAfterSaleRecordByOrderId(orderId) || {
    orderId,
    followed: false,
    rechecked: false,
    updatedAt: 0,
  }
  if (record.followed) {
    failure(res, 409, 409, '该订单已登记回访')
    return
  }

  const updatedRecord = await store.markAfterSaleFollowup(orderId)
  res.json(success(serializeAfterSaleRecord(updatedRecord)))
}))

app.post('/after-sale-records/:orderId/recheck', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const orderId = String(req.params.orderId || '')
  const order = await store.findOrderById(orderId)
  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'completed') {
    failure(res, 409, 409, '仅已完成订单可处理复查')
    return
  }

  const record = await store.findAfterSaleRecordByOrderId(orderId) || {
    orderId,
    followed: false,
    rechecked: false,
    updatedAt: 0,
  }
  if (record.rechecked) {
    failure(res, 409, 409, '该订单已处理复查')
    return
  }

  const updatedRecord = await store.markAfterSaleRecheck(orderId)
  res.json(success(serializeAfterSaleRecord(updatedRecord)))
}))

app.get('/sales-returns', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const list = await store.listSalesReturns()
  res.json(success(list.map((item) => serializeSalesReturn(item))))
}))

app.post('/sales-returns', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const payload = normalizeSalesReturnPayload(req.body)
  const order = await store.findOrderById(payload.orderId)
  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'completed') {
    failure(res, 409, 409, '仅已完成订单可退货')
    return
  }
  if (!payload.reason) {
    failure(res, 400, 400, '退货原因必填')
    return
  }
  if (payload.refundChannel !== '原路退回' && payload.refundChannel !== '余额退回' && payload.refundChannel !== '现金退款') {
    failure(res, 400, 400, '退款方式错误')
    return
  }

  const created = await store.createSalesReturn({
    orderId: order.id,
    orderNo: order.orderNo,
    memberName: order.memberName,
    itemName: order.itemName,
    amount: order.amount,
    quantity: order.quantity,
    reason: payload.reason,
    refundChannel: payload.refundChannel,
    operator: profile.userName || '系统',
  })
  res.json(success(serializeSalesReturn(created)))
}))

app.get('/sales-exchanges', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const list = await store.listSalesExchanges()
  res.json(success(list.map((item) => serializeSalesExchange(item))))
}))

app.post('/sales-exchanges', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const payload = normalizeSalesExchangePayload(req.body)
  const order = await store.findOrderById(payload.orderId)
  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'completed') {
    failure(res, 409, 409, '仅已完成订单可换货')
    return
  }
  if (!payload.newItem) {
    failure(res, 400, 400, '新商品名称必填')
    return
  }
  if (!payload.reason) {
    failure(res, 400, 400, '换货原因必填')
    return
  }

  const newItemPrice = Number.isFinite(payload.newItemPrice) && payload.newItemPrice > 0 ? payload.newItemPrice : order.amount
  const created = await store.createSalesExchange({
    orderId: order.id,
    orderNo: order.orderNo,
    memberName: order.memberName,
    originalItem: order.itemName,
    originalAmount: order.amount,
    quantity: order.quantity,
    newItem: payload.newItem,
    newItemPrice,
    reason: payload.reason,
    operator: profile.userName || '系统',
  })
  res.json(success(serializeSalesExchange(created)))
}))

app.get('/vision-records', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const memberId = getMemberId(req.query)
  const list = await store.listVisionRecords(memberId)
  res.json(success(list.map((item) => serializeVisionRecord(item))))
}))

app.post('/vision-records', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const payload = normalizeVisionPayload(req.body)
  const member = await store.findMemberById(payload.memberId)
  if (!member) {
    failure(res, 404, 404, '会员不存在')
    return
  }
  if (!payload.examDate || !payload.rightEye || !payload.leftEye || !payload.pd || !payload.doctor) {
    failure(res, 400, 400, '验光记录参数不完整')
    return
  }

  const created = await store.createVisionRecord(payload)
  res.json(success(serializeVisionRecord(created)))
}))

app.get('/purchase-records', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const list = await store.listPurchaseRecords()
  res.json(success(list.map((item) => serializePurchaseRecord(item))))
}))

app.post('/purchase-records', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const payload = normalizePurchasePayload(req.body)
  if (payload.type !== 'order' && payload.type !== 'inbound' && payload.type !== 'return' && payload.type !== 'frame') {
    failure(res, 400, 400, '采购类型错误')
    return
  }
  if (!payload.itemName || !payload.sku || !payload.supplier) {
    failure(res, 400, 400, '采购记录参数不完整')
    return
  }
  if (!Number.isFinite(payload.qty) || payload.qty <= 0) {
    failure(res, 400, 400, '数量必须大于 0')
    return
  }
  if (!Number.isFinite(payload.unitCost) || payload.unitCost <= 0) {
    failure(res, 400, 400, '单价必须大于 0')
    return
  }

  const created = await store.createPurchaseRecord({
    ...payload,
    operator: payload.operator || profile.userName,
  })
  res.json(success(serializePurchaseRecord(created)))
}))

app.get('/inventory-items', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const keyword = getKeyword(req.query)
  const status = getInventoryStatusFilter(req.query)
  const list = await store.listInventoryItems({ status, keyword })
  res.json(success(list.map((item) => serializeInventoryItem(item))))
}))

app.get('/inventory-movements', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const keyword = getKeyword(req.query)
  const list = await store.listInventoryMovements(keyword)
  res.json(success(list.map((item) => serializeInventoryMovement(item))))
}))

app.post('/inventory-items/:id/adjust', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const itemId = String(req.params.id || '')
  const item = await store.findInventoryItemById(itemId)
  if (!item) {
    failure(res, 404, 404, '库存商品不存在')
    return
  }

  const payload = normalizeInventoryAdjustPayload(req.body)
  if (!Number.isFinite(payload.newQty) || payload.newQty < 0 || !Number.isInteger(payload.newQty)) {
    failure(res, 400, 400, '库存数量格式错误')
    return
  }

  const updated = await store.adjustInventoryItem(itemId, {
    newQty: payload.newQty,
    operator: payload.operator || profile.userName || '系统',
    note: payload.note,
  })
  res.json(success(serializeInventoryItem(updated)))
}))

app.get('/inventory-check-tasks', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const status = readStringField(asObject(req.query), ['status'])
  const list = await store.listInventoryCheckTasks({ status: status === 'ongoing' || status === 'done' ? status : '' })
  res.json(success(list.map((item) => serializeInventoryCheckTask(item))))
}))

app.get('/inventory-check-items', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const keyword = getKeyword(req.query)
  const status = getInventoryCheckItemStatus(req.query)
  const list = await store.listInventoryCheckItems({ status, keyword })
  res.json(success(list.map((item) => serializeInventoryCheckItem(item))))
}))

app.post('/inventory-check-tasks', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const payload = normalizeInventoryCheckTaskPayload(req.body)
  if (payload.scope !== 'all' && payload.scope !== 'low' && payload.scope !== 'high' && payload.scope !== 'location') {
    failure(res, 400, 400, '盘点范围错误')
    return
  }

  const created = await store.createInventoryCheckTask({
    scope: payload.scope,
    note: payload.note,
    operator: payload.operator || profile.userName || '系统',
  })
  if (!created) {
    failure(res, 409, 409, '该范围无商品需要盘点')
    return
  }
  res.json(success(serializeInventoryCheckTask(created)))
}))

app.post('/inventory-check-items/batch-submit', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const items = normalizeInventoryCheckBatchPayload(req.body)
  if (!items.length) {
    failure(res, 400, 400, '缺少盘点项')
    return
  }
  if (items.some((item) => !Number.isFinite(item.actualQty) || item.actualQty < 0 || !Number.isInteger(item.actualQty))) {
    failure(res, 400, 400, '实盘数量格式错误')
    return
  }

  const updated = await store.submitInventoryCheckItemsBatch(items)
  res.json(success(updated.map((item) => serializeInventoryCheckItem(item))))
}))

app.post('/inventory-check-items/:id/submit', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const itemId = String(req.params.id || '')
  const payload = normalizeInventoryCheckSubmitPayload(req.body)
  if (!Number.isFinite(payload.actualQty) || payload.actualQty < 0 || !Number.isInteger(payload.actualQty)) {
    failure(res, 400, 400, '实盘数量格式错误')
    return
  }

  const updated = await store.submitInventoryCheckItem(itemId, payload.actualQty)
  if (!updated) {
    failure(res, 404, 404, '盘点项不存在')
    return
  }
  res.json(success(serializeInventoryCheckItem(updated)))
}))

app.post('/inventory-check-items/:id/resolve', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  if (profile.role === 'customer') {
    failure(res, 403, 403, '权限不足')
    return
  }

  const itemId = String(req.params.id || '')
  const payload = normalizeInventoryCheckResolvePayload(req.body)
  if (payload.action !== 'adjust' && payload.action !== 'mark_normal') {
    failure(res, 400, 400, '处理动作错误')
    return
  }

  const updated = await store.resolveInventoryCheckItem(itemId, {
    action: payload.action === 'mark_normal' ? 'mark_normal' : 'adjust',
    operator: payload.operator || profile.userName || '系统',
    note: payload.note,
  })
  if (!updated) {
    failure(res, 404, 404, '盘点项不存在')
    return
  }
  res.json(success(serializeInventoryCheckItem(updated)))
}))

app.get('/settings', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const settings = await store.getSettings()
  res.json(success(serializeSettings(settings)))
}))

app.put('/settings', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const currentSettings = await store.getSettings()
  const nextSettings = normalizeSettingsData(req.body, currentSettings)
  if (!nextSettings.notice.updatedAt) {
    nextSettings.notice.updatedAt = now()
  }
  await store.saveSettings(nextSettings)
  res.json(success(serializeSettings(nextSettings)))
}))

app.get('/finance/summary', asyncHandler(async (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }

  const orders = await store.listOrders()
  res.json(success(buildFinanceSummary(orders)))
}))

app.use((req, res) => {
  failure(res, 404, 404, `INVALID_PATH: ${req.method} ${req.path}`)
})

app.use((error, req, res, next) => {
  failure(res, 500, 500, error instanceof Error ? error.message : '服务端异常')
})

const port = Number(process.env.PORT || 3000)
store.init()
  .then(() => {
    app.listen(port, () => {
      const database = store.getDbConfig()
      // eslint-disable-next-line no-console
      console.log(`yanjing local api listening on ${port}`)
      // eslint-disable-next-line no-console
      console.log(`mysql: ${database.host}:${database.port}/${database.database}`)
    })
  })
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('failed to initialize mysql store:', error instanceof Error ? error.message : error)
    process.exit(1)
  })
