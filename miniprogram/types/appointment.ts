export type AppointmentService = 'optometry' | 'recheck' | 'training'
export type AppointmentStatus = 'pending' | 'done'

export interface AppointmentItem {
  id: string
  customerName: string
  mobile: string
  serviceType: AppointmentService
  date: string
  time: string
  note: string
  status: AppointmentStatus
  createdAt: number
  arrivedAt?: number
}

export interface CreateAppointmentPayload {
  customerName: string
  mobile: string
  serviceType: AppointmentService
  date: string
  time: string
  note: string
}

export interface ListAppointmentsParams {
  status?: AppointmentStatus
  keyword?: string
}
