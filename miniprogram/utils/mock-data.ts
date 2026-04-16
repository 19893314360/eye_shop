export interface MetricItem {
  label: string
  value: string
  today: string
}

export interface ModuleItem {
  name: string
  icon: string
  iconBg: string
  iconColor: string
  badge?: string
}

export interface ModuleSection {
  title: string
  items: ModuleItem[]
}

export interface QuickActionItem {
  name: string
  placeholder: string
  mode: 'scan' | 'arrow'
}

export interface MineItem {
  name: string
  icon: string
  iconBg: string
  iconColor: string
  value?: string
}

export interface MineSection {
  items: MineItem[]
}

export interface SalesRankRow {
  rank: number
  name: string
  amount: string
  isCurrentUser?: boolean
  medalType: 'gold' | 'silver' | 'bronze' | 'plain'
}

export interface ManagerOverviewStats {
  totalOrders: string
  totalSales: string
  avgOrderAmount: string
  salesQuantity: string
  salesAmount: string
  refundQuantity: string
  refundAmount: string
  orderSummaryLabel: string
  orderCount: string
  soldQuantity: string
  soldAmount: string
}

export interface ManagerDetailRow {
  label: string
  orderCount: string
  saleCount: string
  amount: string
}

export interface ManagerCollectionRow {
  label: string
  count: string
  amount: string
}

export interface ManagerArrearsRow {
  customer: string
  phone: string
  amount: string
  overdue: string
}

export interface ManagerStats {
  overview: ManagerOverviewStats
  detail: ManagerDetailRow[]
  collection: ManagerCollectionRow[]
  arrears: ManagerArrearsRow[]
  salesRank: SalesRankRow[]
}

export interface SalesOverviewCard {
  label: string
  value: string
  unit?: string
  accent?: 'primary' | 'warning'
}

export interface SalesDashboard {
  overview: SalesOverviewCard[]
  salesRank: SalesRankRow[]
}

const palette = {
  cyan: {
    bg: '#dff8fb',
    color: '#16bccb',
  },
  blue: {
    bg: '#dff0ff',
    color: '#34a3ff',
  },
  green: {
    bg: '#e5f7df',
    color: '#6bbf3b',
  },
  lime: {
    bg: '#f3f8d9',
    color: '#94c745',
  },
  orange: {
    bg: '#fff1d8',
    color: '#ffb326',
  },
  pink: {
    bg: '#ffe0ef',
    color: '#f35a9d',
  },
} as const

function createModule(
  name: string,
  icon: string,
  colorKey: keyof typeof palette,
  badge?: string
): ModuleItem {
  return {
    name,
    icon,
    iconBg: palette[colorKey].bg,
    iconColor: palette[colorKey].color,
    badge,
  }
}

function createMineItem(
  name: string,
  icon: string,
  colorKey: keyof typeof palette,
  value?: string
): MineItem {
  return {
    name,
    icon,
    iconBg: palette[colorKey].bg,
    iconColor: palette[colorKey].color,
    value,
  }
}

function createRankRow(rank: number, name: string, amount: string, isCurrentUser = false): SalesRankRow {
  let medalType: SalesRankRow['medalType'] = 'plain'
  if (rank === 1) {
    medalType = 'gold'
  } else if (rank === 2) {
    medalType = 'silver'
  } else if (rank === 3) {
    medalType = 'bronze'
  }

  return {
    rank,
    name,
    amount,
    isCurrentUser,
    medalType,
  }
}

const customerHomeMetrics: MetricItem[] = [
  { label: '待取件', value: '1', today: '今日：0' },
  { label: '待复查', value: '2', today: '今日：1' },
  { label: '视训计划', value: '4', today: '今日：1' },
  { label: '会员积分', value: '268', today: '本月：+20' },
]

const salesHomeMetrics: MetricItem[] = [
  { label: '服务预约', value: '0', today: '今日：0' },
  { label: '待收款额', value: '0', today: '今日：0' },
  { label: '7天未取件', value: '1095', today: '今日：2' },
  { label: '视力档案', value: '2188', today: '今日：9' },
]

const managerHomeMetrics: MetricItem[] = [
  { label: '服务预约', value: '8', today: '今日：2' },
  { label: '待收款额', value: '229', today: '今日：0' },
  { label: '7天未取件', value: '1095', today: '今日：2' },
  { label: '视力档案', value: '2188', today: '今日：9' },
]

