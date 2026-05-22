import { MockFinanceState } from "./types";

export function createEmptyMockFinanceState(): MockFinanceState {
  return {
    incomeRecords: [],
    foodBudget: {
      weekday: 0,
      saturday: 0,
      sunday: 0,
    },
    fixedExpenses: [],
    customCategories: [],
    dailyLedgers: {},
  };
}

export const initialMockFinanceState: MockFinanceState = {
  incomeRecords: [
    { id: "income-1", date: "2026-05-01", label: "용돈", amount: 570000 },
    { id: "income-2", date: "2026-05-18", label: "국취제", amount: 600000 },
  ],
  foodBudget: {
    weekday: 15000,
    saturday: 5000,
    sunday: 15000,
  },
  fixedExpenses: [
    {
      id: "fixed-1",
      title: "관리비",
      amount: 100000,
      appliedMonths: ["2026-04", "2026-05"],
      completedMonths: ["2026-04"],
    },
    {
      id: "fixed-2",
      title: "교통",
      amount: 150000,
      appliedMonths: ["2026-04", "2026-05"],
      completedMonths: ["2026-04", "2026-05"],
    },
    {
      id: "fixed-3",
      title: "건강",
      amount: 21940,
      appliedMonths: ["2026-04", "2026-05"],
      completedMonths: ["2026-04"],
    },
    {
      id: "fixed-4",
      title: "통신",
      amount: 19000,
      appliedMonths: ["2026-05"],
      completedMonths: [],
    },
  ],
  customCategories: ["식비", "교통", "생활", "기타"],
  dailyLedgers: {
    "2026-05-01": {
      date: "2026-05-01",
      accountStatus: 132000,
      calculatedAmount: 0,
      marginAmount: 2900,
      fixedExpenseUsed: 150000,
      specialNotes: [
        { id: "note-1", memo: "정산 대기", amount: 12000, completed: false },
      ],
      expenses: [
        { id: "expense-1", title: "편도", amount: 5600, category: "other", memo: "" },
        { id: "expense-2", title: "지난주점심", amount: 6500, category: "food", memo: "" },
      ],
    },
    "2026-05-02": {
      date: "2026-05-02",
      accountStatus: 148000,
      calculatedAmount: 0,
      marginAmount: 1000,
      fixedExpenseUsed: 0,
      specialNotes: [],
      expenses: [
        { id: "expense-3", title: "카페", amount: 4500, category: "food", memo: "" },
      ],
    },
    "2026-05-10": {
      date: "2026-05-10",
      accountStatus: null,
      calculatedAmount: 0,
      marginAmount: 3000,
      fixedExpenseUsed: 21940,
      specialNotes: [
        { id: "note-2", memo: "주말 정산 예정", amount: 8000, completed: true },
      ],
      expenses: [],
    },
  },
};
