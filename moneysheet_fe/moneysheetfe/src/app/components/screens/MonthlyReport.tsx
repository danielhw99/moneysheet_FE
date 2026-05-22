import { useMemo } from "react";
import { useMockFinance } from "../../mock/mockFinance";

function formatCurrency(value: number) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthlyReport() {
  const { getMonthSummary } = useMockFinance();
  const monthKey = useMemo(() => getCurrentMonthKey(), []);
  const summary = getMonthSummary(monthKey);

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold md:text-3xl">월간 리포트</h1>
        <div className="text-base text-gray-600">
          현재 월 기준 집계 결과를 확인합니다.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">금월 수익</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-[#1e8e3e]">
            {formatCurrency(summary.incomeTotal)}
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">총 지출</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-[#c5221f]">
            {formatCurrency(summary.totalExpense)}
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">실제 저금 금액</div>
          <div className="mt-3 text-3xl font-semibold tabular-nums text-[#1e8e3e]">
            {formatCurrency(summary.actualSavingAmount)}
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">고정지출 합계</div>
          <div className="mt-3 text-2xl font-semibold tabular-nums">
            {formatCurrency(summary.fixedExpenseTotal)}
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">그 외 지출 합계</div>
          <div className="mt-3 text-2xl font-semibold tabular-nums">
            {formatCurrency(summary.otherExpenseTotal)}
          </div>
        </div>

        <div className="rounded border border-gray-200 bg-white p-5">
          <div className="text-sm text-gray-500">식비 편성 합계</div>
          <div className="mt-3 text-2xl font-semibold tabular-nums">
            {formatCurrency(summary.foodBudgetTable.total)}
          </div>
        </div>
      </div>
    </div>
  );
}
