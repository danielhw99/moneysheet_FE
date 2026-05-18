import { useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';

export function BudgetSettings() {
  const navigate = useNavigate();

  const [incomeRecords, setIncomeRecords] = useState([
    { date: "2026-05-01", label: "용돈", amount: "570000" },
    { date: "2026-05-18", label: "국취제", amount: "600000" }
  ]);

  const [foodBudget, setFoodBudget] = useState({
    weekday: "15000",
    saturday: "5000",
    sunday: "15000"
  });

  const handleAddIncome = () => {
    setIncomeRecords([...incomeRecords, { date: "", label: "", amount: "" }]);
  };

  const handleRemoveIncome = (index: number) => {
    setIncomeRecords(incomeRecords.filter((_, i) => i !== index));
  };

  const handleIncomeChange = (index: number, field: string, value: string) => {
    const newRecords = [...incomeRecords];
    newRecords[index] = { ...newRecords[index], [field]: value };
    setIncomeRecords(newRecords);
  };

  const handleSave = () => {
    navigate('/home');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">예산 설정</h1>
        <div className="text-sm text-gray-600">월간 수입과 식비 예산을 관리합니다</div>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Monthly Income Records */}
        <div className="bg-white border border-gray-400 rounded overflow-hidden">
          <div className="bg-[#fef7e0] border-b border-gray-400 p-3 flex items-center justify-between">
            <h3 className="text-sm font-medium">월 수입 기록</h3>
            <button
              onClick={handleAddIncome}
              className="flex items-center gap-1 px-3 py-1 text-xs bg-[#0066cc] text-white rounded hover:bg-[#0052a3] transition-colors"
            >
              <Plus size={14} />
              <span>추가</span>
            </button>
          </div>

          <div className="divide-y divide-gray-300">
            {/* Header */}
            <div className="grid grid-cols-[120px_1fr_120px_40px] gap-2 p-3 text-xs font-medium text-gray-600 bg-gray-50">
              <div>날짜</div>
              <div>항목</div>
              <div>금액</div>
              <div></div>
            </div>

            {/* Records */}
            {incomeRecords.map((record, index) => (
              <div key={index} className="grid grid-cols-[120px_1fr_120px_40px] gap-2 p-2 items-center">
                <input
                  type="date"
                  value={record.date}
                  onChange={(e) => handleIncomeChange(index, 'date', e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="text"
                  value={record.label}
                  onChange={(e) => handleIncomeChange(index, 'label', e.target.value)}
                  placeholder="수입 항목"
                  className="p-2 border border-gray-300 rounded text-sm"
                />
                <input
                  type="number"
                  value={record.amount}
                  onChange={(e) => handleIncomeChange(index, 'amount', e.target.value)}
                  placeholder="금액"
                  className="p-2 border border-gray-300 rounded text-sm tabular-nums"
                />
                <button
                  onClick={() => handleRemoveIncome(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {incomeRecords.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                수입 기록이 없습니다
              </div>
            )}
          </div>
        </div>

        {/* Food Budget Settings */}
        <div className="bg-white border border-gray-400 rounded overflow-hidden">
          <div className="bg-[#fef7e0] border-b border-gray-400 p-3">
            <h3 className="text-sm font-medium">식비 예산</h3>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">평일 (1일 예산)</label>
              <div className="relative">
                <input
                  type="number"
                  value={foodBudget.weekday}
                  onChange={(e) => setFoodBudget({ ...foodBudget, weekday: e.target.value })}
                  className="w-full p-3 pr-12 border border-gray-300 rounded font-semibold tabular-nums"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">토요일 (1일 예산)</label>
              <div className="relative">
                <input
                  type="number"
                  value={foodBudget.saturday}
                  onChange={(e) => setFoodBudget({ ...foodBudget, saturday: e.target.value })}
                  className="w-full p-3 pr-12 border border-gray-300 rounded font-semibold tabular-nums"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">일요일 (1일 예산)</label>
              <div className="relative">
                <input
                  type="number"
                  value={foodBudget.sunday}
                  onChange={(e) => setFoodBudget({ ...foodBudget, sunday: e.target.value })}
                  className="w-full p-3 pr-12 border border-gray-300 rounded font-semibold tabular-nums"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">원</div>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
          <div className="font-medium mb-2">설정 안내</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>월 수입은 여러 건을 등록할 수 있습니다</li>
            <li>식비 예산은 요일별로 다르게 설정할 수 있습니다</li>
            <li>월별 총 식비 예산은 각 요일의 일수와 예산을 곱하여 자동 계산됩니다</li>
          </ul>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#34a853] text-white rounded font-medium hover:bg-[#2d8e47] transition-colors"
        >
          <Save size={18} />
          <span>저장</span>
        </button>
      </div>
    </div>
  );
}
