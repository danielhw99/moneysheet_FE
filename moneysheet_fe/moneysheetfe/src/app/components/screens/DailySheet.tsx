import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ChevronLeft, Plus } from "lucide-react";

function formatDateLabel(dateParam?: string) {
  if (!dateParam) return "날짜";

  const parsed = new Date(dateParam);
  if (Number.isNaN(parsed.getTime())) return dateParam;

  return parsed.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).replace(/-/g, ".");
}

export function DailySheet() {
  const navigate = useNavigate();
  const { date } = useParams();

  const [account, setAccount] = useState("");
  const [specialNotes, setSpecialNotes] = useState(["", "", "", ""]);
  const usageItems: Array<{ title: string; amount: string }> = [];

  const handleSpecialNoteChange = (index: number, value: string) => {
    setSpecialNotes((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  return (
    <div className="mx-auto max-w-5xl p-6 md:p-8">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={() => navigate("/ledger")}
          className="rounded p-2 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-semibold md:text-3xl">{formatDateLabel(date)}</h1>
      </div>

      <div className="overflow-hidden rounded border border-gray-400 bg-white">
        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="border-r border-gray-400">
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              날짜
            </div>
            <div className="min-h-[48px] p-3 text-sm">{formatDateLabel(date)}</div>
          </div>

          <div className="border-r border-gray-400">
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              계좌
            </div>
            <div className="min-h-[48px] p-3">
              <input
                type="number"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder=""
                className="w-full border-none bg-transparent text-sm outline-none tabular-nums"
              />
            </div>
          </div>

          <div className="border-r border-gray-400">
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              계산
            </div>
            <div className="min-h-[48px] p-3 text-sm text-gray-400">데이터 없음</div>
          </div>

          <div>
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              여유
            </div>
            <div className="min-h-[48px] p-3 text-sm text-gray-400">데이터 없음</div>
          </div>
        </div>

        <div className="grid grid-cols-4 border-b border-gray-400">
          <div className="border-r border-gray-400">
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              식비현황
            </div>
            <div className="min-h-[48px] p-3 text-sm text-gray-400">데이터 없음</div>
          </div>

          <div className="col-span-3">
            <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
              특이사항
            </div>
            <div className="divide-y divide-gray-300">
              {specialNotes.map((note, i) => (
                <div key={i} className="min-h-[36px] p-2">
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => handleSpecialNoteChange(i, e.target.value)}
                    placeholder=""
                    className="w-full border-none bg-transparent text-sm outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-b border-gray-400">
          <div className="border-b border-gray-400 bg-gray-100 p-2 text-sm font-medium text-gray-700">
            사용금액
          </div>

          {usageItems.length === 0 ? (
            <div className="grid grid-cols-2">
              <div className="border-r border-gray-300 p-2 text-sm text-gray-400">데이터 없음</div>
              <div className="p-2 text-right text-sm text-gray-400">-</div>
            </div>
          ) : (
            <div className="divide-y divide-gray-300">
              {usageItems.map((item, i) => (
                <div key={i} className="grid grid-cols-2">
                  <div className="border-r border-gray-300 p-2 text-sm">{item.title}</div>
                  <div className="p-2 text-right text-sm tabular-nums">{item.amount}</div>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-400 bg-gray-50 p-3">
            <button
              onClick={() => navigate(`/ledger/${date}/expense/new`)}
              className="flex items-center gap-2 rounded bg-[#0066cc] px-4 py-2 text-sm text-white transition-colors hover:bg-[#0052a3]"
            >
              <Plus size={16} />
              <span>지출추가</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4">
          <div className="border-r border-gray-400">
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">총사용금액</div>
            <div className="p-3 text-sm text-gray-400">데이터 없음</div>
          </div>

          <div className="border-r border-gray-400">
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">금일편성식비</div>
            <div className="p-3 text-sm text-gray-400">데이터 없음</div>
          </div>

          <div className="border-r border-gray-400">
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">고정지출 잔여</div>
            <div className="p-3 text-sm text-gray-400">데이터 없음</div>
          </div>

          <div>
            <div className="bg-gray-100 p-2 text-sm font-medium text-gray-700">고정지출 사용</div>
            <div className="p-3 text-sm text-gray-400">데이터 없음</div>
          </div>
        </div>
      </div>
    </div>
  );
}
