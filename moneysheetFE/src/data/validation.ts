import type { ListKind, RecordDraft } from './models'
import { validDate } from '../utils/date'

export const validateRecord = (kind: ListKind, record: RecordDraft, managementMonth: string) => {
  if (!validDate(record.date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time)) return '날짜와 시간을 올바르게 입력해 주세요.'
  if (!record.title.trim() || !Number.isSafeInteger(record.amount) || record.amount < 0) return '내용과 정확하게 계산할 수 있는 원 단위 금액을 입력해 주세요.'
  if (kind === 'fixed-pay' && record.date.slice(0, 7) !== managementMonth) return '지급일은 선택한 예산과 같은 월이어야 해요.'
  if (kind === 'memos' && record.completedOn) {
    if (!validDate(record.completedOn) || record.completedOn < record.date) return '완료일은 메모 발생일보다 앞설 수 없어요.'
    if (record.completedOn.slice(0, 7) !== record.date.slice(0, 7)) return '메모는 발생한 월 안에서 완료해 주세요.'
  }
  return ''
}
