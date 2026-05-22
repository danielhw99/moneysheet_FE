import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { X, Trash2 } from "lucide-react";
import { useMockFinance } from "../../mock/mockFinance";

interface ExpenseFormProps {
  mode: "create" | "edit";
}

type ExpenseFormState = {
  title: string;
  amount: string;
  category: string;
  memo: string;
};

function toDomainCategory(category: string) {
  return category === "식비" ? "food" : "other";
}

export function ExpenseForm({ mode }: ExpenseFormProps) {
  const navigate = useNavigate();
  const { date = "", id } = useParams();
  const { state, getDailyLedger, addCategory, addExpense, updateExpense, deleteExpense } =
    useMockFinance();
  const ledger = getDailyLedger(date);
  const currentExpense = useMemo(
    () => ledger.expenses.find((item) => item.id === id),
    [id, ledger.expenses],
  );

  const [formData, setFormData] = useState<ExpenseFormState>({
    title: "",
    amount: "",
    category: "",
    memo: "",
  });
  const [errors, setErrors] = useState({
    title: false,
    amount: false,
    category: false,
  });
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    if (mode === "edit" && currentExpense) {
      setFormData({
        title: currentExpense.title,
        amount: String(currentExpense.amount),
        category: currentExpense.category === "food" ? "식비" : state.customCategories.find((item) => item !== "식비") ?? "기타",
        memo: currentExpense.memo,
      });
    }
  }, [currentExpense, mode, state.customCategories]);

  const handleSubmit = () => {
    const nextErrors = {
      title: !formData.title.trim(),
      amount: !formData.amount || Number(formData.amount) <= 0,
      category: !formData.category,
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    const payload = {
      title: formData.title.trim(),
      amount: Number(formData.amount),
      category: toDomainCategory(formData.category),
      memo: formData.memo.trim(),
    } as const;

    if (mode === "edit" && currentExpense) {
      updateExpense(date, currentExpense.id, payload);
    } else {
      addExpense(date, payload);
    }

    navigate(`/ledger/${date}`);
  };

  const handleDelete = () => {
    if (mode === "edit" && currentExpense) {
      deleteExpense(date, currentExpense.id);
    }
    navigate(`/ledger/${date}`);
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed || state.customCategories.includes(trimmed)) {
      return;
    }

    addCategory(trimmed);
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setNewCategory("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">
            {mode === "create" ? "지출 추가" : "지출 수정"}
          </h2>
          <div className="flex items-center gap-2">
            {mode === "edit" && (
              <button onClick={handleDelete} className="rounded p-2 text-red-600 hover:bg-red-50">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={() => navigate(`/ledger/${date}`)} className="rounded p-2 hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                제목 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                className={`w-full rounded border p-3 ${errors.title ? "border-red-300 bg-red-50" : "border-gray-300"}`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                금액 <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                step={1000}
                value={formData.amount}
                onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
                className={`w-full rounded border p-3 text-lg font-semibold tabular-nums ${
                  errors.amount ? "border-red-300 bg-red-50" : "border-gray-300"
                }`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                카테고리 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {state.customCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setFormData({ ...formData, category })}
                    className={`rounded border px-3 py-2 text-sm transition-colors ${
                      formData.category === category
                        ? "border-[#0066cc] bg-[#0066cc] text-white"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="카테고리 추가"
                  className="flex-1 rounded border border-gray-300 p-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="rounded border border-gray-300 px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                >
                  추가
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">메모</label>
              <textarea
                value={formData.memo}
                onChange={(event) => setFormData({ ...formData, memo: event.target.value })}
                rows={3}
                className="w-full resize-none rounded border border-gray-300 p-3"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-4">
          <button
            onClick={handleSubmit}
            className="w-full rounded bg-[#34a853] py-3 font-medium text-white transition-colors hover:bg-[#2d8e47]"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
