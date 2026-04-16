import { CreateMemberPayload, Member, MemberGender } from '../types/member'
import { http } from '../utils/request'
import { readNumber, readString } from './codec'
import { buildRequestPayload } from './payload'

function normalizeGender(value: string): MemberGender {
  if (value === 'male' || value === 'female' || value === 'unknown') {
    return value
  }
  return 'unknown'
}

function toCreateMemberDTO(payload: CreateMemberPayload): Record<string, unknown> {
  return buildRequestPayload([
    { snake: 'member_name', camel: 'name', value: payload.name },
    { snake: 'phone', camel: 'mobile', value: payload.mobile },
    { snake: 'gender', camel: 'gender', value: payload.gender },
    { snake: 'birthday', camel: 'birthday', value: payload.birthday },
    { snake: 'note', camel: 'note', value: payload.note },
  ])
}

function toMember(raw: unknown): Member {
  return {
    id: readString(raw, ['id', 'member_id']),
    name: readString(raw, ['name', 'member_name']),
    mobile: readString(raw, ['mobile', 'phone']),
    gender: normalizeGender(readString(raw, ['gender'])),
    birthday: readString(raw, ['birthday']),
    note: readString(raw, ['note']),
    createdAt: readNumber(raw, ['createdAt', 'created_at']),
  }
}

export async function createMemberDriver(payload: CreateMemberPayload): Promise<Member> {
  const raw = await http.post<unknown, Record<string, unknown>>('/members', toCreateMemberDTO(payload))
  return toMember(raw)
}

export async function listMembersDriver(keyword = ''): Promise<Member[]> {
  const raw = await http.get<unknown[]>('/members', {
    data: { keyword },
  })
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => toMember(item))
}
