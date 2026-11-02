import { DataAccessError, type MoneySheetDataAccess, type RecordWrite } from '../MoneySheetDataAccess'
import type { BudgetItem, BudgetItemInput, Category, MonthlyBudget, MoneyRecord } from '../models'
import { initialBudget, initialCategories, initialRecords, initialFoodBudget, demoProfile } from './fixtures'
import { allowanceId, validDate, validateRecord, daysInMonth, foodThrough } from './rules'
import { budgetSummary, dailySummary, monthlySummary, recordsSummary, homeSummary } from './queries'

const clone = <T,>(value: T): T => structuredClone(value)
const fail = (message: string): never => { throw new DataAccessError('VALIDATION', message) }
const requireMonth = (month: string) => {
  if (!/^\d{4}-\d{2}$/.test(month) || !validDate(month + '-01')) fail('올바른 관리 연월을 선택해 주세요.')
}

let fallbackSeq = 0
const defaultCreateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mock-${Date.now()}-${++fallbackSeq}-${Math.random().toString(36).slice(2, 9)}`
}

// One instance owns one prototype session. No HTTP, authentication or persistent storage.
// DataProvider selects exactly one instance; a future HTTP implementation can replace it.
export function createMockDataAccess(options: { today?: () => string; createId?: () => string } = {}): MoneySheetDataAccess {
  const today = options.today ?? (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const createId = options.createId ?? defaultCreateId
  const records = clone(initialRecords(today().slice(0, 7)))
  const categories = clone(initialCategories)
  const budgets: Record<string, MonthlyBudget> = {}
  const getBudget = (month: string): MonthlyBudget => {
    requireMonth(month)
    return budgets[month] ??= { month, fixed: initialBudget().fixed, food: clone(initialFoodBudget) }
  }
  const editableBudget = (month: string) => {
    requireMonth(month)
    if (month < today().slice(0, 7)) throw new DataAccessError('BUDGET_READ_ONLY', '지난달 예산은 수정할 수 없어요.')
    return getBudget(month)
  }
  const findRecord = (kind: RecordWrite['kind'], id: string) => {
    const record = records[kind].find(item => item.id === id)
    if (!record) throw new DataAccessError('NOT_FOUND', '기록을 찾을 수 없어요.')
    return record
  }
  const validateBudgetItem = (budget: MonthlyBudget, input: BudgetItemInput, id: string) => {
    if (!input.name.trim() || !categories.some(item => item.id === input.categoryId && item.scope === 'fixedBudget')) fail('항목명과 고정비 카테고리를 입력해 주세요.')
    if (!Number.isSafeInteger(input.amount) || input.amount < 0) fail('예산은 0 이상의 원 단위 정수로 입력해 주세요.')
    const paid = records['fixed-pay'].filter(item => item.budgetItemId === id && item.date.slice(0, 7) === budget.month).reduce((sum, item) => sum + item.amount, 0)
    if (input.amount < paid) fail('이미 지급한 금액보다 작게 예산을 설정할 수 없어요.')
    const total = budget.fixed.filter(item => item.id !== id).reduce((sum, item) => sum + item.amount, input.amount) + foodThrough(budget.month, daysInMonth(budget.month), budget.food)
    if (!Number.isSafeInteger(total)) fail('예산 합계를 정확하게 계산할 수 없어요.')
  }
  const validateWrite = (request: RecordWrite, id?: string) => {
    const { kind, managementMonth, input } = request
    requireMonth(managementMonth)
    const error = validateRecord(kind, input, managementMonth)
    if (error) fail(error)
    if (kind === 'fixed-pay') {
      const budgetItem = getBudget(managementMonth).fixed.find(item => item.id === input.budgetItemId && item.id !== allowanceId)
      if (!budgetItem) throw new DataAccessError('VALIDATION', '고정지출 예산 항목을 선택해 주세요.')
      if (id && findRecord(kind, id).date.slice(0, 7) !== managementMonth) fail('기존 지급 기록의 소속 월은 변경할 수 없어요.')
      const paid = records[kind].filter(item => item.id !== id && item.date.slice(0, 7) === managementMonth && item.budgetItemId === input.budgetItemId).reduce((sum, item) => sum + item.amount, input.amount)
      if (!Number.isSafeInteger(paid)) fail('지급액 합계를 정확하게 계산할 수 없어요.')
      if (paid > budgetItem.amount) fail('잔여 예산을 초과해 지급할 수 없어요. 예산을 먼저 수정해 주세요.')
    }
    if (kind === 'transactions' && input.categoryId && !categories.some(item => item.id === input.categoryId && item.scope === 'mainTransaction' && item.direction === input.direction)) fail('입출금 구분에 맞는 카테고리를 선택해 주세요.')
    if (kind === 'income' && input.direction !== 'income' || (kind === 'extra' || kind === 'fixed-pay') && input.direction !== 'expense') fail('기록 종류에 맞는 입출금 구분을 선택해 주세요.')
  }
  const saveMemo = (id: string, completedOn: string | null) => {
    const record = findRecord('memos', id)
    const next = { ...record, completedOn }
    const error = validateRecord('memos', next, record.date.slice(0, 7))
    if (error) fail(error)
    records.memos = records.memos.map(item => item.id === id ? next : item)
    return clone(next)
  }

  return {
    async getBudget(month) { return clone(budgetSummary(getBudget(month), records)) },
    async updateFoodBudget(month, input) {
      const budget = editableBudget(month)
      if ([input.weekday, input.saturday, input.sunday].some(value => !Number.isSafeInteger(value) || value < 0)) fail('식비는 0 이상의 원 단위 정수로 입력해 주세요.')
      const food = { weekday: input.weekday, saturday: input.saturday, sunday: input.sunday }
      const total = foodThrough(month, daysInMonth(month), food) + budget.fixed.reduce((sum, item) => sum + item.amount, 0)
      if (!Number.isSafeInteger(total)) fail('월 예산 합계를 정확하게 계산할 수 없어요.')
      budget.food = food
      return clone(budgetSummary(budget, records))
    },
    async createBudgetItem(month, input) {
      const budget = editableBudget(month)
      const id = createId()
      validateBudgetItem(budget, input, id)
      const item: BudgetItem = { ...clone(input), id, name: input.name.trim() }
      budget.fixed.push(item)
      return clone(item)
    },
    async updateBudgetItem(month, id, input) {
      const budget = editableBudget(month)
      if (!budget.fixed.some(item => item.id === id)) throw new DataAccessError('NOT_FOUND', '예산 항목을 찾을 수 없어요.')
      validateBudgetItem(budget, input, id)
      const item: BudgetItem = { ...clone(input), id, name: input.name.trim() }
      budget.fixed = budget.fixed.map(value => value.id === id ? item : value)
      return clone(item)
    },
    async deleteBudgetItem(month, id) {
      const budget = editableBudget(month)
      if (!budget.fixed.some(item => item.id === id)) throw new DataAccessError('NOT_FOUND', '예산 항목을 찾을 수 없어요.')
      if (records['fixed-pay'].some(item => item.budgetItemId === id && item.date.slice(0, 7) === month)) throw new DataAccessError('REFERENCED', '지급 기록을 먼저 삭제해 주세요.')
      budget.fixed = budget.fixed.filter(item => item.id !== id)
    },
    async getCategories(query = {}) {
      return clone(categories.filter(item => (!query.scope || item.scope === query.scope) && (!query.direction || item.direction === query.direction)))
    },
    async createCategory(input) {
      const name = input.name.trim()
      if (!name) fail('카테고리 이름을 입력해 주세요.')
      if (input.scope !== 'fixedBudget' && input.scope !== 'mainTransaction') fail('카테고리 사용 영역을 확인해 주세요.')
      if (input.scope === 'mainTransaction' && input.direction !== 'income' && input.direction !== 'expense') fail('카테고리 입출금 구분을 선택해 주세요.')
      const direction = input.scope === 'mainTransaction' ? input.direction : undefined
      const existing = categories.find(item => item.scope === input.scope && item.direction === direction && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())
      if (existing) return clone(existing)
      const category: Category = { id: createId(), name, scope: input.scope, direction }
      categories.push(category)
      return clone(category)
    },
    async getRecords(query) {
      if (query.date) { if (!validDate(query.date)) fail('날짜를 확인해 주세요.') }
      else requireMonth(query.month!)
      return clone(recordsSummary(query, records))
    },
    async getRecord(kind, id) { return clone(findRecord(kind, id)) },
    async createRecord(request) {
      validateWrite(request)
      const record: MoneyRecord = { ...clone(request.input), id: createId() }
      records[request.kind].push(record)
      return clone(record)
    },
    async updateRecord(id, request) {
      findRecord(request.kind, id)
      validateWrite(request, id)
      const record: MoneyRecord = { ...clone(request.input), id }
      records[request.kind] = records[request.kind].map(item => item.id === id ? record : item)
      return clone(record)
    },
    async deleteRecord(kind, id) {
      findRecord(kind, id)
      records[kind] = records[kind].filter(item => item.id !== id)
    },
    async completeMemo(id, completedOn) {
      if (!completedOn || !validDate(completedOn)) fail('완료일을 확인해 주세요.')
      return saveMemo(id, completedOn)
    },
    async cancelMemoCompletion(id) { return saveMemo(id, null) },
    async getDaily(date) {
      if (!validDate(date)) fail('날짜를 확인해 주세요.')
      return clone(dailySummary(date, getBudget(date.slice(0, 7)), records))
    },
    async getMonthly(month) { return clone(monthlySummary(getBudget(month), records)) },
    async getHome(month) {
      requireMonth(month)
      return clone(homeSummary(getBudget(month), records, today()))
    },
    async getProfile() { return clone(demoProfile) },
  }
}
