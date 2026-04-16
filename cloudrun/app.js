const express = require('express')

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

const usersByToken = new Map()
const members = [
  {
    id: 'M1001',
    name: '测试会员A',
    mobile: '13800000001',
    gender: 'female',
    birthday: '',
    note: '系统初始化',
    createdAt: Date.now() - 86400000,
  },
]
const orders = []

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

function normalizeRole(role) {
  if (role === 'customer' || role === 'sales' || role === 'manager') {
    return role
  }
  return 'sales'
}

function defaultPermissionsByRole(role) {
  if (role === 'manager') {
    return ['member:create', 'order:create', 'order:pay', 'order:deliver', 'settings:manage']
  }
  if (role === 'sales') {
    return ['member:create', 'order:create', 'order:pay', 'order:deliver']
  }
  return ['order:view']
}

function parseBearerToken(authHeader = '') {
  const matched = authHeader.match(/^Bearer\s+(.+)$/i)
  return matched ? matched[1] : ''
}

function mustAuth(req, res) {
  const token = parseBearerToken(req.headers.authorization || '')
  if (!token || !usersByToken.has(token)) {
    failure(res, 401, 401, '未登录或 token 失效')
    return null
  }
  return usersByToken.get(token)
}

app.get('/', (req, res) => {
  res.json(success({ service: 'yanjing-cloudrun-api', status: 'ok', time: now() }))
})

app.get('/health', (req, res) => {
  res.json(success({ status: 'ok' }))
})

app.post('/auth/login', (req, res) => {
  const body = req.body || {}
  const code = String(body.code || '').trim()
  const desiredRole = normalizeRole(body.desired_role || body.desiredRole || 'sales')
  if (!code) {
    failure(res, 400, 400, '缺少 code')
    return
  }
  const token = `dev-token-${now()}-${Math.random().toString(36).slice(2, 10)}`
  const profile = {
    user_id: `U-${desiredRole}`,
    user_name: desiredRole === 'manager' ? '店长账号' : desiredRole === 'sales' ? '销售账号' : '客户账号',
    role: desiredRole,
    permissions: defaultPermissionsByRole(desiredRole),
    store_id: 'STORE-001',
    store_name: '徐记眼镜店',
    mobile: '18800000000',
  }
  usersByToken.set(token, profile)
  res.json(
    success({
      token,
      refresh_token: `refresh-${token}`,
      expires_at: now() + 7 * 24 * 60 * 60 * 1000,
    })
  )
})

app.get('/auth/profile', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  res.json(success(profile))
})

app.get('/members', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  const keyword = String(req.query.keyword || '').trim()
  const list = keyword
    ? members.filter((item) => item.name.includes(keyword) || item.mobile.includes(keyword))
    : [...members]
  res.json(success(list))
})

app.post('/members', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  const body = req.body || {}
  const name = String(body.member_name || body.name || '').trim()
  const mobile = String(body.phone || body.mobile || '').trim()
  if (!name || !mobile) {
    failure(res, 400, 400, '会员姓名和手机号必填')
    return
  }
  if (members.some((item) => item.mobile === mobile)) {
    failure(res, 409, 409, '手机号已存在')
    return
  }
  const created = {
    id: `M${now()}`,
    name,
    mobile,
    gender: String(body.gender || 'unknown'),
    birthday: String(body.birthday || ''),
    note: String(body.note || ''),
    createdAt: now(),
  }
  members.unshift(created)
  res.json(success(created))
})

app.get('/orders', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  const status = String(req.query.status || '').trim()
  const keyword = String(req.query.keyword || '').trim()
  let list = [...orders]
  if (status) {
    list = list.filter((item) => item.status === status)
  }
  if (keyword) {
    list = list.filter(
      (item) =>
        item.orderNo.includes(keyword) || item.memberName.includes(keyword) || item.itemName.includes(keyword)
    )
  }
  res.json(success(list))
})

app.post('/orders', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  const body = req.body || {}
  const memberId = String(body.member_id || body.memberId || '').trim()
  const orderType = String(body.order_type || body.orderType || 'normal').trim() || 'normal'
  const itemName = String(body.item_name || body.itemName || '').trim()
  const quantity = Number(body.quantity || 0)
  const unitPrice = Number(body.unit_price || body.unitPrice || 0)

  const member = members.find((item) => item.id === memberId)
  if (!member) {
    failure(res, 404, 404, '会员不存在')
    return
  }
  if (!itemName || quantity <= 0 || unitPrice <= 0) {
    failure(res, 400, 400, '订单参数不合法')
    return
  }

  const createdAt = now()
  const order = {
    id: `O${createdAt}`,
    orderNo: `NO${String(createdAt).slice(-8)}`,
    memberId: member.id,
    memberName: member.name,
    orderType: orderType === 'optometry' ? 'optometry' : 'normal',
    itemName,
    quantity,
    unitPrice,
    amount: Number((quantity * unitPrice).toFixed(2)),
    status: 'awaiting_payment',
    createdAt,
    paidAt: undefined,
    deliveredAt: undefined,
    payChannel: undefined,
  }
  orders.unshift(order)
  res.json(success(order))
})

app.post('/orders/:id/pay', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  const id = String(req.params.id || '')
  const body = req.body || {}
  const payChannel = String(body.pay_channel || body.payChannel || '').trim()
  const paidAmount = Number(body.paid_amount || body.paidAmount || 0)

  const order = orders.find((item) => item.id === id)
  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'awaiting_payment') {
    failure(res, 409, 409, '订单状态不允许收款')
    return
  }
  if (!payChannel || paidAmount <= 0 || paidAmount < order.amount) {
    failure(res, 400, 400, '收款参数不合法')
    return
  }

  order.status = 'ready_delivery'
  order.paidAt = now()
  order.payChannel = payChannel
  res.json(success(order))
})

app.post('/orders/:id/deliver', (req, res) => {
  const profile = mustAuth(req, res)
  if (!profile) {
    return
  }
  const id = String(req.params.id || '')
  const order = orders.find((item) => item.id === id)
  if (!order) {
    failure(res, 404, 404, '订单不存在')
    return
  }
  if (order.status !== 'ready_delivery') {
    failure(res, 409, 409, '订单状态不允许取件')
    return
  }
  order.status = 'completed'
  order.deliveredAt = now()
  res.json(success(order))
})

app.use((req, res) => {
  failure(res, 404, 404, `INVALID_PATH: ${req.method} ${req.path}`)
})

const port = Number(process.env.PORT || 80)
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`yanjing cloudrun api listening on ${port}`)
})
