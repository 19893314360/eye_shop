import { createMemberDriver, listMembersDriver } from '../drivers/member-driver'
import { CreateMemberPayload, ListMembersParams, Member } from '../types/member'

export function createMember(payload: CreateMemberPayload): Promise<Member> {
  return createMemberDriver(payload)
}

export function listMembers(params: ListMembersParams = {}): Promise<Member[]> {
  return listMembersDriver(params.keyword || '')
}
