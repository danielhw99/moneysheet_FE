import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  CheckSquare,
  ChevronLeft,
  Pencil,
  Plus,
  Square,
  Trash2,
} from "lucide-react";
import { useMockFinance } from "../../mock/mockFinance";

function formatDateLabel(dateParam?: string) {
  if (!dateParam) return "날짜";

  const parsed = new Date(dateParam);
  if (Number.isNaN(parsed.getTime())) return dateParam;

  return parsed
    .toLocaleDateString("ko-KR", {
      year: "2-digit",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    })
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
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

function formatCurrency(value: number | null) {
  if (value === null) return "";
  return `₩${value.toLocaleString("ko-KR")}`;
}

function getFoodBudgetForDate(
  date: string,
  weekday: number,
  saturday: number,
  sunday: number,
) {
  const day = new Date(date).getDay();
  if (day === 0) return sunday;
  if (day === 6) return saturday;
  return weekday;
}

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

export function DailySheet() {
  const navigate = useNavigate();
  const { date = "" } = useParams();
  const {
    state,
    getDailyLedger,
    updateAccountStatus,
    updateFixedExpenseUsed,
    addSpecialNote,
    updateSpecialNote,
    addExpense,
    deleteExpense,
    getMonthSummary,
    toggleFixedExpenseCompleted,
  } = useMockFinance();

  const ledger = getDailyLedger(date);
  const monthKey = date.slice(0, 7);
  const summary = getMonthSummary(monthKey);
  const totalUsageAmount = ledger.expenses.reduce((sum, item) => sum + item.amount, 0);
  const todayFoodBudget = getFoodBudgetForDate(
    date,
    state.foodBudget.weekday,
    state.foodBudget.saturday,
    state.foodBudget.sunday,
  );
  const [otherExpenseForm, setOtherExpenseForm] = useState({
    date,
    title: "",
    amount: "",
  });

  const moveDay = (offset: number) => {
    if (!date) return;
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + offset);
    navigate(`/ledger/${formatRouteDate(nextDate)}`);
  };

  const fixedExpenseStatus = useMemo(() => {
    const monthFixedTotal = state.fixedExpenses
      .filter((item) => item.appliedMonths.includes(monthKey))
      .reduce((sum, item) => sum + item.amount, 0);

    const used = Object.values(state.dailyLedgers)
      .filter((item) => item.date.startsWith(monthKey) && item.date <= date)
      .reduce((sum, item) => sum + item.fixedExpenseUsed, 0);

    return {
      used,
      remaining: monthFixedTotal - used,
    };
  }, [date, monthKey, state.dailyLedgers, state.fixedExpenses]);

  const handleAddOtherExpense = () => {
    if (!otherExpenseForm.date || !otherExpenseForm.title.trim() || !otherExpenseForm.amount) {
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
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/ledger")}
          className="rounded p-2 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold md:text-3xl">{formatDateLabel(date)}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveDay(-1)}
              className="rounded border border-[#c7cdd4] bg-[#f8f9fa] px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[#eef2f6]"
            >
              전날
            </button>
            <button
              type="button"
              onClick={() => moveDay(1)}
              className="rounded border border-[#c7cdd4] bg-[#f8f9fa] px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-[#eef2f6]"
            >
              다음날
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-400 bg-white">
        <div className="grid grid-cols-1 border-b border-gray-400 md:grid-cols-3">
          <div className="border-b border-gray-400 md:border-b-0 md:border-r">
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              계좌상태
            </div>
            <div className="min-h-[48px] p-3">
              <input
                type="number"
                step={1000}
                value={ledger.accountStatus ?? ""}
                onChange={(event) =>
                  updateAccountStatus(
                    date,
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                className="w-full rounded border border-[#a8c7fa] bg-[#eef4ff] px-2 py-2 text-sm font-medium outline-none ring-0 tabular-nums placeholder:text-[#7b88a1] focus:border-[#1a73e8] focus:bg-white"
              />
            </div>
          </div>

          <div className="border-b border-gray-400 md:border-b-0 md:border-r">
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              계산된 금액
            </div>
            <div className="min-h-[48px] p-3 text-sm tabular-nums text-gray-800">
              {formatCurrency(ledger.calculatedAmount)}
            </div>
          </div>

          <div>
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              여유금액
            </div>
            <div className="min-h-[48px] p-3 text-sm tabular-nums text-gray-800">
              {formatCurrency(ledger.marginAmount)}
            </div>
          </div>
        </div>

        <div className="border-b-2 border-gray-500">
          <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
            특이사항
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-[1fr_120px_52px] bg-gray-50 text-xs font-medium text-gray-600">
                <div className="border-r border-gray-300 p-2">내용</div>
                <div className="border-r border-gray-300 p-2 text-right">금액</div>
                <div className="p-2 text-center">완료</div>
              </div>

              <div className="divide-y divide-gray-300">
                {ledger.specialNotes.length === 0 ? (
                  <div className="grid grid-cols-[1fr_120px_52px]">
                    <div className="border-r border-gray-300 p-2 text-sm text-gray-400">
                      데이터 없음
                    </div>
                    <div className="border-r border-gray-300 p-2 text-right text-sm text-gray-400">
                      -
                    </div>
                    <div className="p-2" />
                  </div>
                ) : (
                  ledger.specialNotes.map((note) => (
                    <div key={note.id} className="grid grid-cols-[1fr_120px_52px]">
                      <div className="border-r border-gray-300 p-2">
                        <input
                          type="text"
                          value={note.memo}
                          onChange={(event) =>
                            updateSpecialNote(date, note.id, { memo: event.target.value })
                          }
                          className={`w-full rounded border border-[#a8c7fa] bg-[#eef4ff] px-2 py-2 text-sm outline-none ${
                            note.completed ? "text-gray-400 line-through" : ""
                          } focus:border-[#1a73e8] focus:bg-white`}
                        />
                      </div>

                      <div className="border-r border-gray-300 p-2">
                        <input
                          type="number"
                          step={1000}
                          value={note.amount || ""}
                          onChange={(event) =>
                            updateSpecialNote(date, note.id, {
                              amount: event.target.value ? Number(event.target.value) : 0,
                            })
                          }
                          className={`w-full rounded border border-[#a8c7fa] bg-[#eef4ff] px-2 py-2 text-right text-sm outline-none tabular-nums ${
                            note.completed ? "text-gray-400 line-through" : ""
                          } focus:border-[#1a73e8] focus:bg-white`}
                        />
                      </div>

                      <div className="flex items-center justify-center p-1">
                        <button
                          type="button"
                          onClick={() =>
                            updateSpecialNote(date, note.id, {
                              completed: !note.completed,
                            })
                          }
                          className="rounded p-1 text-[#0066cc] transition-colors hover:bg-blue-50"
                          aria-label="특이사항 완료 처리"
                        >
                          {note.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-400 bg-gray-50 p-3">
                <button
                  type="button"
                  onClick={() => addSpecialNote(date)}
                  className="inline-flex items-center gap-2 rounded border border-[#8ab4f8] bg-[#e8f0fe] px-4 py-2 text-sm font-medium text-[#174ea6] transition-colors hover:bg-[#dbe7fd]"
                >
                  <Plus size={16} />
                  <span>특이사항 추가</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b-2 border-gray-500">
          <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
            사용금액
          </div>

          {ledger.expenses.length === 0 ? (
            <div className="grid grid-cols-[1fr_120px_52px]">
              <div className="border-r border-gray-300 p-2 text-sm text-gray-400">데이터 없음</div>
              <div className="border-r border-gray-300 p-2 text-right text-sm text-gray-400">-</div>
              <div className="p-2" />
            </div>
          ) : (
            <div className="divide-y divide-gray-300">
              {ledger.expenses.map((item) => (
                <div key={item.id} className="grid grid-cols-[1fr_120px_52px]">
                  <div className="border-r border-gray-300 p-2 text-sm">{item.title}</div>
                  <div className="border-r border-gray-300 p-2 text-right text-sm tabular-nums">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="flex items-center justify-center p-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/ledger/${date}/expense/${item.id}`)}
                      className="rounded p-1 text-[#0066cc] transition-colors hover:bg-blue-50"
                      aria-label="지출 수정"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-400 bg-gray-50 p-3">
            <button
              onClick={() => navigate(`/ledger/${date}/expense/new`)}
              className="inline-flex items-center gap-2 rounded border border-[#8ab4f8] bg-[#e8f0fe] px-4 py-2 text-sm font-medium text-[#174ea6] transition-colors hover:bg-[#dbe7fd]"
            >
              <Plus size={16} />
              <span>지출추가</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4">
          <div className="border-b border-gray-400 md:border-b-0 md:border-r">
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">금일 총사용금액</div>
            <div className="p-3 text-sm tabular-nums text-gray-800">
              {formatCurrency(totalUsageAmount)}
            </div>
          </div>

          <div className="border-b border-gray-400 md:border-b-0 md:border-r">
            <div className="bg-[#edf7ed] p-2 text-sm font-medium text-[#1e8e3e]">금일편성식비</div>
            <div className="p-3 text-sm tabular-nums text-gray-800">
              {formatCurrency(todayFoodBudget)}
            </div>
          </div>

          <div className="border-b border-gray-400 md:border-b-0 md:border-r">
            <div className="bg-[#edf7ed] p-2 text-sm font-medium text-[#1e8e3e]">고정지출 잔여</div>
            <div className="p-3 text-sm tabular-nums text-gray-800">
              {formatCurrency(fixedExpenseStatus.remaining)}
            </div>
          </div>

          <div>
            <div className="bg-[#fef7e0] p-2 text-sm font-medium text-gray-700">고정지출 사용</div>
            <div className="p-3">
              <input
                type="number"
                step={1000}
                value={ledger.fixedExpenseUsed || ""}
                onChange={(event) =>
                  updateFixedExpenseUsed(date, event.target.value ? Number(event.target.value) : 0)
                }
                className="w-full rounded border border-[#a8c7fa] bg-[#eef4ff] px-2 py-2 text-sm font-medium outline-none tabular-nums focus:border-[#1a73e8] focus:bg-white"
              />
            </div>
          </div>
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
                  className="rounded border border-[#a8c7fa] bg-[#eef4ff] px-2 py-2 text-xs outline-none focus:border-[#1a73e8] focus:bg-white"
                />
                <input
                  type="text"
                  value={otherExpenseForm.title}
                  onChange={(event) =>
                    setOtherExpenseForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="항목명"
                  className="rounded border border-[#a8c7fa] bg-[#eef4ff] px-3 py-2 text-sm outline-none focus:border-[#1a73e8] focus:bg-white"
                />
                <input
                  type="number"
                  step={1000}
                  value={otherExpenseForm.amount}
                  onChange={(event) =>
                    setOtherExpenseForm((prev) => ({ ...prev, amount: event.target.value }))
                  }
                  placeholder="금액"
                  className="rounded border border-[#a8c7fa] bg-[#eef4ff] px-3 py-2 text-sm outline-none tabular-nums focus:border-[#1a73e8] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddOtherExpense}
                  className="inline-flex min-w-[96px] items-center justify-center gap-1 rounded border border-[#8ab4f8] bg-[#e8f0fe] px-3 py-2 text-sm font-medium text-[#174ea6] transition-colors hover:bg-[#dbe7fd]"
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
