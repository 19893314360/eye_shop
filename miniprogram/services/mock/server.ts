import { LoginRequest, LoginResult, UserContext } from '../../types/auth'
import { CreateMemberPayload, ListMembersParams, Member } from '../../types/member'
import { CreateOrderPayload, ListOrdersParams, PayOrderPayload, SalesOrder } from '../../types/sales'
import { ApiEnvelope, AppRequestError, AppRequestOptions } from '../../types/common'

interface MockRequest extends AppRequestOptions {
  headers: Record<string, string>
}

const permissionMap: Record<UserRole, string[]> = {
  customer: ['order:read:self', 'appointment:create', 'profile:read:self'],
  sales: [
    'member:create',
    'member:read',
    'order:create',
    'order:pay',
    'order:deliver',
    'report:read:self',
  ],
  manager: [
    'member:create',
    'member:read',
    'order:create',
    'order:pay',
    'order:deliver',
    'report:read:all',
    'inventory:manage',
    'purchase:manage',
    'setting:manage',
  ],
}

const userContextMap: Record<UserRole, UserContext> = {
  customer: {
    userId: 'C001',
    userName: '徐记顾客',
    role: 'customer',
    permissions: permissionMap.customer,
    storeId: 'STORE-001',
    storeName: '徐记眼镜店',
    mobile: '13800000001',
  },
  sales: {
    userId: 'S001',
    userName: '徐明',
    role: 'sales',
    permissions: permissionMap.sales,
    storeId: 'STORE-001',
    storeName: '徐记眼镜店',
    mobile: '13800000002',
  },
  manager: {
    userId: 'M001',
    userName: '徐店长',
    role: 'manager',
    permissions: permissionMap.manager,
    storeId: 'STORE-001',
    storeName: '徐记眼镜店',
    mobile: '13800000003',
  },
}

let memberSeed = 1002
let orderSeed = 1001

const members: Member[] = [
  {
    id: 'MEM-1001',
    name: '徐海',
    mobile: '13800001001',
    gender: 'male',
    birthday: '1994-08-19',
    note: '',
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'MEM-1002',
    name: '周宁',
    mobile: '13800001002',
    gender: 'female',
    birthday: '1997-03-12',
    note: '',
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
  },
]

const orders: SalesOrder[] = [
  {
    id: 'ORD-1001',
    orderNo: 'SO202604140001',
    memberId: 'MEM-1001',
    memberName: '徐海',
    orderType: 'normal',
    itemName: '超薄镜片 1.67',
    quantity: 1,
    unitPrice: 399,
    amount: 399,
    status: 'awaiting_payment',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
  },
]

function success<T>(data: T): ApiEnvelope<T> {
  return {
    code: 0,
    message: 'ok',
    data,
    requestId: `MOCK-${Date.now()}`,
  }
}

