import { getAppState, setRole as setStateRole } from '../store/app-state'

export const ROLE_LABEL: Record<UserRole, string> = {
  customer: '客户',
  sales: '销售员',
  manager: '管理者',
}

export const ROLE_OPTIONS: Array<{ key: UserRole; label: string; desc: string }> = [
  { key: 'customer', label: '客户', desc: '预约、查单、查看档案和消息提醒。' },
  { key: 'sales', label: '销售员', desc: '开单、收款、会员维护、售后与视训。' },
  { key: 'manager', label: '管理者', desc: '报表分析、库存采购、系统配置与权限。' },
]

export function isUserRole(value: string): value is UserRole {
  return value === 'customer' || value === 'sales' || value === 'manager'
}

export function getRole(): UserRole {
  return getAppState().role
}

export function setRole(role: UserRole) {
  setStateRole(role)
}
