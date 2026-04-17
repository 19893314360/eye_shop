export type AfterSaleType = 'return' | 'exchange' | 'repair' | 'refund'
export type AfterSaleApplyStatus = 'pending' | 'followed_up' | 'completed'

export interface AfterSaleRecord {
  orderId: string
  followed: boolean
  rechecked: boolean
  updatedAt: number
}

export interface AfterSaleApply {
  id: string
  orderId: string
  type: AfterSaleType
  reason: string
  remark: string
  phone: string
  images: string[]
  status: AfterSaleApplyStatus
  applicant: string
  createdAt: number
}

export interface CreateAfterSaleApplyPayload {
  orderId: string
  type: AfterSaleType
  reason: string
  remark: string
  phone: string
  images: string[]
}
