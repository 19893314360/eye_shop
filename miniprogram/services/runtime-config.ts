import { ENV } from '../config/env'

const RUNTIME_CONFIG_KEY = 'yanjing-runtime-config'

export interface RuntimeConfig {
  useMockApi: boolean
  apiBaseUrl: string
  requestKeyStyle: 'snake' | 'camel' | 'both'
}

const defaultRuntimeConfig: RuntimeConfig = {
  useMockApi: ENV.useMockApi,
  apiBaseUrl: ENV.apiBaseUrl,
  requestKeyStyle: 'both',
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function normalize(raw: unknown): RuntimeConfig {
  if (!raw || typeof raw !== 'object') {
    return { ...defaultRuntimeConfig }
  }
  const source = raw as Partial<RuntimeConfig>
  return {
    useMockApi: source.useMockApi !== false,
    apiBaseUrl: typeof source.apiBaseUrl === 'string' ? normalizeUrl(source.apiBaseUrl) : defaultRuntimeConfig.apiBaseUrl,
    requestKeyStyle:
      source.requestKeyStyle === 'snake' || source.requestKeyStyle === 'camel' || source.requestKeyStyle === 'both'
        ? source.requestKeyStyle
        : defaultRuntimeConfig.requestKeyStyle,
  }
}

export function getRuntimeConfig(): RuntimeConfig {
  const raw = wx.getStorageSync(RUNTIME_CONFIG_KEY)
  const next = normalize(raw)
  wx.setStorageSync(RUNTIME_CONFIG_KEY, next)
  return next
}

export function saveRuntimeConfig(config: RuntimeConfig): RuntimeConfig {
  const next = normalize(config)
  wx.setStorageSync(RUNTIME_CONFIG_KEY, next)
  return next
}