const customerHomeSections: ModuleSection[] = [
  {
    title: '客户服务',
    items: [
      createModule('服务预约', '约', 'green'),
      createModule('我的订单', '单', 'blue'),
      createModule('视力档案', '档', 'cyan'),
      createModule('售后申请', '后', 'pink'),
    ],
  },
  {
    title: '会员中心',
    items: [
      createModule('余额查询', '余', 'orange'),
      createModule('积分明细', '积', 'green'),
      createModule('消息中心', '信', 'blue'),
      createModule('常见问题', '问', 'cyan'),
    ],
  },
]

const salesHomeSections: ModuleSection[] = [
  {
    title: '销售管理',
    items: [
      createModule('新增会员', '会', 'green'),
      createModule('新增验光', '光', 'blue'),
      createModule('普通开单', '单', 'blue'),
      createModule('验配开单', '验', 'cyan'),
      createModule('会员查询', '查', 'green'),
      createModule('配镜记录', '记', 'blue'),
      createModule('取件提醒', '铃', 'blue'),
      createModule('顾客取件', '取', 'cyan'),
    ],
  },
  {
    title: '会员服务',
    items: [
      createModule('会员充值', '充', 'green'),
      createModule('积分兑换', '积', 'blue'),
      createModule('售后回访', '访', 'green', '3'),
      createModule('处理复查', '复', 'lime', '7'),
    ],
  },
  {
    title: '视觉训练',
    items: [
      createModule('视训方案', '训', 'cyan'),
      createModule('视训核销', '核', 'cyan'),
      createModule('设备租借', '租', 'cyan'),
      createModule('视训提醒', '提', 'cyan'),
    ],
  },
]

const managerHomeSections: ModuleSection[] = [
  ...salesHomeSections,
  {
    title: '经营支撑',
    items: [
      createModule('采购订单', '采', 'orange'),
      createModule('采购入库', '入', 'orange'),
      createModule('财务汇总', '财', 'orange'),
      createModule('门店管理', '店', 'pink'),
    ],
  },
]

const customerWorkbenchSections: ModuleSection[] = [
  {
    title: '常用功能',
    items: [
      createModule('服务预约', '约', 'green'),
      createModule('我的订单', '单', 'blue'),
      createModule('视力档案', '档', 'cyan'),
      createModule('售后申请', '后', 'pink'),
    ],
  },
]

const salesWorkbenchSections: ModuleSection[] = [
  {
    title: '销售管理',
    items: [
      createModule('服务预约', '约', 'blue'),
      createModule('验光单', '验', 'blue'),
      createModule('配镜单', '镜', 'blue', '1138'),
      createModule('会员充值', '充', 'cyan'),
      createModule('积分兑换', '积', 'cyan'),
      createModule('销售退货', '退', 'cyan'),
      createModule('销售换货', '换', 'cyan'),
      createModule('物品寄存', '寄', 'blue'),
    ],
  },
  {
    title: '视光服务',
    items: [
      createModule('视训方案', '训', 'cyan'),
      createModule('充值记录', '充', 'cyan'),
      createModule('核销记录', '核', 'cyan'),
      createModule('设备租借', '租', 'cyan'),
      createModule('生物测量', '测', 'cyan'),
    ],
  },
  {
    title: '采购管理',
    items: [
      createModule('采购订单', '采', 'orange'),
      createModule('采购入库', '入', 'orange'),
      createModule('镜架入库', '架', 'orange'),
      createModule('采购退货', '退', 'orange'),
    ],
  },
  {
    title: '财务管理',
    items: [
      createModule('财务汇总', '财', 'orange'),
      createModule('收款商户号', '率', 'orange'),
      createModule('打印模板设置', '印', 'orange'),
      createModule('软件更新日志', '志', 'orange'),
    ],
  },
  {
    title: '视觉训练',
    items: [
      createModule('视训方案', '训', 'cyan'),
      createModule('视训核销', '核', 'cyan'),
      createModule('设备租借', '租', 'cyan'),
      createModule('视训提醒', '提', 'cyan'),
    ],
  },
  {
    title: '其它相关',
    items: [
      createModule('镜片价目册', '册', 'cyan'),
      createModule('调拨出库', '出', 'cyan'),
      createModule('调拨收货', '收', 'cyan'),
      createModule('库存盘点', '盘', 'cyan'),
      createModule('开始加工', '工', 'cyan'),
      createModule('费用报销', '费', 'orange'),
      createModule('视力筛查', '筛', 'green'),
      createModule('库存不足', '缺', 'pink'),
      createModule('库存超限', '超', 'orange'),
      createModule('库存追踪', '追', 'cyan'),
    ],
  },
]

