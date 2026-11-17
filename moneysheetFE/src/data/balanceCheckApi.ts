import type { HttpClient } from '../api/httpClient'
import type { DailyBalanceCheck } from './MoneySheetDataAccess'
import { object, date, bool, positiveTotal, protocol, invalid } from './apiValidation'
import { validDate } from '../utils/date'

export function createBalanceCheckApi(client: HttpClient) {
 const path = (selected: string) => {
  if (!validDate(selected) || selected.startsWith('0000')) return invalid()
  return '/daily-balance-checks/' + selected
 }
 const read = (raw: unknown, selected: string): DailyBalanceCheck => {
  const d = object(raw), amount = d.actualBalance === null ? null : positiveTotal(d.actualBalance)
  if (date(d.date) !== selected || amount !== null && amount > 9999999999) return protocol()
  return { date: selected, actualBalance: amount, locked: bool(d.locked) }
 }
 return {
  async getBalanceCheck(selected: string) { return read(await client.get(path(selected)), selected) },
  async saveBalanceCheck(selected: string, input: { actualBalance: number | null; locked: boolean }) {
   if (input.actualBalance !== null && (!Number.isSafeInteger(input.actualBalance) || input.actualBalance < 0 || input.actualBalance > 9999999999)) return invalid('실제 잔액은 0~9,999,999,999원으로 입력해 주세요.')
   return read(await client.put(path(selected), input), selected)
  },
 }
}
