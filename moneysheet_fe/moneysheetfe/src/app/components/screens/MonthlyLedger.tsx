import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { useMockFinance } from "../../mock/mockFinance";

type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatRouteDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string) {
  return value.slice(2).replace(/-/g, ".");
}

function formatCurrency(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(baseDate: Date) {
  const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  const cells: CalendarCell[] = [];

  for (let i = startDay; i > 0; i -= 1) {
    const date = new Date(startOfMonth);
    date.setDate(date.getDate() - i);
    cells.push({ date, isCurrentMonth: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), day),
      isCurrentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const lastDate = new Date(cells[cells.length - 1].date);
    lastDate.setDate(lastDate.getDate() + 1);
    cells.push({ date: lastDate, isCurrentMonth: false });
  }

  return cells;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-300 bg-white">
      <div className="border-b border-gray-300 bg-[#fef7e0] px-4 py-3 text-sm font-semibold text-gray-800">
        {title}
      </div>
      <div>{children}</div>
    </section>
  );
}

function SummaryCard({
  title,
  value,
  tone = "default",
}: {
  title: string;
  value: string;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-[#fce8e6] text-[#c5221f]"
      : tone === "success"
        ? "bg-[#edf7ed] text-[#1e8e3e]"
        : "bg-gray-50 text-gray-900";

  return (
    <div className={`rounded-xl border border-gray-300 p-5 ${toneClass}`}>
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 whitespace-nowrap text-3xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

export function MonthlyLedger() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [otherExpenseForm, setOtherExpenseForm] = useState({
    date: formatRouteDate(new Date(today.getFullYear(), today.getMonth(), 1)),
    title: "",
    amount: "",
  });

  const {
    state,
    getMonthSummary,
    addExpense,
    deleteExpense,
    toggleFixedExpenseCompleted,
  } = useMockFinance();

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);
  const monthKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, "0")}`;
  const summary = getMonthSummary(monthKey);

  const moveMonth = (offset: number) => {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(nextMonth);
    setOtherExpenseForm((prev) => ({
      ...prev,
      date: formatRouteDate(nextMonth),
    }));
  };

  const goToToday = () => {
    const nextMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setCurrentMonth(nextMonth);
    setOtherExpenseForm((prev) => ({
      ...prev,
      date: formatRouteDate(nextMonth),
    }));
  };

  const handleAddOtherExpense = () => {
    if (
      !otherExpenseForm.date ||
      !otherExpenseForm.title.trim() ||
      !otherExpenseForm.amount ||
      !otherExpenseForm.date.startsWith(monthKey)
    ) {
      return;
    }

    addExpense(otherExpenseForm.date, {
      title: otherExpenseForm.title.trim(),
      amount: Number(otherExpenseForm.amount),
      category: "other",
      memo: "",
    });

    setOtherExpenseForm((prev) => ({
      ...prev,
      title: "",
      amount: "",
    }));
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">Monthly Ledger</h1>
          <div className="text-sm text-gray-600">
            월간 달력과 하단 집계표를 함께 확인합니다.
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => moveMonth(-1)}
            className="rounded border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-50"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-28 text-center text-sm font-medium text-gray-800 md:min-w-32">
            {formatMonthLabel(currentMonth)}
          </div>
          <button
            onClick={() => moveMonth(1)}
            className="rounded border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-50"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={goToToday}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-300 bg-white">
        <div className="grid grid-cols-7 border-b border-gray-300 bg-[#f8f9fa]">
          {weekdays.map((day) => (
            <div
              key={day}
              className="border-r border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-600 last:border-r-0 md:px-3 md:py-3 md:text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }) => {
            const isToday = isSameDay(date, today);
            const routeDate = formatRouteDate(date);
            const linkedLedger = state.dailyLedgers[routeDate];

            return (
              <button
                key={routeDate}
                type="button"
                onClick={() => navigate(`/ledger/${routeDate}`)}
                className={`aspect-square border-r border-b border-gray-300 p-1 text-left align-top transition-colors hover:bg-gray-50 last:border-r-0 md:p-2 ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                }`}
              >
                <div className="flex h-full flex-col justify-between">
                  <div
                    className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-medium md:h-8 md:w-8 md:text-sm ${
                      isToday
                        ? "bg-[#34a853] text-white"
                        : isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {date.getDate()}
                  </div>

                  <div className="flex justify-end">
                    {linkedLedger ? (
                      <span className="h-2 w-2 rounded-full bg-[#34a853]" aria-hidden="true" />
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1.1fr_1.4fr]">
          <Panel title="고정지출표">
            <div className="divide-y divide-gray-200">
              {summary.fixedExpenseTable.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_120px_52px] items-center text-sm"
                >
                  <div className="truncate px-4 py-2.5">{item.title}</div>
                  <div className="border-l border-gray-200 px-4 py-2.5 text-right tabular-nums">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="flex items-center justify-center border-l border-gray-200 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => toggleFixedExpenseCompleted(item.id, monthKey)}
                      className={`rounded p-1 transition-colors ${
                        item.applied
                          ? "text-[#0066cc] hover:bg-blue-50"
                          : "cursor-not-allowed text-gray-300"
                      }`}
                      aria-label={`${item.title} 지출 여부 체크`}
                      disabled={!item.applied}
                    >
                      {item.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[1fr_120px_52px] border-t border-gray-300 bg-[#edf7ed] text-sm font-semibold">
              <div className="px-4 py-3">총</div>
              <div className="border-l border-gray-200 px-4 py-3 text-right tabular-nums text-[#1e8e3e]">
                {formatCurrency(summary.fixedExpenseTotal)}
              </div>
              <div className="border-l border-gray-200 px-2 py-3" />
            </div>
          </Panel>

          <Panel title="식비">
            <div className="divide-y divide-gray-200">
              <div className="grid grid-cols-[1fr_60px_120px] text-sm">
                <div className="px-4 py-2.5">주중</div>
                <div className="border-l border-gray-200 px-3 py-2.5 text-center">
                  {summary.foodBudgetTable.weekdayCount}
                </div>
                <div className="border-l border-gray-200 px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(summary.foodBudgetTable.weekdayBudget)}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_60px_120px] text-sm">
                <div className="px-4 py-2.5">토요일</div>
                <div className="border-l border-gray-200 px-3 py-2.5 text-center">
                  {summary.foodBudgetTable.saturdayCount}
                </div>
                <div className="border-l border-gray-200 px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(summary.foodBudgetTable.saturdayBudget)}
                </div>
              </div>
              <div className="grid grid-cols-[1fr_60px_120px] text-sm">
                <div className="px-4 py-2.5">일요일</div>
                <div className="border-l border-gray-200 px-3 py-2.5 text-center">
                  {summary.foodBudgetTable.sundayCount}
                </div>
                <div className="border-l border-gray-200 px-4 py-2.5 text-right tabular-nums">
                  {formatCurrency(summary.foodBudgetTable.sundayBudget)}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_60px_120px] border-t border-gray-300 bg-[#edf7ed] text-sm font-semibold">
              <div className="px-4 py-3">총</div>
              <div className="border-l border-gray-200 px-3 py-3 text-center">
                {summary.foodBudgetTable.weekdayCount +
                  summary.foodBudgetTable.saturdayCount +
                  summary.foodBudgetTable.sundayCount}
              </div>
              <div className="border-l border-gray-200 px-4 py-3 text-right tabular-nums text-[#1e8e3e]">
                {formatCurrency(summary.foodBudgetTable.total)}
              </div>
            </div>
          </Panel>

          <Panel title="그 외 지출">
            <div className="border-b border-gray-200 bg-gray-50 p-3">
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[120px_minmax(0,1fr)_110px_96px]">
                <input
                  type="date"
                  value={otherExpenseForm.date}
                  onChange={(event) =>
                    setOtherExpenseForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                  className="rounded border border-gray-300 px-2 py-2 text-xs"
                />
                <input
                  type="text"
                  value={otherExpenseForm.title}
                  onChange={(event) =>
                    setOtherExpenseForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="항목명"
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  step={1000}
                  value={otherExpenseForm.amount}
                  onChange={(event) =>
                    setOtherExpenseForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="금액"
                  className="rounded border border-gray-300 px-3 py-2 text-sm tabular-nums"
                />
                <button
                  type="button"
                  onClick={handleAddOtherExpense}
                  className="inline-flex min-w-[96px] items-center justify-center gap-1 rounded bg-[#0066cc] px-3 py-2 text-sm text-white transition-colors hover:bg-[#0052a3]"
                >
                  <Plus size={14} />
                  <span>추가</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {summary.otherExpenseTable.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-400">데이터 없음</div>
              ) : (
                summary.otherExpenseTable.map((item, index) => {
                  const matchedLedger = state.dailyLedgers[item.date];
                  const matchedExpense = matchedLedger?.expenses.find(
                    (expense) =>
                      expense.category === "other" &&
                      expense.title === item.title &&
                      expense.amount === item.amount,
                  );

                  return (
                    <div
                      key={`${item.date}-${item.title}-${index}`}
                      className="grid grid-cols-[90px_1fr_110px_48px] text-sm"
                    >
                      <div className="px-4 py-2.5 whitespace-nowrap">
                        {formatShortDate(item.date)}
                      </div>
                      <div className="truncate border-l border-gray-200 px-4 py-2.5">
                        {item.title}
                      </div>
                      <div className="border-l border-gray-200 px-4 py-2.5 text-right tabular-nums">
                        {formatCurrency(item.amount)}
                      </div>
                      <div className="flex items-center justify-center border-l border-gray-200 px-2 py-2">
                        {matchedExpense ? (
                          <button
                            type="button"
                            onClick={() => deleteExpense(item.date, matchedExpense.id)}
                            className="rounded p-1 text-red-600 transition-colors hover:bg-red-50"
                            aria-label="그 외 지출 삭제"
                          >
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-[90px_1fr_110px_48px] border-t border-gray-300 bg-[#edf7ed] text-sm font-semibold">
              <div className="px-4 py-3">총</div>
              <div className="border-l border-gray-200 px-4 py-3" />
              <div className="border-l border-gray-200 px-4 py-3 text-right tabular-nums text-[#1e8e3e]">
                {formatCurrency(summary.otherExpenseTotal)}
              </div>
              <div className="border-l border-gray-200 px-2 py-3" />
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.2fr_0.9fr]">
          <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
            <SummaryCard title="기본지출" value={formatCurrency(summary.baseSpendingTotal)} tone="danger" />
            <SummaryCard title="그 외 지출" value={formatCurrency(summary.otherExpenseTotal)} tone="danger" />
            <SummaryCard title="총 지출" value={formatCurrency(summary.totalExpense)} tone="danger" />
          </section>

          <Panel title="금월 수익 내역">
            <div className="divide-y divide-gray-200">
              {summary.incomeRecords.map((item) => (
                <div key={item.id} className="grid grid-cols-[90px_1fr_130px] text-sm">
                  <div className="px-4 py-2.5 whitespace-nowrap">{formatShortDate(item.date)}</div>
                  <div className="truncate border-l border-gray-200 px-4 py-2.5">{item.label}</div>
                  <div className="border-l border-gray-200 px-4 py-2.5 text-right tabular-nums">
                    {formatCurrency(item.amount)}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[90px_1fr_130px] border-t border-gray-300 bg-[#edf7ed] text-sm font-semibold">
              <div className="px-4 py-3">총</div>
              <div className="border-l border-gray-200 px-4 py-3" />
              <div className="border-l border-gray-200 px-4 py-3 text-right tabular-nums text-[#1e8e3e]">
                {formatCurrency(summary.incomeTotal)}
              </div>
            </div>
          </Panel>

          <SummaryCard
            title="실제 저금 금액"
            value={formatCurrency(summary.actualSavingAmount)}
            tone="success"
          />
        </div>
      </div>
    </div>
  );
}
