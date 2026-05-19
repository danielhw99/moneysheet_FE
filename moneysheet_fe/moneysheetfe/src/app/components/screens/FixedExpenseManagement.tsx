import { Plus } from "lucide-react";

export function FixedExpenseManagement() {
  const items: Array<{
    id: number;
    title: string;
    amount: number;
    billingDay: number;
    isActive: boolean;
    appliedThisMonth: boolean;
  }> = [];

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold md:text-3xl">고정 지출 관리</h1>
        <div className="text-base text-gray-600">반복 지출 규칙을 관리합니다</div>
      </div>

      <div className="max-w-3xl">
        {items.length === 0 ? (
          <div className="rounded border border-gray-200 bg-gray-50 p-8 text-center">
            <div className="mb-4 text-sm text-gray-500">등록된 고정 지출 데이터가 없습니다</div>
            <button className="inline-flex items-center gap-2 rounded bg-[#0066cc] px-4 py-2 text-sm text-white transition-colors hover:bg-[#0052a3]">
              <Plus size={16} />
              <span>규칙 추가</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