function failure(message: string, code = 500): never {
  throw new AppRequestError(message, code, 200, `MOCK-${Date.now()}`)
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function nextMemberId(): string {
  memberSeed += 1
  return `MEM-${memberSeed}`
}

function nextOrderId(): string {
  orderSeed += 1
  return `ORD-${orderSeed}`
}

function nextOrderNo(): string {
  const now = new Date()
  const year = `${now.getFullYear()}`
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  const serial = `${orderSeed}`.padStart(4, '0')
  return `SO${year}${month}${day}${serial}`
}

function normalizePath(url: string): string {
  const trimmed = url.trim()
  const noHost = trimmed.replace(/^https?:\/\/[^/]+/i, '')
  const queryIndex = noHost.indexOf('?')
  if (queryIndex >= 0) {
    return noHost.slice(0, queryIndex)
  }
  return noHost || '/'
}

function parseRoleFromToken(token: string): UserRole | '' {
  const prefix = 'mock-token-'
  if (!token.startsWith(prefix)) {
    return ''
  }
  const role = token.slice(prefix.length)
  return role === 'customer' || role === 'sales' || role === 'manager' ? role : ''
}

function parseRoleFromAuthHeader(authValue: string): UserRole | '' {
  const token = authValue.replace(/^Bearer\s+/i, '').trim()
  return parseRoleFromToken(token)
}

function getPathParts(path: string): string[] {
  return path.split('/').filter(Boolean)
}

function parseStatus(value: unknown): ListOrdersParams['status'] {
  return value === 'awaiting_payment' || value === 'ready_delivery' || value === 'completed' ? value : undefined
}

function handleLogin(request: MockRequest): ApiEnvelope<LoginResult> {
  const payload = (request.data || {}) as Partial<LoginRequest>
  const desiredRole = payload.desiredRole || (payload as Partial<{ desired_role: UserRole }>).desired_role
  const role: UserRole = desiredRole === 'customer' || desiredRole === 'sales' || desiredRole === 'manager'
    ? desiredRole
    : 'sales'
  const now = Date.now()
  return success<LoginResult>({
    token: `mock-token-${role}`,
    refreshToken: `mock-refresh-${role}`,
    expiresAt: now + 2 * 60 * 60 * 1000,
  })
}

function handleProfile(request: MockRequest): ApiEnvelope<UserContext> {
  const authValue = request.headers.Authorization || ''
  const role = parseRoleFromAuthHeader(authValue)
  if (!role) {
    return failure('未登录或登录态失效', 401)
  }
  return success<UserContext>(userContextMap[role])
}

function handleListMembers(request: MockRequest): ApiEnvelope<Member[]> {
  const payload = (request.data || {}) as ListMembersParams
  const keyword = (payload.keyword || '').trim()
  if (!keyword) {
    return success([...members].sort((a, b) => b.createdAt - a.createdAt))
  }
  const result = members.filter((item) => item.name.includes(keyword) || item.mobile.includes(keyword))
  return success(result.sort((a, b) => b.createdAt - a.createdAt))
}

function handleCreateMember(request: MockRequest): ApiEnvelope<Member> {
  const payload = (request.data || {}) as Partial<CreateMemberPayload> & Partial<{ member_name: string; phone: string }>
  const name = (payload.name || payload.member_name || '').trim()
  const mobile = (payload.mobile || payload.phone || '').trim()
  const gender = payload.gender || 'unknown'
  const birthday = (payload.birthday || '').trim()
  const note = (payload.note || '').trim()

  if (!name) {
    return failure('姓名不能为空', 400)
  }
  if (!/^1\d{10}$/.test(mobile)) {
    return failure('手机号格式错误', 400)
  }
  if (members.some((item) => item.mobile === mobile)) {
    return failure('手机号已存在', 409)
  }
  if (gender !== 'male' && gender !== 'female' && gender !== 'unknown') {
    return failure('性别参数错误', 400)
  }

  const created: Member = {
    id: nextMemberId(),
    name,
    mobile,
    gender,
    birthday,
    note,
    createdAt: Date.now(),
  }
  members.unshift(created)
  return success(created)
}

function handleListOrders(request: MockRequest): ApiEnvelope<SalesOrder[]> {
  const payload = (request.data || {}) as ListOrdersParams
  const status = parseStatus(payload.status)
  const keyword = (payload.keyword || '').trim()
  let result = [...orders]
  if (status) {
    result = result.filter((item) => item.status === status)
  }
  if (keyword) {
    result = result.filter((item) => {
      return (
        item.orderNo.includes(keyword) ||
        item.memberName.includes(keyword) ||
        item.itemName.includes(keyword)
      )
    })
  }
  result.sort((a, b) => b.createdAt - a.createdAt)
  return success(result)
}

function handleCreateOrder(request: MockRequest): ApiEnvelope<SalesOrder> {
  const payload = (request.data || {}) as Partial<CreateOrderPayload> & Partial<{
    member_id: string
    order_type: CreateOrderPayload['orderType']
    item_name: string
    unit_price: number
  }>
  const memberId = (payload.memberId || payload.member_id || '').trim()
  const orderType = payload.orderType || payload.order_type
  const itemName = (payload.itemName || payload.item_name || '').trim()
  const quantity = Number(payload.quantity || 0)
  const unitPrice = Number(payload.unitPrice || payload.unit_price || 0)

  const member = members.find((item) => item.id === memberId)
  if (!member) {
    return failure('会员不存在', 404)
  }
  if (orderType !== 'normal' && orderType !== 'optometry') {
    return failure('订单类型错误', 400)
  }
  if (!itemName) {
    return failure('商品名称不能为空', 400)
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return failure('数量必须大于 0', 400)
  }
  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    return failure('单价必须大于 0', 400)
  }

  const created: SalesOrder = {
    id: nextOrderId(),
    orderNo: nextOrderNo(),
    memberId: member.id,
    memberName: member.name,
    orderType,
    itemName,
    quantity,
    unitPrice,
    amount: Number((quantity * unitPrice).toFixed(2)),
    status: 'awaiting_payment',
    createdAt: Date.now(),
  }
  orders.unshift(created)
  return success(created)
}

