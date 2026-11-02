import type { MoneyRecord } from './models'

export const recordValue = (record: Pick<MoneyRecord, 'amount' | 'direction'>) => record.direction === 'income' ? record.amount : -record.amount
