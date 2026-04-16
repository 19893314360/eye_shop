import { getRuntimeConfig } from '../services/runtime-config'

interface FieldEntry {
  snake: string
  camel: string
  value: unknown
}

export function buildRequestPayload(fields: FieldEntry[]): Record<string, unknown> {
  const style = getRuntimeConfig().requestKeyStyle
  const payload: Record<string, unknown> = {}
  for (const field of fields) {
    if (style === 'snake') {
      payload[field.snake] = field.value
      continue
    }
    if (style === 'camel') {
      payload[field.camel] = field.value
      continue
    }
    payload[field.snake] = field.value
    payload[field.camel] = field.value
  }
  return payload
}