const managerWorkbenchSections: ModuleSection[] = [
  ...salesWorkbenchSections,
  {
    title: '系统管理',
    items: [
      createModule('公告新闻', '公', 'pink'),
      createModule('系统设置', '设', 'orange'),
      createModule('门店管理', '店', 'pink'),
      createModule('人员与权限', '权', 'green'),
    ],
  },
]

const customerQuickActions: QuickActionItem[] = [
  { name: '我的订单', placeholder: '查看订单与加工进度', mode: 'arrow' },
  { name: '售后申请', placeholder: '发起复查、售后与问题反馈', mode: 'arrow' },
]

const commonQuickActions: QuickActionItem[] = [
  { name: '快速查单', placeholder: '请输入完整单号或扫码', mode: 'scan' },
  { name: '售后追溯', placeholder: '单号、卡号、手机号或扫码', mode: 'scan' },
  { name: '库存查询', placeholder: '商品名称搜索或点击查找', mode: 'arrow' },
]

const customerMineSections: MineSection[] = [
  {
    items: [
      createMineItem('个人资料', '人', 'blue'),
      createMineItem('消息中心', '信', 'green'),
      createMineItem('常见问题', '问', 'cyan'),
      createMineItem('教学视频', '播', 'orange'),
    ],
  },
]

const salesMineSections: MineSection[] = [
  {
    items: [
      createMineItem('公告新闻', '公', 'pink'),
      createMineItem('顾客端小程序码', '码', 'green'),
      createMineItem('个人资料（账号密码）', '人', 'orange'),
      createMineItem('系统设置', '设', 'orange'),
      createMineItem('打印模板设置', '印', 'orange'),
      createMineItem('绑定收款盒子', '绑', 'pink'),
    ],
  },
  {
    items: [
      createMineItem('收款商户号', '率', 'orange', '费率 0.3%'),
      createMineItem('软件更新日志', '志', 'orange'),
      createMineItem('设备支持', '设', 'orange'),
      createMineItem('教学视频', '播', 'orange'),
    ],
  },
]

const managerMineSections: MineSection[] = [
  {
    items: [
      createMineItem('公告新闻', '公', 'pink'),
      createMineItem('门店管理', '店', 'green'),
      createMineItem('人员与权限', '权', 'blue'),
      createMineItem('系统设置', '设', 'orange'),
      createMineItem('打印模板设置', '印', 'orange'),
      createMineItem('绑定收款盒子', '绑', 'pink'),
    ],
  },
  {
    items: [
      createMineItem('收款商户号', '率', 'orange', '费率 0.3%'),
      createMineItem('软件更新日志', '志', 'orange'),
      createMineItem('设备支持', '设', 'orange'),
      createMineItem('教学视频', '播', 'orange'),
    ],
  },
]

const managerStatsToday: Omit<ManagerStats, 'salesRank'> = {
  overview: {
    totalOrders: '11',
    totalSales: '6039.00',
    avgOrderAmount: '612.44',
    salesQuantity: '29',
    salesAmount: '6039.00',
    refundQuantity: '0',
    refundAmount: '0',
    orderSummaryLabel: '配镜单',
    orderCount: '11',
    soldQuantity: '29',
    soldAmount: '6039',
  },
  detail: [
    { label: '普通配镜', orderCount: '8', saleCount: '21', amount: '4380.00' },
    { label: '验配开单', orderCount: '2', saleCount: '6', amount: '980.00' },
    { label: '会员充值', orderCount: '1', saleCount: '2', amount: '320.00' },
    { label: '售后返修', orderCount: '0', saleCount: '0', amount: '0.00' },
  ],
  collection: [
    { label: '微信收款', count: '8', amount: '4399.00' },
    { label: '会员余额', count: '2', amount: '960.00' },
    { label: '现金收款', count: '1', amount: '680.00' },
  ],
  arrears: [
    { customer: '张先生', phone: '138****1234', amount: '299.00', overdue: '1天' },
    { customer: '李女士', phone: '139****5678', amount: '380.00', overdue: '3天' },
  ],
}

