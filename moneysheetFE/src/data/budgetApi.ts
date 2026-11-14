import { ApiError, httpClient, type HttpClient } from '../api/httpClient'
import type { BudgetItem, BudgetItemInput, BudgetKind, Category, CategoryInput, FoodBudget } from './models'
import type { BudgetSummary, CategoryQuery } from './MoneySheetDataAccess'

export type DraftItem = { id: string | null; kind: BudgetKind; name: string; categoryId: string | null; amount: number | null }
export type BudgetPreparation = { month: string; status: 'draft' | 'ready'; copiedFromMonth: string | null; items: DraftItem[]; food: { [K in keyof FoodBudget]: number | null } }
export type BudgetSetupInput = { items: DraftItem[]; food: FoodBudget }
const protocol = () => new ApiError(0, 'PROTOCOL', '서버 예산 응답을 확인하지 못했어요.')
const object = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) throw protocol(); return v as Record<string, unknown> }
const id = (v: unknown): string => { if (typeof v !== 'string' || !/^[1-9][0-9]{0,18}$/.test(v) || BigInt(v) > 9223372036854775807n) throw protocol(); return v }
const money = (v: unknown): number => { if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 1 || v > 9999999999) throw protocol(); return v }
const total = (v: unknown): number => { if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0) throw protocol(); return v }
const kind = (v: unknown): BudgetKind => { if (v !== 'fixedExpense' && v !== 'freeAllowance') throw protocol(); return v }
const name = (v: unknown): string => { if (typeof v !== 'string' || !v.trim() || [...v].length > 100) throw protocol(); return v }
const month = (v: string) => { if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) throw new ApiError(400, 'VALIDATION', '조회할 월을 확인해 주세요.'); return v }
function food(v: unknown): FoodBudget { const d = object(v); return { weekday: money(d.weekday), saturday: money(d.saturday), sunday: money(d.sunday) } }
function item(v: unknown): BudgetItem { const d = object(v); return { id: id(d.id), kind: kind(d.kind), name: name(d.name), categoryId: id(d.categoryId), amount: money(d.amount) } }
function summary(v: unknown, expectedMonth: string): BudgetSummary {
  const d = object(v); const f = object(d.foodSummary)
  if (d.month !== expectedMonth || d.status !== 'ready' || !Array.isArray(d.items) || !Array.isArray(f.installments) || f.installments.length !== 3) throw protocol()
  return { month: expectedMonth, food: food(d.food), fixedTotal: total(d.fixedTotal), foodSummary: { total: total(f.total), installments: f.installments.map(total) }, items: d.items.map(value => {
    const row = object(value)
    if (typeof row.complete !== 'boolean' || typeof row.automatic !== 'boolean') throw protocol()
    return { ...item(row), paid: total(row.paid), remaining: total(row.remaining), complete: row.complete, automatic: row.automatic }
  }) }
}
function category(v: unknown): Category {
  const d = object(v)
  if (d.scope !== 'fixedBudget' && d.scope !== 'mainTransaction') throw protocol()
  if ((d.scope === 'fixedBudget' && d.direction !== null) || (d.scope === 'mainTransaction' && d.direction !== 'income' && d.direction !== 'expense')) throw protocol()
  return { id: id(d.id), name: name(d.name), scope: d.scope, ...(d.direction === null ? {} : { direction: d.direction as 'income' | 'expense' }) }
}
export function createBudgetApi(client: HttpClient = httpClient) {
  const base = (m: string) => `/months/${month(m)}`
  const input = (value: BudgetItemInput) => ({ ...value, kind: value.kind ?? 'fixedExpense' })
  return {
    async prepareBudget(m: string): Promise<BudgetPreparation> {
      const d = object(await client.post(`${base(m)}/budget-preparation`))
      if (d.month !== m || (d.status !== 'draft' && d.status !== 'ready') || !Array.isArray(d.items) || (d.copiedFromMonth !== null && (typeof d.copiedFromMonth !== 'string' || month(d.copiedFromMonth) !== d.copiedFromMonth))) throw protocol()
      const f = object(d.food)
      return { month: m, status: d.status, copiedFromMonth: d.copiedFromMonth as string | null,
        items: d.items.map(value => { const row = object(value); return { id: row.id === null ? null : id(row.id), kind: kind(row.kind), name: name(row.name), categoryId: row.categoryId === null ? null : id(row.categoryId), amount: row.amount === null ? null : money(row.amount) } }),
        food: { weekday: f.weekday === null ? null : money(f.weekday), saturday: f.saturday === null ? null : money(f.saturday), sunday: f.sunday === null ? null : money(f.sunday) } }
    },
    async setupBudget(m: string, value: BudgetSetupInput) { return summary(await client.put(`${base(m)}/budget-setup`, value), m) },
    async getBudget(m: string) { return summary(await client.get(`${base(m)}/budget`), m) },
    async updateFoodBudget(m: string, value: FoodBudget) { return summary(await client.put(`${base(m)}/food-budget`, value), m) },
    async createBudgetItem(m: string, value: BudgetItemInput) { return item(await client.post(`${base(m)}/budget-items`, input(value))) },
    async updateBudgetItem(m: string, key: string, value: BudgetItemInput) { return item(await client.put(`${base(m)}/budget-items/${id(key)}`, input(value))) },
    async deleteBudgetItem(m: string, key: string) { await client.delete(`${base(m)}/budget-items/${id(key)}`) },
    async getCategories(query: CategoryQuery = {}) {
      const params = new URLSearchParams()
      if (query.scope) params.set('scope', query.scope)
      if (query.direction) params.set('direction', query.direction)
      const d = object(await client.get(`/categories${params.size ? '?' + params.toString() : ''}`))
      if (!Array.isArray(d.items)) throw protocol()
      return d.items.map(category)
    },
    async createCategory(value: CategoryInput) { return category(await client.post('/categories', { ...value, direction: value.direction ?? null })) },
  }
}
