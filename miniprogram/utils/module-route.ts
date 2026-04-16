const ROUTE_MAP: Record<string, string> = {
  '新增会员': '/pages/member-create/index',
  '新增验光': '/pages/optometry-create/index',
  '普通开单': '/pages/order-create/index?orderType=normal',
  '验配开单': '/pages/order-create/index?orderType=optometry',
  '验光单': '/pages/optometry-create/index',
  '配镜单': '/pages/order-list/index',
  '我的订单': '/pages/order-list/index',
  '会员查询': '/pages/member-query/index',
  '配镜记录': '/pages/order-list/index',
  '取件提醒': '/pages/delivery/index',
  '顾客取件': '/pages/delivery/index',
  '服务预约': '/pages/appointment/index',
  '会员充值': '/pages/member-center/index?tab=balance',
  '积分兑换': '/pages/member-center/index?tab=points',
  '售后回访': '/pages/after-sale/index?tab=followup',
  '处理复查': '/pages/after-sale/index?tab=recheck',
  '售后追溯': '/pages/after-sale/index?tab=history',
  '售后申请': '/pages/after-sale-apply/index',
  '视训方案': '/pages/training/index?tab=plan',
  '视训核销': '/pages/training/index?tab=checkin',
  '设备租借': '/pages/training/index?tab=device',
  '视训提醒': '/pages/training/index?tab=reminder',
  '充值记录': '/pages/member-center/index?tab=balance',
  '核销记录': '/pages/training/index?tab=checkin',
  '生物测量': '/pages/vision-profile/index',
  '视力档案': '/pages/vision-profile/index',
  '视力筛查': '/pages/vision-profile/index',
  '镜片价目册': '/pages/price-list/index',
  '调拨出库': '/pages/transfer-out/index',
  '调拨收货': '/pages/transfer-in/index',
  '库存盘点': '/pages/inventory-check/index',
  '库存查询': '/pages/inventory/index',
  '库存不足': '/pages/inventory/index?tab=low',
  '库存超限': '/pages/inventory/index?tab=high',
  '库存追踪': '/pages/inventory/index?trace=1',
  '开始加工': '/pages/machining/index',
  '快速查单': '/pages/order-list/index',
  '采购管理': '/pages/purchase/index',
  '采购订单': '/pages/purchase/index?tab=order',
  '采购入库': '/pages/purchase/index?tab=inbound',
  '镜架入库': '/pages/purchase/index?tab=frame',
  '采购退货': '/pages/purchase/index?tab=return',
  '财务管理': '/pages/finance-summary/index',
  '财务汇总': '/pages/finance-summary/index',
  '收款商户号': '/pages/settings/index?tab=rate',
  '公告新闻': '/pages/settings/index?tab=notice',
  '系统设置': '/pages/settings/index?tab=system',
  '打印模板设置': '/pages/settings/index?tab=print',
  '顾客端小程序码': '/pages/mini-qrcode/index',
  '个人资料': '/pages/profile/index',
  '个人资料（账号密码）': '/pages/profile/index',
  '绑定收款盒子': '/pages/device-manage/index?tab=cashbox',
  '软件更新日志': '/pages/changelog/index',
  '系统更新日志': '/pages/changelog/index',
  '设备支持': '/pages/device-manage/index',
  '教学视频': '/pages/tutorial/index',
  '门店管理': '/pages/store-manage/index',
  '人员与权限': '/pages/staff-manage/index',
  '消息中心': '/pages/message-center/index',
  '常见问题': '/pages/faq/index',
  '联系客服': '/pages/customer-service/index',
  '余额查询': '/pages/member-center/index',
  '积分明细': '/pages/member-center/index?tab=points',
  '优惠券': '/pages/member-center/index?tab=coupons',
  '销售管理': '/pages/order-list/index',
  '统计报表': '/pages/stats/index',
}

function normalizeName(name: string): string {
  return name.trim().replace(/（.*$/, '').replace(/\(.*$/, '')
}

export function getModuleRoute(name: string): string {
  const direct = ROUTE_MAP[name]
  if (direct) {
    return direct
  }

  const normalized = normalizeName(name)
  return ROUTE_MAP[normalized] || ''
}