const managerStatsMonth: Omit<ManagerStats, 'salesRank'> = {
  overview: {
    totalOrders: '318',
    totalSales: '126380.00',
    avgOrderAmount: '679.46',
    salesQuantity: '812',
    salesAmount: '126380.00',
    refundQuantity: '6',
    refundAmount: '1280.00',
    orderSummaryLabel: '配镜单',
    orderCount: '318',
    soldQuantity: '812',
    soldAmount: '126380',
  },
  detail: [
    { label: '普通配镜', orderCount: '236', saleCount: '620', amount: '96880.00' },
    { label: '验配开单', orderCount: '48', saleCount: '128', amount: '18560.00' },
    { label: '会员充值', orderCount: '24', saleCount: '44', amount: '6980.00' },
    { label: '售后返修', orderCount: '10', saleCount: '20', amount: '3960.00' },
  ],
  collection: [
    { label: '微信收款', count: '212', amount: '90360.00' },
    { label: '会员余额', count: '64', amount: '16380.00' },
    { label: '现金收款', count: '42', amount: '19640.00' },
  ],
  arrears: [
    { customer: '张先生', phone: '138****1234', amount: '299.00', overdue: '1天' },
    { customer: '李女士', phone: '139****5678', amount: '380.00', overdue: '3天' },
    { customer: '王女士', phone: '136****9012', amount: '560.00', overdue: '5天' },
    { customer: '赵先生', phone: '137****6688', amount: '920.00', overdue: '8天' },
  ],
}

const salesOverviewToday: SalesOverviewCard[] = [
  { label: '今日销售额', value: '2084', unit: '元', accent: 'primary' },
  { label: '今日订单', value: '5', unit: '单' },
  { label: '今日收款', value: '2084', unit: '元' },
  { label: '待处理复查', value: '2', unit: '条', accent: 'warning' },
]

const salesOverviewMonth: SalesOverviewCard[] = [
  { label: '本月销售额', value: '42300', unit: '元', accent: 'primary' },
  { label: '本月订单', value: '86', unit: '单' },
  { label: '本月收款', value: '42300', unit: '元' },
  { label: '未结清订单', value: '4', unit: '单', accent: 'warning' },
]

function buildRankRows(period: 'today' | 'month', currentUserName = ''): SalesRankRow[] {
  const currentName = currentUserName || '当前登录人'

  if (period === 'today') {
    return [
      createRankRow(1, '文希', '2084.00'),
      createRankRow(2, '马', '688.00'),
      createRankRow(3, `${currentName}（当前登录人）`, '680.00', true),
      createRankRow(4, '张', '593.00'),
      createRankRow(5, '李', '500.00'),
    ]
  }

  return [
    createRankRow(1, '文希', '42300.00'),
    createRankRow(2, '马', '28680.00'),
    createRankRow(3, `${currentName}（当前登录人）`, '24560.00', true),
    createRankRow(4, '张', '19380.00'),
    createRankRow(5, '李', '16880.00'),
  ]
}

export function getHomeNotice(role: UserRole): string {
  if (role === 'customer') {
    return '会员消息已更新，点击查看最新配镜与复查提醒'
  }
  return '点击查看系统更新公告（2026-03-12）'
}

export function getHomeMetrics(role: UserRole): MetricItem[] {
  if (role === 'customer') {
    return customerHomeMetrics
  }
  if (role === 'manager') {
    return managerHomeMetrics
  }
  return salesHomeMetrics
}

export function getHomeSections(role: UserRole): ModuleSection[] {
  if (role === 'customer') {
    return customerHomeSections
  }
  if (role === 'manager') {
    return managerHomeSections
  }
  return salesHomeSections
}

export function getWorkbenchSections(role: UserRole): ModuleSection[] {
  if (role === 'customer') {
    return customerWorkbenchSections
  }
  if (role === 'manager') {
    return managerWorkbenchSections
  }
  return salesWorkbenchSections
}

export function getWorkbenchQuickActions(role: UserRole): QuickActionItem[] {
  return role === 'customer' ? customerQuickActions : commonQuickActions
}

export function getMineSections(role: UserRole): MineSection[] {
  if (role === 'customer') {
    return customerMineSections
  }
  if (role === 'manager') {
    return managerMineSections
  }
  return salesMineSections
}

export function getManagerStats(period: 'today' | 'month', currentUserName = ''): ManagerStats {
  const source = period === 'today' ? managerStatsToday : managerStatsMonth
  return {
    ...source,
    salesRank: buildRankRows(period, currentUserName),
  }
}

export function getSalesDashboard(period: 'today' | 'month', currentUserName = ''): SalesDashboard {
  return {
    overview: period === 'today' ? salesOverviewToday : salesOverviewMonth,
    salesRank: buildRankRows(period, currentUserName),
  }
}
