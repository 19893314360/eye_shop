import { ENV } from '../config/env'
import { getRuntimeConfig } from '../services/runtime-config'
import { clearSession, getAppState } from '../store/app-state'
import { ApiEnvelope, AppRequestError, AppRequestOptions } from '../types/common'
import { mockRequest } from '../services/mock/server'

type RequestHeaders = Record<string, string>

function asObject(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') {
    return {}
  }
  return raw as Record<string, unknown>
}

function normalizeUrl(path: string, apiBaseUrl: string): string {
  if (/^https?:\/\//.test(path)) {
    return path
  }
  return `${apiBaseUrl}${path}`
}

function normalizeHeaders(headers?: Record<string, string>, withAuth = true): RequestHeaders {
  const baseHeaders: RequestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  }
  if (withAuth) {
    const { token } = getAppState()
    if (token) {
      baseHeaders.Authorization = `Bearer ${token}`
    }
  }
  return baseHeaders
}

function toRequestError(error: unknown): AppRequestError {
  if (error instanceof AppRequestError) {
    return error
  }
  if (error instanceof Error) {
    return new AppRequestError(error.message)
  }
  return new AppRequestError('未知请求异常')
}

function normalizeEnvelope<T>(raw: unknown): ApiEnvelope<T> {
  const source = asObject(raw)
  const hasStandardEnvelope = Object.prototype.hasOwnProperty.call(source, 'code') && Object.prototype.hasOwnProperty.call(source, 'data')
  if (hasStandardEnvelope) {
    return {
      code: typeof source.code === 'number' ? source.code : Number(source.code || 0),
      message: typeof source.message === 'string' ? source.message : '',
      data: source.data as T,
      requestId: typeof source.requestId === 'string'
        ? source.requestId
        : (typeof source.request_id === 'string' ? source.request_id : ''),
    }
  }

  const hasSuccessEnvelope = Object.prototype.hasOwnProperty.call(source, 'success') && Object.prototype.hasOwnProperty.call(source, 'data')
  if (hasSuccessEnvelope) {
    const success = source.success === true
    return {
      code: success ? 0 : 1,
      message: typeof source.message === 'string' ? source.message : (success ? 'ok' : '请求失败'),
      data: source.data as T,
      requestId: typeof source.requestId === 'string'
        ? source.requestId
        : (typeof source.request_id === 'string' ? source.request_id : ''),
    }
  }

  return {
    code: 0,
    message: 'ok',
    data: raw as T,
    requestId: '',
  }
}

async function requestByWx<T>(options: Required<Pick<AppRequestOptions, 'url' | 'method' | 'timeout'>> & {
  data?: WechatMiniprogram.IAnyObject | string | ArrayBuffer
  headers: RequestHeaders
}): Promise<ApiEnvelope<T>> {
  return new Promise<ApiEnvelope<T>>((resolve, reject) => {
    wx.request<any>({
      url: options.url,
      method: options.method,
      data: options.data,
      timeout: options.timeout,
      header: options.headers,
      success(res) {
        const { statusCode, data } = res
        if (statusCode >= 200 && statusCode < 300) {
          resolve(normalizeEnvelope<T>(data))
          return
        }
        reject(new AppRequestError(`HTTP 状态异常: ${statusCode}`, statusCode, statusCode, '', options.url))
      },
      fail(error) {
        reject(new AppRequestError(error.errMsg || '网络请求失败', -1, 0, '', options.url))
      },
    })
  })
}

export async function request<T = unknown, TData = unknown>(rawOptions: AppRequestOptions<TData>): Promise<T> {
  const runtime = getRuntimeConfig()
  const withAuth = rawOptions.withAuth != null ? rawOptions.withAuth : true
  const method = rawOptions.method || 'GET'
  const timeout = rawOptions.timeout || ENV.requestTimeout
  if (!runtime.useMockApi && !runtime.apiBaseUrl && !/^https?:\/\//.test(rawOptions.url)) {
    throw new AppRequestError('请先在系统设置配置 API Base URL', -1, 0, '', rawOptions.url)
  }
  const url = normalizeUrl(rawOptions.url, runtime.apiBaseUrl)
  const headers = normalizeHeaders(rawOptions.headers, withAuth)

  try {
    const rawEnvelope = runtime.useMockApi
      ? await mockRequest<T>({
          ...rawOptions,
          url,
          method,
          timeout,
          headers,
          withAuth,
        })
      : await requestByWx<T>({
          url,
          method,
          timeout,
          headers,
          data: rawOptions.data as WechatMiniprogram.IAnyObject | string | ArrayBuffer | undefined,
        })
    const envelope = normalizeEnvelope<T>(rawEnvelope)

    if (envelope.code !== 0) {
      throw new AppRequestError(envelope.message || '请求失败', envelope.code, 200, envelope.requestId || '', url)
    }
    return envelope.data
  } catch (error) {
    const requestError = toRequestError(error)
    const withUrlError = requestError.url
      ? requestError
      : new AppRequestError(requestError.message, requestError.code, requestError.statusCode, requestError.requestId, url)
    if (withUrlError.code === 401) {
      clearSession(true)
    }
    throw withUrlError
  }
}

export const http = {
  get<T = unknown>(url: string, options: Omit<AppRequestOptions, 'url' | 'method'> = {}) {
    return request<T>({
      ...options,
      url,
      method: 'GET',
    })
  },
  post<T = unknown, TData = unknown>(
    url: string,
    data?: TData,
    options: Omit<AppRequestOptions<TData>, 'url' | 'method' | 'data'> = {}
  ) {
    return request<T, TData>({
      ...options,
      url,
      data,
      method: 'POST',
    })
  },
}
