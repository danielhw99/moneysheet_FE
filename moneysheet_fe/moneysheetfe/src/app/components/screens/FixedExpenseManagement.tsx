import { useMemo, useState } from "react";
import { CheckSquare, Plus, Square, Trash2 } from "lucide-react";
import { useMockFinance } from "../../mock/mockFinance";

function formatCurrency(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function FixedExpenseManagement() {
  const {
    state,
    addFixedExpense,
    removeFixedExpense,
    toggleFixedExpenseApplied,
    toggleFixedExpenseCompleted,
  } = useMockFinance();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [form, setForm] = useState({
    title: "",
    amount: "",
  });

  const rows = useMemo(
    () =>
      state.fixedExpenses.map((item) => ({
        ...item,
        appliedThisMonth: item.appliedMonths.includes(selectedMonth),
        completedThisMonth: item.completedMonths.includes(selectedMonth),
      })),
    [selectedMonth, state.fixedExpenses],
  );

  const handleAdd = () => {
    if (!form.title.trim() || !form.amount) {
      return;
    }

    addFixedExpense({
      title: form.title.trim(),
      amount: Number(form.amount),
    });

    setForm({
      title: "",
      amount: "",
    });
  };

  return (
    <div className="mx-auto max-w-6xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold md:text-3xl">고정 지출 관리</h1>
        <div className="text-base text-gray-600">
          월별 이력을 확인하고 반영 여부 및 지출 완료 상태를 관리합니다.
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm font-medium text-gray-700">조회 월</div>
        <input
          type="month"
          value={selectedMonth}
          onChange={(event) => setSelectedMonth(event.target.value)}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-6 rounded border border-gray-300 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_100px]">
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="항목명"
            className="rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            step={1000}
            value={form.amount}
            onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
            placeholder="금액"
            className="rounded border border-gray-300 px-3 py-2 text-sm tabular-nums"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center justify-center gap-2 rounded bg-[#0066cc] px-4 py-2 text-sm text-white transition-colors hover:bg-[#0052a3]"
          >
            <Plus size={16} />
            <span>추가</span>
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-300 bg-white">
        <div className="grid grid-cols-[1fr_140px_120px_120px_64px] bg-[#fef7e0] text-sm font-medium text-gray-800">
          <div className="border-r border-b border-gray-300 px-3 py-3">항목</div>
          <div className="border-r border-b border-gray-300 px-3 py-3 text-right">금액</div>
          <div className="border-r border-b border-gray-300 px-3 py-3 text-center">지출 완료</div>
          <div className="border-r border-b border-gray-300 px-3 py-3 text-center">금월 반영</div>
          <div className="border-b border-gray-300 px-3 py-3 text-center">삭제</div>
        </div>

        {rows.map((item) => (
          <div
            key={item.id}
            className="grid grid-cols-[1fr_140px_120px_120px_64px] text-sm"
          >
            <div className="border-r border-b border-gray-200 px-3 py-3">{item.title}</div>
            <div className="border-r border-b border-gray-200 px-3 py-3 text-right tabular-nums">
              {formatCurrency(item.amount)}
            </div>
            <div className="border-r border-b border-gray-200 px-3 py-3 text-center">
              <button
                type="button"
                disabled={!item.appliedThisMonth}
                onClick={() => toggleFixedExpenseCompleted(item.id, selectedMonth)}
                className={`rounded p-1 transition-colors ${
                  item.appliedThisMonth
                    ? "text-[#0066cc] hover:bg-blue-50"
                    : "cursor-not-allowed text-gray-300"
                }`}
                aria-label="고정지출 완료 체크"
              >
                {item.completedThisMonth ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            </div>
            <div className="border-r border-b border-gray-200 px-3 py-3 text-center">
              <button
                type="button"
                onClick={() => toggleFixedExpenseApplied(item.id, selectedMonth)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  item.appliedThisMonth
                    ? "bg-[#34a853] text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {item.appliedThisMonth ? "ON" : "OFF"}
              </button>
            </div>
            <div className="border-b border-gray-200 px-3 py-3 text-center">
              <button
                type="button"
                onClick={() => removeFixedExpense(item.id)}
                className="rounded p-2 text-red-600 transition-colors hover:bg-red-50"
                aria-label="고정지출 삭제"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
