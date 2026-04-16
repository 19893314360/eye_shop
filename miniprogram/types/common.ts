export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
  requestId?: string
}

export interface AppRequestOptions<TData = unknown> {
  url: string
  method?: HttpMethod
  data?: TData
  headers?: Record<string, string>
  timeout?: number
  withAuth?: boolean
}

export class AppRequestError extends Error {
  readonly code: number
  readonly statusCode: number
  readonly requestId: string
  readonly url: string

  constructor(message: string, code = -1, statusCode = 0, requestId = '', url = '') {
    super(message)
    this.name = 'AppRequestError'
    this.code = code
    this.statusCode = statusCode
    this.requestId = requestId
    this.url = url
  }
}
