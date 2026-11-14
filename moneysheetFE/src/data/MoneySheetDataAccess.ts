import type { BudgetItem, BudgetItemInput, Category, CategoryInput, FoodBudget, ListKind, MoneyRecord, RecordDraft, UserProfile } from './models'

// FE integration contract only. HTTP URLs, transport DTOs and authentication are not specified here.
export type BudgetItemSummary = Readonly<BudgetItem & { paid: number; remaining: number; complete: boolean; automatic: boolean }>
export type FoodSummary = Readonly<{ total: number; installments: readonly number[] }>
export type BudgetSummary = Readonly<{
  month: string; items: readonly BudgetItemSummary[]; food: Readonly<FoodBudget>;
  fixedTotal: number; foodSummary: FoodSummary;
}>
export type DailyPaymentSummary = Readonly<{ record: Readonly<MoneyRecord>; itemName: string; paid: number; remaining: number; complete: boolean }>
export type DailySummary = Readonly<{
  date: string; mainBalance: number; freeBalance: number; foodBudget: number;
  carryoverFreeBalance: number; availableBeforeSpending: number; remainingFood: number;
  expenseTotal: number; incomeTotal: number;
  transactions: readonly Readonly<MoneyRecord>[]; activeMemos: readonly Readonly<MoneyRecord>[];
  payments: readonly DailyPaymentSummary[];
  allowancePayment: Readonly<{ name: string; amount: number }> | null;
}>
export type MonthlySummary = Readonly<{
  month: string; income: number; extra: number; fixedBudget: number; foodBudget: number;
  basicTotal: number; totalExpense: number; net: number;
}>
export type RecordQuery = { kind: ListKind; memoStatus?: 'pending' | 'completed' } & ({ date: string; month?: never } | { month: string; date?: never })
export type RecordsSummary = Readonly<{ rows: readonly Readonly<MoneyRecord>[]; expenseTotal: number; incomeTotal: number; pendingMemoTotal: number; total: number }>
export type HomeDayEntry = Readonly<{ kind: 'fixed' | 'transaction' | 'free' | 'memo'; label: string } & ({ amount: number; count?: never } | { count: number; amount?: never })>
export type HomeSummary = Readonly<{
  month: string;
  source: 'records';
  days: Readonly<Record<number, Readonly<{ entries: readonly HomeDayEntry[] }>>>;
  expense: number; freeBalance: number;
}>
export type CategoryQuery = { scope?: Category['scope']; direction?: Category['direction'] }
export type RecordWrite = { kind: ListKind; managementMonth: string; input: RecordDraft }

export interface MoneySheetDataAccess {
  prepareBudget(month: string): Promise<import('./budgetApi').BudgetPreparation>
  setupBudget(month: string, input: import('./budgetApi').BudgetSetupInput): Promise<BudgetSummary>
  getBudget(month: string): Promise<BudgetSummary>
  updateFoodBudget(month: string, input: FoodBudget): Promise<BudgetSummary>
  createBudgetItem(month: string, input: BudgetItemInput): Promise<Readonly<BudgetItem>>
  updateBudgetItem(month: string, id: string, input: BudgetItemInput): Promise<Readonly<BudgetItem>>
  deleteBudgetItem(month: string, id: string): Promise<void>
  getCategories(query?: CategoryQuery): Promise<readonly Readonly<Category>[]>
  createCategory(input: CategoryInput): Promise<Readonly<Category>>
  getRecords(query: RecordQuery): Promise<RecordsSummary>
  getRecord(kind: ListKind, id: string): Promise<Readonly<MoneyRecord>>
  createRecord(request: RecordWrite): Promise<Readonly<MoneyRecord>>
  updateRecord(id: string, request: RecordWrite): Promise<Readonly<MoneyRecord>>
  deleteRecord(kind: ListKind, id: string): Promise<void>
  completeMemo(id: string, completedOn: string): Promise<Readonly<MoneyRecord>>
  cancelMemoCompletion(id: string): Promise<Readonly<MoneyRecord>>
  getDaily(date: string): Promise<DailySummary>
  getMonthly(month: string): Promise<MonthlySummary>
  getHome(month: string): Promise<HomeSummary>
  getProfile(): Promise<Readonly<UserProfile>>
}

export type DataAccessErrorCode = 'VALIDATION' | 'NOT_FOUND' | 'BUDGET_READ_ONLY' | 'REFERENCED'
export class DataAccessError extends Error {
  constructor(public readonly code: DataAccessErrorCode, message: string) {
    super(message)
    this.name = 'DataAccessError'
  }
}
