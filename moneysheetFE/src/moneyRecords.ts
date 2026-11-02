// Compatibility exports for the synchronous screens; removed from screen imports in phase 2.
export type { Direction, ListKind, Category, MoneyRecord, RecordDraft, RecordStore } from './data/models'
export { initialCategories, initialRecords } from './data/mock/fixtures'
export { recordValue, validDate, memoActive, validateRecord, foodForDate, foodThrough, daysInMonth } from './data/mock/rules'
