export type MemberGender = 'male' | 'female' | 'unknown'

export interface Member {
  id: string
  name: string
  mobile: string
  gender: MemberGender
  birthday: string
  note: string
  createdAt: number
}

export interface CreateMemberPayload {
  name: string
  mobile: string
  gender: MemberGender
  birthday: string
  note: string
}

export interface ListMembersParams {
  keyword?: string
}
