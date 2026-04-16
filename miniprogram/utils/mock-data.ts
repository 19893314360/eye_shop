export interface MetricItem {
  label: string
  value: string
  today: string
}

export interface ModuleItem {
  name: string
  badge?: string
}

export interface ModuleSection {
  title: string
  items: ModuleItem[]
}

export interface MineItem {
  name: string
  value?: string
}

export interface StatSummary {
  label: string
  value: string
}

export interface RankItem {
  name: string
  amount: string
}

const homeMetricsMap: Record<UserRole, MetricItem[]> = {
  customer: [
    { label: '待取件', value: '1', today: '今日 0' },
    { label: '待复查', value: '2', today: '今日 1' },
    { label: '视训计划', value: '4', today: '今日 1' },
    { label: '会员积分', value: '268', today: '本月 +20' },
  ],
  sales: [
    { label: '服务预约', value: '0', today: '今日 0' },
    { label: '待收款额', value: '0', today: '今日 0' },
    { label: '7天未取件', value: '1095', today: '今日 2' },
    { label: '视力档案', value: '2188', today: '今日 9' },
  ],
  manager: [
    { label: '本月销售额', value: '￥6039', today: '今日 ￥6039' },
    { label: '本月订单数', value: '11', today: '今日 11' },
    { label: '待处理售后', value: '5', today: '今日 1' },
    { label: '库存预警', value: '18', today: '今日 +2' },
  ],
}

const homeSectionsMap: Record<UserRole, ModuleSection[]> = {
  customer: [
    {
      title: '客户服务',
      items: [
        { name: '服务预约' },
        { name: '我的订单' },
        { name: '视力档案' },
        { name: '在线客服' },
      ],
    },
    {
      title: '会员中心',
      items: [
        { name: '余额查询' },
        { name: '积分明细' },
        { name: '优惠券' },
        { name: '售后申请' },
      ],
    },
  ],
  sales: [
    {
      title: '销售管理',
      items: [
        { name: '新增会员' },
        { name: '新增验光' },
        { name: '普通开单' },
        { name: '验光开单' },
        { name: '会员查询' },
        { name: '配镜记录' },
        { name: '取件提醒' },
        { name: '顾客取件' },
      ],
    },
    {
      title: '会员服务',
      items: [
        { name: '会员充值' },
        { name: '积分兑换' },
        { name: '售后回访' },
        { name: '处理复查', badge: '7' },
      ],
    },
    {
      title: '视觉训练',
      items: [
        { name: '视训方案' },
        { name: '视训核销' },
        { name: '设备租借' },
        { name: '视训提醒' },
      ],
    },
  ],
  manager: [
    {
      title: '经营管理',
      items: [
        { name: '门店总览' },
        { name: '销售分析' },
        { name: '收款与欠款' },
        { name: '销售员排行' },
      ],
    },
    {
      title: '库存与采购',
      items: [
        { name: '库存盘点' },
        { name: '调拨出库' },
        { name: '调拨收货' },
        { name: '采购订单' },
        { name: '采购入库' },
        { name: '采购退货' },
      ],
    },
    {
      title: '系统配置',
      items: [
        { name: '公告管理' },
        { name: '打印模板' },
        { name: '费率配置' },
        { name: '权限管理' },
      ],
    },
  ],
}

const workbenchSectionsMap: Record<UserRole, ModuleSection[]> = {
  customer: [
    {
      title: '常用功能',
      items: [{ name: '预约验光' }, { name: '订单查询' }, { name: '售后进度' }, { name: '视训提醒' }],
    },
  ],
  sales: [
    {
      title: '视觉训练',
      items: [{ name: '视训方案' }, { name: '视训核销' }, { name: '设备租借' }, { name: '视训提醒' }],
    },
    {
      title: '其它相关',
      items: [
        { name: '镜片价目册' },
        { name: '调拨出库' },
        { name: '调拨收货' },
        { name: '库存盘点' },
        { name: '开始加工' },
        { name: '费用报销' },
        { name: '视力筛查' },
        { name: '库存不足' },
        { name: '库存超限' },
        { name: '库存追踪' },
      ],
    },
  ],
  manager: [
    {
      title: '核心操作',
      items: [{ name: '销售管理' }, { name: '采购管理' }, { name: '财务管理' }, { name: '系统设置' }],
    },
    {
      title: '运营监控',
      items: [{ name: '库存不足' }, { name: '库存超限' }, { name: '7天未取件' }, { name: '待收款提醒' }],
    },
  ],
}

const mineMenuMap: Record<UserRole, MineItem[]> = {
  customer: [
    { name: '个人资料' },
    { name: '消息中心' },
    { name: '常见问题' },
    { name: '联系客服' },
  ],
  sales: [
    { name: '公告新闻' },
    { name: '顾客端小程序码' },
    { name: '个人资料（账号密码）' },
    { name: '系统设置' },
    { name: '打印模板设置' },
    { name: '绑定收款盒子' },
    { name: '收款商户号', value: '费率 0.3%' },
    { name: '软件更新日志' },
    { name: '设备支持' },
    { name: '教学视频' },
  ],
  manager: [
    { name: '公告新闻' },
    { name: '门店管理' },
    { name: '人员与权限' },
    { name: '打印模板设置' },
    { name: '收款商户号', value: '费率 0.3%' },
    { name: '系统更新日志' },
    { name: '设备管理' },
  ],
}

const salesSummary: StatSummary[] = [
  { label: '单据总数', value: '11' },
  { label: '销售合计', value: '6039.00' },
  { label: '配镜客单价', value: '612.44' },
  { label: '退货金额', value: '0' },
]

const managerSummary: StatSummary[] = [
  { label: '本月营业额', value: '12.6万' },
  { label: '本月订单', value: '933' },
  { label: '收款完成率', value: '96.3%' },
  { label: '库存周转天数', value: '22' },
]

const salesRank: RankItem[] = [
  { name: '徐明', amount: '￥2084.00' },
  { name: '周宁', amount: '￥688.00' },
  { name: '林安', amount: '￥680.00' },
  { name: '陈可', amount: '￥593.00' },
]

const managerRank: RankItem[] = [
  { name: '徐记总店', amount: '￥3.6万' },
  { name: '徐记东城店', amount: '￥3.2万' },
  { name: '徐记西城店', amount: '￥2.8万' },
  { name: '徐记北城店', amount: '￥2.1万' },
]

export function getHomeMetrics(role: UserRole): MetricItem[] {
  return homeMetricsMap[role]
}

export function getHomeSections(role: UserRole): ModuleSection[] {
  return homeSectionsMap[role]
}

export function getWorkbenchSections(role: UserRole): ModuleSection[] {
  return workbenchSectionsMap[role]
}

export function getMineMenu(role: UserRole): MineItem[] {
  return mineMenuMap[role]
}

export function getSummary(role: UserRole): StatSummary[] {
  return role === 'manager' ? managerSummary : salesSummary
}

export function getRank(role: UserRole): RankItem[] {
  return role === 'manager' ? managerRank : salesRank
}
