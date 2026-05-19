import { useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";

export function BudgetSettings() {
  const navigate = useNavigate();

  const [incomeRecords, setIncomeRecords] = useState([
    { date: "", label: "", amount: "" },
  ]);

  const [foodBudget, setFoodBudget] = useState({
    weekday: "",
    saturday: "",
    sunday: "",
  });

  const handleAddIncome = () => {
    setIncomeRecords((prev) => [...prev, { date: "", label: "", amount: "" }]);
  };

  const handleRemoveIncome = (index: number) => {
    setIncomeRecords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleIncomeChange = (index: number, field: string, value: string) => {
    setIncomeRecords((prev) =>
      prev.map((record, i) => (i === index ? { ...record, [field]: value } : record)),
    );
  };

  const handleSave = () => {
    navigate("/home");
  };

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold md:text-3xl">예산 설정</h1>
        <div className="text-sm text-gray-600">월 수입과 식비 예산 구조를 설정합니다</div>
      </div>

      <div className="max-w-3xl space-y-6">
        <div className="overflow-hidden rounded border border-gray-400 bg-white">
          <div className="flex items-center justify-between border-b border-gray-400 bg-[#fef7e0] p-3">
            <h3 className="text-sm font-medium">월 수입 기록</h3>
            <button
              onClick={handleAddIncome}
              className="flex items-center gap-1 rounded bg-[#0066cc] px-3 py-1 text-xs text-white transition-colors hover:bg-[#0052a3]"
            >
              <Plus size={14} />
              <span>추가</span>
            </button>
          </div>

          <div className="divide-y divide-gray-300">
            <div className="grid grid-cols-[120px_1fr_120px_40px] gap-2 bg-gray-50 p-3 text-xs font-medium text-gray-600">
              <div>날짜</div>
              <div>항목</div>
              <div>금액</div>
              <div></div>
            </div>

            {incomeRecords.map((record, index) => (
              <div key={index} className="grid grid-cols-[120px_1fr_120px_40px] gap-2 p-2">
                <input
                  type="date"
                  value={record.date}
                  onChange={(e) => handleIncomeChange(index, "date", e.target.value)}
                  className="rounded border border-gray-300 p-2 text-sm"
                />
                <input
                  type="text"
                  value={record.label}
                  onChange={(e) => handleIncomeChange(index, "label", e.target.value)}
                  placeholder=""
                  className="rounded border border-gray-300 p-2 text-sm"
                />
                <input
                  type="number"
                  value={record.amount}
                  onChange={(e) => handleIncomeChange(index, "amount", e.target.value)}
                  placeholder=""
                  className="rounded border border-gray-300 p-2 text-sm tabular-nums"
                />
                <button
                  onClick={() => handleRemoveIncome(index)}
                  className="rounded p-2 text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded border border-gray-400 bg-white">
          <div className="border-b border-gray-400 bg-[#fef7e0] p-3">
            <h3 className="text-sm font-medium">식비 예산</h3>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <label className="mb-2 block text-sm font-medium">주중</label>
              <input
                type="number"
                value={foodBudget.weekday}
                onChange={(e) => setFoodBudget({ ...foodBudget, weekday: e.target.value })}
                className="w-full rounded border border-gray-300 p-3 font-semibold tabular-nums"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">토요일</label>
              <input
                type="number"
                value={foodBudget.saturday}
                onChange={(e) => setFoodBudget({ ...foodBudget, saturday: e.target.value })}
                className="w-full rounded border border-gray-300 p-3 font-semibold tabular-nums"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">일요일</label>
              <input
                type="number"
                value={foodBudget.sunday}
                onChange={(e) => setFoodBudget({ ...foodBudget, sunday: e.target.value })}
                className="w-full rounded border border-gray-300 p-3 font-semibold tabular-nums"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex w-full items-center justify-center gap-2 rounded bg-[#34a853] py-3 font-medium text-white transition-colors hover:bg-[#2d8e47]"
        >
          <Save size={18} />
          <span>저장</span>
        </button>
      </div>
    </div>
  );
}
