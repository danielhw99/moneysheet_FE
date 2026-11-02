export type Direction = 'expense' | 'income'
export type ListKind = 'transactions' | 'memos' | 'fixed-pay' | 'income' | 'extra'
export type Category = { id: string; name: string; scope: 'fixedBudget' | 'mainTransaction'; direction?: Direction }
export type MoneyRecord = {
  id: string; date: string; time: string; title: string; amount: number; direction: Direction;
  categoryId: string | null; budgetItemId?: string; completedOn: string | null;
}
export type RecordDraft = Omit<MoneyRecord, 'id'>
export type RecordStore = Record<ListKind, MoneyRecord[]>

export type FixedBudgetItem = { id: string; name: string; categoryId: string; amount: number; paid: number }
export type MonthBudget = { locked: boolean; fixed: FixedBudgetItem[] }

// Source entities exclude editable UI locks and calculated payment totals.
export type BudgetItem = Omit<FixedBudgetItem, 'paid'>
export type FoodBudget = { weekday: number; saturday: number; sunday: number }
export type MonthlyBudget = { month: string; fixed: BudgetItem[]; food: FoodBudget }
export type BudgetItemInput = Omit<BudgetItem, 'id'>
export type CategoryInput = Pick<Category, 'name' | 'scope' | 'direction'>
export type UserProfile = { id: string; email: string; nickname: string }
