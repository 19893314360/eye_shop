import { createAppointmentDriver, listAppointmentsDriver, markAppointmentArrivedDriver } from '../drivers/appointment-driver'
import { AppointmentItem, CreateAppointmentPayload, ListAppointmentsParams } from '../types/appointment'

export function listAppointments(params: ListAppointmentsParams = {}): Promise<AppointmentItem[]> {
  return listAppointmentsDriver(params)
}

export function createAppointment(payload: CreateAppointmentPayload): Promise<AppointmentItem> {
  return createAppointmentDriver(payload)
}

export function markAppointmentArrived(appointmentId: string): Promise<AppointmentItem> {
  return markAppointmentArrivedDriver(appointmentId)
}
