import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";
import { createEmptyMockFinanceState, initialMockFinanceState } from "./seed";
import {
  DailyLedgerRecord,
  ExpenseItem,
  FixedExpenseRule,
  FoodBudgetConfig,
  IncomeRecord,
  MockFinanceState,
  SpecialNote,
} from "./types";

type ExpenseFormInput = {
  title: string;
  amount: number;
  category: "food" | "other";
  memo: string;
};

type FixedExpenseFormInput = {
  title: string;
  amount: number;
};

type MockFinanceContextValue = {
  state: MockFinanceState;
  isMockDataEnabled: boolean;
  toggleMockDataEnabled: () => void;
  resetMockData: () => void;
  getDailyLedger: (date: string) => DailyLedgerRecord;
  updateAccountStatus: (date: string, amount: number | null) => void;
  updateFixedExpenseUsed: (date: string, amount: number) => void;
  updateIncomeRecords: (records: IncomeRecord[]) => void;
  updateFoodBudget: (budget: FoodBudgetConfig) => void;
  addCategory: (label: string) => void;
  addFixedExpense: (item: FixedExpenseFormInput) => void;
  removeFixedExpense: (id: string) => void;
  toggleFixedExpenseApplied: (id: string, monthKey: string) => void;
  toggleFixedExpenseCompleted: (id: string, monthKey: string) => void;
  addExpense: (date: string, expense: ExpenseFormInput) => void;
  updateExpense: (date: string, expenseId: string, expense: ExpenseFormInput) => void;
  deleteExpense: (date: string, expenseId: string) => void;
  addSpecialNote: (date: string) => void;
  updateSpecialNote: (date: string, noteId: string, patch: Partial<SpecialNote>) => void;
  getMonthSummary: (monthKey: string) => {
    fixedExpenseTable: Array<FixedExpenseRule & { applied: boolean; completed: boolean }>;
    fixedExpenseTotal: number;
    fixedExpenseUsedTotal: number;
    fixedExpenseRemainingTotal: number;
    foodBudgetTable: {
      weekdayCount: number;
      saturdayCount: number;
      sundayCount: number;
      weekdayBudget: number;
      saturdayBudget: number;
      sundayBudget: number;
      total: number;
    };
    otherExpenseTable: Array<{ date: string; title: string; amount: number }>;
    otherExpenseTotal: number;
    baseSpendingTotal: number;
    totalExpense: number;
    incomeRecords: IncomeRecord[];
    incomeTotal: number;
    actualSavingAmount: number;
  };
};

const MockFinanceContext = createContext<MockFinanceContextValue | null>(null);

const MOCK_DATA_STORAGE_KEY = "moneysheet-mock-data-enabled";

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function createEmptyDailyLedger(date: string): DailyLedgerRecord {
  return {
    date,
    accountStatus: null,
    calculatedAmount: 0,
    marginAmount: 0,
    fixedExpenseUsed: 0,
    specialNotes: [],
    expenses: [],
  };
}

function getFoodBudgetForDate(date: string, budget: FoodBudgetConfig) {
  const day = new Date(date).getDay();
  if (day === 0) return budget.sunday;
  if (day === 6) return budget.saturday;
  return budget.weekday;
}

