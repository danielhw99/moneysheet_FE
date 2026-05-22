export type ExpenseCategory = "food" | "other";

export type ExpenseItem = {
  id: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  memo: string;
};

export type SpecialNote = {
  id: string;
  memo: string;
  amount: number;
  completed: boolean;
};

export type DailyLedgerRecord = {
  date: string;
  accountStatus: number | null;
  calculatedAmount: number;
  marginAmount: number;
  fixedExpenseUsed: number;
  specialNotes: SpecialNote[];
  expenses: ExpenseItem[];
};

export type IncomeRecord = {
  id: string;
  date: string;
  label: string;
  amount: number;
};

export type FixedExpenseRule = {
  id: string;
  title: string;
  amount: number;
  appliedMonths: string[];
  completedMonths: string[];
};

export type FoodBudgetConfig = {
  weekday: number;
  saturday: number;
  sunday: number;
};

export type MockFinanceState = {
  incomeRecords: IncomeRecord[];
  foodBudget: FoodBudgetConfig;
  fixedExpenses: FixedExpenseRule[];
  customCategories: string[];
  dailyLedgers: Record<string, DailyLedgerRecord>;
};