function handlePayOrder(orderId: string, request: MockRequest): ApiEnvelope<SalesOrder> {
  const payload = (request.data || {}) as Partial<PayOrderPayload> & Partial<{
    pay_channel: PayOrderPayload['payChannel']
    paid_amount: number
  }>
  const payChannel = payload.payChannel || payload.pay_channel
  const paidAmount = Number(payload.paidAmount || payload.paid_amount || 0)
  const order = orders.find((item) => item.id === orderId)
  if (!order) {
    return failure('订单不存在', 404)
  }
  if (order.status !== 'awaiting_payment') {
    return failure('订单状态不允许收款', 409)
  }
  if (payChannel !== 'wechat' && payChannel !== 'balance' && payChannel !== 'cash') {
    return failure('支付方式错误', 400)
  }
  if (paidAmount < order.amount) {
    return failure('实收金额不能小于应收金额', 400)
  }

  const updated: SalesOrder = {
    ...order,
    status: 'ready_delivery',
    payChannel,
    paidAt: Date.now(),
  }
  const idx = orders.findIndex((item) => item.id === order.id)
  orders[idx] = updated
  return success(updated)
}

function handleDeliverOrder(orderId: string): ApiEnvelope<SalesOrder> {
  const order = orders.find((item) => item.id === orderId)
  if (!order) {
    return failure('订单不存在', 404)
  }
  if (order.status !== 'ready_delivery') {
    return failure('订单状态不允许取件核销', 409)
  }

  const updated: SalesOrder = {
    ...order,
    status: 'completed',
    deliveredAt: Date.now(),
  }
  const idx = orders.findIndex((item) => item.id === order.id)
  orders[idx] = updated
  return success(updated)
}

export async function mockRequest<T>(request: MockRequest): Promise<ApiEnvelope<T>> {
  await sleep(120)
  const path = normalizePath(request.url)
  const parts = getPathParts(path)

  if (path === '/auth/login' && request.method === 'POST') {
    return handleLogin(request) as ApiEnvelope<T>
  }

  if (path === '/auth/profile' && request.method === 'GET') {
    return handleProfile(request) as ApiEnvelope<T>
  }

  if (path === '/members' && request.method === 'GET') {
    return handleListMembers(request) as ApiEnvelope<T>
  }

  if (path === '/members' && request.method === 'POST') {
    return handleCreateMember(request) as ApiEnvelope<T>
  }

  if (path === '/orders' && request.method === 'GET') {
    return handleListOrders(request) as ApiEnvelope<T>
  }

  if (path === '/orders' && request.method === 'POST') {
    return handleCreateOrder(request) as ApiEnvelope<T>
  }

  if (parts.length === 3 && parts[0] === 'orders' && parts[2] === 'pay' && request.method === 'POST') {
    return handlePayOrder(parts[1], request) as ApiEnvelope<T>
  }

  if (parts.length === 3 && parts[0] === 'orders' && parts[2] === 'deliver' && request.method === 'POST') {
    return handleDeliverOrder(parts[1]) as ApiEnvelope<T>
  }

  return failure(`未实现的 mock 接口: ${request.method} ${path}`, 404)
}
