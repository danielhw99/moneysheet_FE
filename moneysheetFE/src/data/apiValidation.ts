import { ApiError } from '../api/httpClient'
import { validDate } from '../utils/date'

export const protocol = (): never => { throw new ApiError(0, 'PROTOCOL', '서버 응답을 확인하지 못했어요. 다시 조회해 주세요.') }
export const invalid = (message = '입력한 값과 관리 월을 확인해 주세요.'): never => { throw new ApiError(400, 'VALIDATION', message) }
export const object = (v: unknown): Record<string, unknown> => !v || typeof v !== 'object' || Array.isArray(v) ? protocol() : v as Record<string, unknown>
export const safe = (v: unknown): number => typeof v === 'number' && Number.isSafeInteger(v) ? v : protocol()
export const positiveTotal = (v: unknown): number => { const n = safe(v); return n >= 0 ? n : protocol() }
export const money = (v: unknown): number => { const n = positiveTotal(v); return n >= 1 && n <= 9999999999 ? n : protocol() }
export const id = (v: unknown): string => typeof v === 'string' && /^[1-9][0-9]{0,18}$/.test(v) && BigInt(v) <= 9223372036854775807n ? v : protocol()
export const date = (v: unknown): string => typeof v === 'string' && v.slice(0,4) !== '0000' && validDate(v) ? v : protocol()
export const month = (v: string): string => /^\d{4}-(0[1-9]|1[0-2])$/.test(v) && v.slice(0,4) !== '0000' ? v : invalid()
export const text = (v: unknown, maximum = 255): string => typeof v === 'string' && !!v.trim() && [...v].length <= maximum ? v : protocol()
export const array = (v: unknown): unknown[] => Array.isArray(v) ? v : protocol()
export const bool = (v: unknown): boolean => typeof v === 'boolean' ? v : protocol()
export const inputId = (v: string): string => { try { return id(v) } catch { return invalid() } }
export const inputDate = (v: string, m: string): string => validDate(v) && v.slice(0,7) === month(m) ? v : invalid('같은 관리 월의 날짜를 선택해 주세요.')
