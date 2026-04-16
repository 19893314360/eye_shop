export function getModuleRoute(name: string): string {
  if (name === '新增会员') {
    return '/pages/member-create/index'
  }
  if (name === '新增验光') {
    return '/pages/optometry-create/index'
  }
  if (name === '会员查询') {
    return '/pages/member-query/index'
  }
  if (name === '普通开单') {
    return '/pages/order-create/index?orderType=normal'
  }
  if (name === '验光开单') {
    return '/pages/order-create/index?orderType=optometry'
  }
  if (name === '配镜记录') {
    return '/pages/order-list/index'
  }
  if (name === '待收款提醒') {
    return '/pages/payment/index'
  }
  if (name === '顾客取件' || name === '取件提醒') {
    return '/pages/delivery/index'
  }
  if (name === '售后回访') {
    return '/pages/after-sale/index?tab=followup'
  }
  if (name === '处理复查') {
    return '/pages/after-sale/index?tab=recheck'
  }
  if (name === '售后追溯') {
    return '/pages/after-sale/index?tab=history'
  }
  if (name === '服务预约' || name === '预约验光') {
    return '/pages/appointment/index'
  }
  if (name === '我的订单' || name === '订单查询') {
    return '/pages/order-list/index'
  }
  if (name === '快速查单') {
    return '/pages/order-list/index'
  }
  if (name === '售后进度') {
    return '/pages/after-sale/index?tab=history'
  }
  if (name === '视训方案') {
    return '/pages/training/index?tab=plan'
  }
  if (name === '视训核销') {
    return '/pages/training/index?tab=checkin'
  }
  if (name === '设备租借') {
    return '/pages/training/index?tab=device'
  }
  if (name === '视训提醒') {
    return '/pages/training/index?tab=reminder'
  }
  if (name === '库存查询') {
    return '/pages/inventory/index'
  }
  if (name === '视力档案' || name === '视力筛查') {
    return '/pages/vision-profile/index'
  }
  if (name === '收款与欠款' || name === '财务管理') {
    return '/pages/finance-summary/index'
  }
  if (name === '门店总览' || name === '销售分析' || name === '销售员排行') {
    return '/pages/stats/index'
  }
  if (name === '采购管理') {
    return '/pages/purchase/index'
  }
  if (name === '采购订单') {
    return '/pages/purchase/index?tab=order'
  }
  if (name === '采购入库') {
    return '/pages/purchase/index?tab=inbound'
  }
  if (name === '采购退货') {
    return '/pages/purchase/index?tab=return'
  }
  if (name === '镜架入库') {
    return '/pages/purchase/index?tab=frame'
  }
  if (name === '系统设置') {
    return '/pages/settings/index?tab=system'
  }
  if (name === '系统配置') {
    return '/pages/settings/index?tab=system'
  }
  if (name === '公告新闻' || name === '公告管理') {
    return '/pages/settings/index?tab=notice'
  }
  if (name === '打印模板设置' || name === '打印模板') {
    return '/pages/settings/index?tab=print'
  }
  if (name === '收款商户号' || name === '费率配置') {
    return '/pages/settings/index?tab=rate'
  }
  if (name === '权限管理') {
    return '/pages/settings/index?tab=permission'
  }
  if (name === '库存不足') {
    return '/pages/inventory/index?tab=low'
  }
  if (name === '库存超限') {
    return '/pages/inventory/index?tab=high'
  }
  if (name === '库存追踪') {
    return '/pages/inventory/index?trace=1'
  }
  if (name === '库存盘点') {
    return '/pages/inventory-check/index'
  }
  if (name === '调拨出库') {
    return '/pages/transfer-out/index'
  }
  if (name === '调拨入库' || name === '调拨收货') {
    return '/pages/transfer-in/index'
  }
  return ''
}
