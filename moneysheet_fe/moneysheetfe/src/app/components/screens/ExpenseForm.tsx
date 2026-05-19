import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { X, Trash2 } from "lucide-react";

interface ExpenseFormProps {
  mode: "create" | "edit";
}

export function ExpenseForm({ mode }: ExpenseFormProps) {
  const navigate = useNavigate();
  const { date } = useParams();

  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    paymentMethod: "",
    memo: "",
  });

  const [errors, setErrors] = useState({
    title: false,
    amount: false,
    category: false,
    paymentMethod: false,
  });

  const categories = ["식비", "고정", "기타"];
  const paymentMethods = [
    { value: "CARD", label: "카드" },
    { value: "CASH", label: "현금" },
    { value: "TRANSFER", label: "이체" },
  ];

  const handleSubmit = () => {
    const nextErrors = {
      title: !formData.title.trim(),
      amount: !formData.amount || Number(formData.amount) <= 0,
      category: !formData.category,
      paymentMethod: !formData.paymentMethod,
    };

    setErrors(nextErrors);

    if (!Object.values(nextErrors).some(Boolean)) {
      navigate(`/ledger/${date}`);
    }
  };

  const handleDelete = () => {
    navigate(`/ledger/${date}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-lg bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold">{mode === "create" ? "지출 추가" : "지출 수정"}</h2>
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
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full rounded border p-3 ${errors.title ? "border-red-300 bg-red-50" : "border-gray-300"}`}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                금액 <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
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
                {categories.map((category) => (
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
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                결제 수단 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                    className={`rounded border px-3 py-2 text-sm transition-colors ${
                      formData.paymentMethod === method.value
                        ? "border-[#0066cc] bg-[#0066cc] text-white"
                        : "border-gray-300 bg-white hover:bg-gray-50"
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">메모</label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
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
