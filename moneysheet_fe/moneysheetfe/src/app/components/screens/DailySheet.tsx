import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, Plus } from 'lucide-react';

export function DailySheet() {
  const navigate = useNavigate();
  const { date } = useParams();

  const [account, setAccount] = useState("");
  const [specialNotes, setSpecialNotes] = useState(["", "", "", ""]);

  const data = {
    dateLabel: "2026.05.01 Thu",
    calculated: 132900,
    margin: 2900,
    foodStatus: 130000,
    usageItems: [
      { title: "편도", amount: 5600 },
      { title: "지난주점심", amount: 6500 }
    ],
    dailyTotalUsed: 12100,
    dailyAllocatedFoodBudget: 15000,
    fixedExpenseRemaining: 616940,
    fixedExpenseUsed: ""
  };

  const handleSpecialNoteChange = (index: number, value: string) => {
    const newNotes = [...specialNotes];
    newNotes[index] = value;
    setSpecialNotes(newNotes);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/ledger')}
          className="p-2 hover:bg-gray-100 rounded transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl md:text-3xl font-semibold">{data.dateLabel}</h1>
      </div>

      {/* Spreadsheet-style Sheet */}
      <div className="bg-white border border-gray-400 rounded overflow-hidden">
        {/* Top Section - Balances */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="border-r border-gray-400">
            <div className="bg-gray-100 border-b border-gray-400 p-2 text-sm font-medium text-gray-700">
              날짜
            </div>
            <div className="p-3 min-h-[48px] text-sm">
              {data.dateLabel}
            </div>
          </div>

          <div className="border-r border-gray-400">
            <div className="bg-gray-100 border-b border-gray-400 p-2 text-sm font-medium text-gray-700">
              계좌
            </div>
            <div className="p-3 min-h-[48px]">
              <input
                type="number"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="입력"
                className="w-full text-sm bg-transparent border-none outline-none tabular-nums"
              />
            </div>
          </div>

          <div className="border-r border-gray-400">
            <div className="bg-gray-100 border-b border-gray-400 p-2 text-sm font-medium text-gray-700">
              계산
            </div>
            <div className="p-3 min-h-[48px] text-sm font-semibold tabular-nums">
              {data.calculated.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="bg-gray-100 border-b border-gray-400 p-2 text-sm font-medium text-gray-700">
              여유
            </div>
            <div className="p-3 min-h-[48px] text-sm font-semibold tabular-nums text-[#34a853]">
              {data.margin.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Food Status & Special Notes */}
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="border-r border-gray-400">
            <div className="bg-gray-100 border-b border-gray-400 p-2 text-sm font-medium text-gray-700">
              식비현황
            </div>
            <div className="p-3 min-h-[48px] text-sm font-semibold tabular-nums">
              {data.foodStatus.toLocaleString()}
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-gray-100 border-b border-gray-400 p-2 text-sm font-medium text-gray-700">
              특이사항
            </div>
            <div className="divide-y divide-gray-300">
              {specialNotes.map((note, i) => (
                <div key={i} className="p-2 min-h-[36px]">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => handleSpecialNoteChange(i, e.target.value)}
                    placeholder="-"
                    className="w-full text-sm bg-transparent border-none outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage Amount Section */}
        <div className="border-b border-gray-400">
          <div className="bg-gray-100 border-b border-gray-400 p-2 text-sm font-medium text-gray-700">
            사용금액
          </div>

          <div className="divide-y divide-gray-300">
            {data.usageItems.map((item, i) => (
              <div
                key={i}
                onClick={() => navigate(`/ledger/${date}/expense/${i + 1}`)}
                className="grid grid-cols-2 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="p-2 border-r border-gray-300 text-sm">{item.title}</div>
                <div className="p-2 text-sm text-right font-semibold tabular-nums">
                  {item.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-400 bg-gray-50">
            <button
              onClick={() => navigate(`/ledger/${date}/expense/new`)}
              className="flex items-center gap-2 px-4 py-2 bg-[#0066cc] text-white rounded text-sm hover:bg-[#0052a3] transition-colors"
            >
              <Plus size={16} />
              <span>지출추가</span>
            </button>
          </div>
        </div>

        {/* Bottom Summary Section */}
        <div className="grid grid-cols-4">
          <div className="border-r border-gray-400">
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">
              총사용금액
            </div>
            <div className="p-3 text-sm font-bold tabular-nums">
              {data.dailyTotalUsed.toLocaleString()}
            </div>
          </div>

          <div className="border-r border-gray-400">
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">
              금일편성식비
            </div>
            <div className="p-3 text-sm font-semibold tabular-nums">
              {data.dailyAllocatedFoodBudget.toLocaleString()}
            </div>
          </div>

          <div className="border-r border-gray-400">
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">
              고정지출 잔여
            </div>
            <div className="p-3 text-sm font-semibold tabular-nums">
              {data.fixedExpenseRemaining.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">
              고정지출 사용
            </div>
            <div className="p-3 text-sm tabular-nums">
              {data.fixedExpenseUsed || '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
        <div className="font-medium mb-1">사용 안내</div>
        <ul className="space-y-0.5 list-disc list-inside">
          <li>계좌: 수동으로 실제 잔액을 입력하세요</li>
          <li>사용금액: 각 항목을 클릭하여 수정하거나, 지출추가 버튼으로 새 항목을 추가하세요</li>
          <li>계산 및 여유는 자동으로 계산됩니다</li>
        </ul>
      </div>
    </div>
  );
}
