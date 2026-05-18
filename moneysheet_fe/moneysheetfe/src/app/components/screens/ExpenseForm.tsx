import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { X, Trash2 } from 'lucide-react';

interface ExpenseFormProps {
  mode: 'create' | 'edit';
}

export function ExpenseForm({ mode }: ExpenseFormProps) {
  const navigate = useNavigate();
  const { date, id } = useParams();

  const [formData, setFormData] = useState({
    title: mode === 'edit' ? '점심' : '',
    amount: mode === 'edit' ? '9000' : '',
    category: mode === 'edit' ? '식비' : '',
    paymentMethod: mode === 'edit' ? 'CARD' : '',
    memo: mode === 'edit' ? '' : ''
  });

  const [errors, setErrors] = useState({
    title: false,
    amount: false,
    category: false,
    paymentMethod: false
  });

  const categories = ["식비", "고정", "기타"];
  const paymentMethods = [
    { value: "CARD", label: "카드" },
    { value: "CASH", label: "현금" },
    { value: "TRANSFER", label: "이체" }
  ];

  const handleSubmit = () => {
    const newErrors = {
      title: !formData.title.trim(),
      amount: !formData.amount || parseFloat(formData.amount) <= 0,
      category: !formData.category,
      paymentMethod: !formData.paymentMethod
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).some(e => e)) {
      navigate(`/ledger/${date}`);
    }
  };

  const handleDelete = () => {
    if (confirm('이 지출을 삭제하시겠습니까?')) {
      navigate(`/ledger/${date}`);
    }
  };

  const handleClose = () => {
    navigate(`/ledger/${date}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">
            {mode === 'create' ? '지출 추가' : '지출 수정'}
          </h2>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-50 rounded">
                <Trash2 size={18} />
              </button>
            )}
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                제목 <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="예: 점심"
                className={`w-full p-3 border ${errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded`}
              />
              {errors.title && (
                <div className="text-xs text-red-600 mt-1">제목을 입력해주세요</div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">
                금액 <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0"
                  className={`w-full p-3 pr-12 border ${errors.amount ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded text-lg font-semibold tabular-nums`}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">원</div>
              </div>
              {errors.amount && (
                <div className="text-xs text-red-600 mt-1">0보다 큰 금액을 입력해주세요</div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                카테고리 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFormData({ ...formData, category: cat })}
                    className={`py-2 px-3 border rounded text-sm transition-colors ${
                      formData.category === cat
                        ? 'bg-[#0066cc] text-white border-[#0066cc]'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              {errors.category && (
                <div className="text-xs text-red-600 mt-1">카테고리를 선택해주세요</div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium mb-2">
                결제 수단 <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setFormData({ ...formData, paymentMethod: method.value })}
                    className={`py-2 px-3 border rounded text-sm transition-colors ${
                      formData.paymentMethod === method.value
                        ? 'bg-[#0066cc] text-white border-[#0066cc]'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {method.label}
                  </button>
                ))}
              </div>
              {errors.paymentMethod && (
                <div className="text-xs text-red-600 mt-1">결제 수단을 선택해주세요</div>
              )}
            </div>

            {/* Memo */}
            <div>
              <label className="block text-sm font-medium mb-2">메모</label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                placeholder="추가 메모 (선택사항)"
                rows={3}
                className="w-full p-3 border border-gray-300 rounded resize-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-[#34a853] text-white rounded font-medium hover:bg-[#2d8e47] transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
