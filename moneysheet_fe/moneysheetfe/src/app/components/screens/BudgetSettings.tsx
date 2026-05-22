import { useEffect, useState } from "react";
import { Save, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router";
import { useMockFinance } from "../../mock/mockFinance";

type IncomeRecordForm = {
  id: string;
  date: string;
  label: string;
  amount: string;
};

export function BudgetSettings() {
  const navigate = useNavigate();
  const { state, updateIncomeRecords, updateFoodBudget } = useMockFinance();
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecordForm[]>([]);
  const [foodBudget, setFoodBudget] = useState({
    weekday: "",
    saturday: "",
    sunday: "",
  });

  useEffect(() => {
    setIncomeRecords(
      state.incomeRecords.map((item) => ({
        id: item.id,
        date: item.date,
        label: item.label,
        amount: String(item.amount),
      })),
    );
    setFoodBudget({
      weekday: String(state.foodBudget.weekday),
      saturday: String(state.foodBudget.saturday),
      sunday: String(state.foodBudget.sunday),
    });
  }, [state.foodBudget, state.incomeRecords]);

  const handleAddIncome = () => {
    setIncomeRecords((prev) => [
      ...prev,
      { id: `income-${Date.now()}`, date: "", label: "", amount: "" },
    ]);
  };

  const handleRemoveIncome = (index: number) => {
    setIncomeRecords((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleIncomeChange = (
    index: number,
    field: keyof IncomeRecordForm,
    value: string,
  ) => {
    setIncomeRecords((prev) =>
      prev.map((record, itemIndex) =>
        itemIndex === index ? { ...record, [field]: value } : record,
      ),
    );
  };

  const handleSave = () => {
    updateIncomeRecords(
      incomeRecords
        .filter((item) => item.date && item.label && item.amount)
        .map((item) => ({
          id: item.id,
          date: item.date,
          label: item.label,
          amount: Number(item.amount),
        })),
    );

    updateFoodBudget({
      weekday: Number(foodBudget.weekday || 0),
      saturday: Number(foodBudget.saturday || 0),
      sunday: Number(foodBudget.sunday || 0),
    });

    navigate("/home");
  };

  return (
    <div className="mx-auto max-w-4xl p-6 md:p-8">
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-semibold md:text-3xl">예산 설정</h1>
        <div className="text-sm text-gray-600">
          월 수입 기록과 식비 예산 구조를 설정합니다.
        </div>
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
              <div />
            </div>

            {incomeRecords.map((record, index) => (
              <div key={record.id} className="grid grid-cols-[120px_1fr_120px_40px] gap-2 p-2">
                <input
                  type="date"
                  value={record.date}
                  onChange={(event) => handleIncomeChange(index, "date", event.target.value)}
                  className="rounded border border-gray-300 p-2 text-sm"
                />
                <input
                  type="text"
                  value={record.label}
                  onChange={(event) => handleIncomeChange(index, "label", event.target.value)}
                  className="rounded border border-gray-300 p-2 text-sm"
                />
                <input
                  type="number"
                  step={1000}
                  value={record.amount}
                  onChange={(event) => handleIncomeChange(index, "amount", event.target.value)}
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
                step={1000}
                value={foodBudget.weekday}
                onChange={(event) =>
                  setFoodBudget({ ...foodBudget, weekday: event.target.value })
                }
                className="w-full rounded border border-gray-300 p-3 font-semibold tabular-nums"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">토요일</label>
              <input
                type="number"
                step={1000}
                value={foodBudget.saturday}
                onChange={(event) =>
                  setFoodBudget({ ...foodBudget, saturday: event.target.value })
                }
                className="w-full rounded border border-gray-300 p-3 font-semibold tabular-nums"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">일요일</label>
              <input
                type="number"
                step={1000}
                value={foodBudget.sunday}
                onChange={(event) =>
                  setFoodBudget({ ...foodBudget, sunday: event.target.value })
                }
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
