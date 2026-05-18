import { useState } from 'react';
import { Plus, Calendar, ToggleLeft, ToggleRight, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';

export function FixedExpenseManagement() {
  const [items] = useState([
    {
      id: 1,
      title: "관리비",
      amount: 50000,
      billingDay: 10,
      isActive: true,
      appliedThisMonth: true
    },
    {
      id: 2,
      title: "유튜브 프리미엄",
      amount: 14900,
      billingDay: 15,
      isActive: true,
      appliedThisMonth: false
    },
    {
      id: 3,
      title: "정기 교통비",
      amount: 62000,
      billingDay: 1,
      isActive: false,
      appliedThisMonth: false
    }
  ]);

  const activeItems = items.filter(item => item.isActive);
  const totalMonthly = activeItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">고정 지출 관리</h1>
        <div className="text-base text-gray-600">
          월 총액: ₩{totalMonthly.toLocaleString()}
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
          <div className="text-xs text-gray-600 space-y-1">
            <div>• 고정 지출은 매월 자동으로 장부에 반영되지 않습니다</div>
            <div>• 필요시 "당월 적용" 버튼으로 수동으로 추가하세요</div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded p-8 text-center">
            <div className="text-sm text-gray-500 mb-4">등록된 고정 지출이 없습니다</div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded text-sm hover:bg-[#0052a3] transition-colors">
              <Plus size={16} />
              <span>규칙 추가</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`bg-white border ${item.isActive ? 'border-gray-300' : 'border-gray-200 opacity-60'} rounded p-4`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium">{item.title}</h3>
                      {item.isActive ? (
                        <ToggleRight size={20} className="text-[#34a853]" />
                      ) : (
                        <ToggleLeft size={20} className="text-gray-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar size={12} />
                      <span>매월 {item.billingDay}일</span>
                    </div>
                  </div>
                  <div className="text-base font-semibold tabular-nums">
                    ₩{item.amount.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-1.5 text-xs">
                    {item.appliedThisMonth ? (
                      <>
                        <CheckCircle2 size={14} className="text-[#34a853]" />
                        <span className="text-[#34a853]">당월 적용됨</span>
                      </>
                    ) : (
                      <>
                        <Circle size={14} className="text-gray-400" />
                        <span className="text-gray-600">당월 미적용</span>
                      </>
                    )}
                  </div>

                  {item.isActive && !item.appliedThisMonth && (
                    <button className="px-3 py-1 text-xs bg-[#0066cc] text-white rounded hover:bg-[#0052a3] transition-colors">
                      당월 적용
                    </button>
                  )}
                </div>

                {/* Duplicate Warning Example */}
                {item.id === 1 && item.appliedThisMonth && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-start gap-2">
                    <AlertTriangle size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-yellow-800">
                      이미 적용된 항목입니다. 다시 적용하면 중복됩니다.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Button */}
      <div className="mt-6 max-w-3xl">
        <button className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
          <Plus size={18} />
          <span className="text-sm font-medium">고정 지출 규칙 추가</span>
        </button>
      </div>
    </div>
  );
}