function getPreviousDateString(date: string) {
  const parsed = new Date(date);
  parsed.setDate(parsed.getDate() - 1);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`;
}

function getMonthDayCounts(monthKey: string) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText) - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let weekdayCount = 0;
  let saturdayCount = 0;
  let sundayCount = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const currentDay = new Date(year, month, day).getDay();
    if (currentDay === 0) {
      sundayCount += 1;
    } else if (currentDay === 6) {
      saturdayCount += 1;
    } else {
      weekdayCount += 1;
    }
  }

  return { weekdayCount, saturdayCount, sundayCount };
}

function getDailyLedgerFromState(state: MockFinanceState, date: string) {
  return state.dailyLedgers[date] ?? createEmptyDailyLedger(date);
}

function getComputedDailyLedgerFromState(
  state: MockFinanceState,
  date: string,
  cache = new Map<string, DailyLedgerRecord>(),
) {
  if (cache.has(date)) {
    return cache.get(date)!;
  }

  const rawLedger = getDailyLedgerFromState(state, date);
  const hasStoredLedger = Boolean(state.dailyLedgers[date]);

  if (!hasStoredLedger) {
    cache.set(date, rawLedger);
    return rawLedger;
  }

  const previousDate = getPreviousDateString(date);
  const hasPreviousLedger = Boolean(state.dailyLedgers[previousDate]);
  const previousLedger = hasPreviousLedger
    ? getComputedDailyLedgerFromState(state, previousDate, cache)
    : null;

  const totalUsageAmount = rawLedger.expenses.reduce((sum, item) => sum + item.amount, 0);
  const allocatedFoodBudget = getFoodBudgetForDate(date, state.foodBudget);
  const specialNoteTotal = rawLedger.specialNotes.reduce((sum, item) => sum + item.amount, 0);

  const marginAmount = previousLedger
    ? previousLedger.marginAmount - totalUsageAmount + allocatedFoodBudget
    : rawLedger.marginAmount;

  const calculatedAmount = marginAmount + specialNoteTotal;

  const computedLedger = {
    ...rawLedger,
    marginAmount,
    calculatedAmount,
  };

  cache.set(date, computedLedger);
  return computedLedger;
}

export function MockFinanceProvider({ children }: { children: ReactNode }) {
  const [mockState, setMockState] = useState<MockFinanceState>(initialMockFinanceState);
  const [blankState, setBlankState] = useState<MockFinanceState>(createEmptyMockFinanceState);
  const [isMockDataEnabled, setIsMockDataEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = window.localStorage.getItem(MOCK_DATA_STORAGE_KEY);
    return stored === null ? true : stored === "true";
  });

  const state = isMockDataEnabled ? mockState : blankState;

  const updateCurrentState = (
    updater: (prev: MockFinanceState) => MockFinanceState,
  ) => {
    if (isMockDataEnabled) {
      setMockState((prev) => updater(prev));
      return;
    }
    setBlankState((prev) => updater(prev));
  };

  const toggleMockDataEnabled = () => {
    setIsMockDataEnabled((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        window.localStorage.setItem(MOCK_DATA_STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const resetMockData = () => {
    if (isMockDataEnabled) {
      setMockState(initialMockFinanceState);
      return;
    }
    setBlankState(createEmptyMockFinanceState());
  };

  const getDailyLedger = (date: string) => {
    return getComputedDailyLedgerFromState(state, date);
  };

  const updateAccountStatus = (date: string, amount: number | null) => {
    updateCurrentState((prev) => ({
      ...prev,
      dailyLedgers: {
        ...prev.dailyLedgers,
        [date]: {
          ...getDailyLedgerFromState(prev, date),
          accountStatus: amount,
        },
      },
    }));
  };

  const updateFixedExpenseUsed = (date: string, amount: number) => {
    updateCurrentState((prev) => ({
      ...prev,
      dailyLedgers: {
        ...prev.dailyLedgers,
        [date]: {
          ...getDailyLedgerFromState(prev, date),
          fixedExpenseUsed: amount,
        },
      },
    }));
  };

  const updateIncomeRecords = (records: IncomeRecord[]) => {
    updateCurrentState((prev) => ({ ...prev, incomeRecords: records }));
  };

  const updateFoodBudget = (budget: FoodBudgetConfig) => {
    updateCurrentState((prev) => ({ ...prev, foodBudget: budget }));
  };

  const addCategory = (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    updateCurrentState((prev) => {
      if (prev.customCategories.includes(trimmed)) {
        return prev;
      }
      return { ...prev, customCategories: [...prev.customCategories, trimmed] };
    });
  };

  const addFixedExpense = (item: FixedExpenseFormInput) => {
    const currentMonthKey = getCurrentMonthKey();
    updateCurrentState((prev) => ({
      ...prev,
      fixedExpenses: [
        ...prev.fixedExpenses,
        {
          id: `fixed-${Date.now()}`,
          title: item.title,
          amount: item.amount,
          appliedMonths: [currentMonthKey],
          completedMonths: [],
        },
      ],
    }));
  };

  const removeFixedExpense = (id: string) => {
    updateCurrentState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.filter((item) => item.id !== id),
    }));
  };

  const toggleFixedExpenseApplied = (id: string, monthKey: string) => {
    updateCurrentState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((item) => {
        if (item.id !== id) return item;
        const applied = item.appliedMonths.includes(monthKey);
        return {
          ...item,
          appliedMonths: applied
            ? item.appliedMonths.filter((month) => month !== monthKey)
            : [...item.appliedMonths, monthKey],
          completedMonths: applied
            ? item.completedMonths.filter((month) => month !== monthKey)
            : item.completedMonths,
        };
      }),
    }));
  };

  const toggleFixedExpenseCompleted = (id: string, monthKey: string) => {
    updateCurrentState((prev) => ({
      ...prev,
      fixedExpenses: prev.fixedExpenses.map((item) => {
        if (item.id !== id) return item;
        if (!item.appliedMonths.includes(monthKey)) return item;
        const completed = item.completedMonths.includes(monthKey);
        return {
          ...item,
          completedMonths: completed
            ? item.completedMonths.filter((month) => month !== monthKey)
            : [...item.completedMonths, monthKey],
        };
      }),
    }));
  };

  const addExpense = (date: string, expense: ExpenseFormInput) => {
    updateCurrentState((prev) => {
      const ledger = getDailyLedgerFromState(prev, date);
      const newExpense: ExpenseItem = {
        id: `expense-${Date.now()}`,
        title: expense.title,
        amount: expense.amount,
        category: expense.category,
        memo: expense.memo,
      };
      return {
        ...prev,
        dailyLedgers: {
          ...prev.dailyLedgers,
          [date]: {
            ...ledger,
            expenses: [...ledger.expenses, newExpense],
          },
        },
      };
    });
  };

  const updateExpense = (date: string, expenseId: string, expense: ExpenseFormInput) => {
    updateCurrentState((prev) => {
      const ledger = getDailyLedgerFromState(prev, date);
      return {
        ...prev,
        dailyLedgers: {
          ...prev.dailyLedgers,
          [date]: {
            ...ledger,
            expenses: ledger.expenses.map((item) =>
              item.id === expenseId
                ? {
                    ...item,
                    title: expense.title,
                    amount: expense.amount,
                    category: expense.category,
                    memo: expense.memo,
                  }
                : item,
            ),
          },
        },
      };
    });
  };

  const deleteExpense = (date: string, expenseId: string) => {
    updateCurrentState((prev) => {
      const ledger = getDailyLedgerFromState(prev, date);
      return {
        ...prev,
        dailyLedgers: {
          ...prev.dailyLedgers,
          [date]: {
            ...ledger,
            expenses: ledger.expenses.filter((item) => item.id !== expenseId),
          },
        },
      };
    });
  };

  const addSpecialNote = (date: string) => {
    updateCurrentState((prev) => {
      const ledger = getDailyLedgerFromState(prev, date);
      return {
        ...prev,
        dailyLedgers: {
          ...prev.dailyLedgers,
          [date]: {
            ...ledger,
            specialNotes: [
              ...ledger.specialNotes,
              {
                id: `note-${Date.now()}`,
                memo: "",
                amount: 0,
                completed: false,
              },
            ],
          },
        },
      };
    });
  };

  const updateSpecialNote = (
    date: string,
    noteId: string,
    patch: Partial<SpecialNote>,
  ) => {
    updateCurrentState((prev) => {
      const ledger = getDailyLedgerFromState(prev, date);
      return {
        ...prev,
        dailyLedgers: {
          ...prev.dailyLedgers,
          [date]: {
            ...ledger,
            specialNotes: ledger.specialNotes.map((note) =>
              note.id === noteId ? { ...note, ...patch } : note,
            ),
          },
        },
      };
    });
  };

  const getMonthSummary = (monthKey: string) => {
    const currentMonthLedgers = Object.values(state.dailyLedgers).filter((ledger) =>
      ledger.date.startsWith(monthKey),
    );
    const currentMonthIncomeRecords = state.incomeRecords.filter((item) =>
      item.date.startsWith(monthKey),
    );
    const monthFixedExpenses = state.fixedExpenses
      .filter((item) => item.appliedMonths.includes(monthKey))
      .map((item) => ({
        ...item,
        applied: true,
        completed: item.completedMonths.includes(monthKey),
      }));
    const monthCounts = getMonthDayCounts(monthKey);

    const foodExpenseTotal = currentMonthLedgers.reduce(
      (sum, ledger) =>
        sum +
        ledger.expenses
          .filter((expense) => expense.category === "food")
          .reduce((dailySum, expense) => dailySum + expense.amount, 0),
      0,
    );

    const otherExpenseRows = currentMonthLedgers.flatMap((ledger) =>
      ledger.expenses
        .filter((expense) => expense.category === "other")
        .map((expense) => ({
          date: ledger.date,
          title: expense.title,
          amount: expense.amount,
        })),
    );

    const otherExpenseTotal = otherExpenseRows.reduce((sum, item) => sum + item.amount, 0);
    const fixedExpenseTotal = monthFixedExpenses.reduce((sum, item) => sum + item.amount, 0);
    const fixedExpenseUsedTotal = currentMonthLedgers.reduce(
      (sum, ledger) => sum + ledger.fixedExpenseUsed,
      0,
    );
    const incomeTotal = currentMonthIncomeRecords.reduce((sum, item) => sum + item.amount, 0);
    const foodBudgetTotal =
      monthCounts.weekdayCount * state.foodBudget.weekday +
      monthCounts.saturdayCount * state.foodBudget.saturday +
      monthCounts.sundayCount * state.foodBudget.sunday;
    const baseSpendingTotal = fixedExpenseTotal + foodBudgetTotal;
    const totalExpense = fixedExpenseUsedTotal + foodExpenseTotal + otherExpenseTotal;

    return {
      fixedExpenseTable: monthFixedExpenses,
      fixedExpenseTotal,
      fixedExpenseUsedTotal,
      fixedExpenseRemainingTotal: fixedExpenseTotal - fixedExpenseUsedTotal,
      foodBudgetTable: {
        ...monthCounts,
        weekdayBudget: state.foodBudget.weekday,
        saturdayBudget: state.foodBudget.saturday,
        sundayBudget: state.foodBudget.sunday,
        total: foodBudgetTotal,
      },
      otherExpenseTable: otherExpenseRows,
      otherExpenseTotal,
      baseSpendingTotal,
      totalExpense,
      incomeRecords: currentMonthIncomeRecords,
      incomeTotal,
      actualSavingAmount: incomeTotal - totalExpense,
    };
  };

  const value = useMemo<MockFinanceContextValue>(
    () => ({
      state,
      isMockDataEnabled,
      toggleMockDataEnabled,
      resetMockData,
      getDailyLedger,
      updateAccountStatus,
      updateFixedExpenseUsed,
      updateIncomeRecords,
      updateFoodBudget,
      addCategory,
      addFixedExpense,
      removeFixedExpense,
      toggleFixedExpenseApplied,
      toggleFixedExpenseCompleted,
      addExpense,
      updateExpense,
      deleteExpense,
      addSpecialNote,
      updateSpecialNote,
      getMonthSummary,
    }),
    [state, isMockDataEnabled],
  );

  return <MockFinanceContext.Provider value={value}>{children}</MockFinanceContext.Provider>;
}

export function useMockFinance() {
  const context = useContext(MockFinanceContext);

  if (!context) {
    throw new Error("useMockFinance must be used within MockFinanceProvider");
  }

  return context;
}
