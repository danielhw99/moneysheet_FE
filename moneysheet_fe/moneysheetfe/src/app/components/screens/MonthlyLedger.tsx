import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarCell = {
  date: Date;
  isCurrentMonth: boolean;
};

function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

function formatRouteDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function buildCalendarDays(baseDate: Date) {
  const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();
  const cells: CalendarCell[] = [];

  for (let i = startDay; i > 0; i -= 1) {
    const date = new Date(startOfMonth);
    date.setDate(date.getDate() - i);
    cells.push({ date, isCurrentMonth: false });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    cells.push({
      date: new Date(baseDate.getFullYear(), baseDate.getMonth(), day),
      isCurrentMonth: true,
    });
  }

  while (cells.length % 7 !== 0) {
    const lastDate = new Date(cells[cells.length - 1].date);
    lastDate.setDate(lastDate.getDate() + 1);
    cells.push({ date: lastDate, isCurrentMonth: false });
  }

  return cells;
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyLedger() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const calendarDays = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  const moveMonth = (offset: number) => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1),
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">Monthly Ledger</h1>
          <div className="text-sm text-gray-600">월간 장부를 달력으로 확인합니다</div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => moveMonth(-1)}
            className="rounded border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-50"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-28 text-center text-sm font-medium text-gray-800 md:min-w-32">
            {formatMonthLabel(currentMonth)}
          </div>
          <button
            onClick={() => moveMonth(1)}
            className="rounded border border-gray-300 bg-white p-2 transition-colors hover:bg-gray-50"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
          <button
            onClick={goToToday}
            className="rounded border border-gray-300 bg-white px-3 py-2 text-sm transition-colors hover:bg-gray-50"
          >
            Today
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-300 bg-white">
        <div className="grid grid-cols-7 border-b border-gray-300 bg-[#f8f9fa]">
          {weekdays.map((day) => (
            <div
              key={day}
              className="border-r border-gray-300 px-2 py-2 text-center text-xs font-medium text-gray-600 last:border-r-0 md:px-3 md:py-3 md:text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendarDays.map(({ date, isCurrentMonth }) => {
            const isToday = isSameDay(date, today);

            return (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => navigate(`/ledger/${formatRouteDate(date)}`)}
                className={`aspect-square border-r border-b border-gray-300 p-1 text-left align-top transition-colors hover:bg-gray-50 last:border-r-0 md:p-2 ${
                  isCurrentMonth ? "bg-white" : "bg-gray-50"
                }`}
              >
                <div
                  className={`inline-flex h-7 w-7 items-center justify-center rounded text-xs font-medium md:h-8 md:w-8 md:text-sm ${
                    isToday
                      ? "bg-[#34a853] text-white"
                      : isCurrentMonth
                        ? "text-gray-900"
                        : "text-gray-400"
                  }`}
                >
                  {date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded border border-gray-300 bg-white">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[1.3fr_1.3fr_1.6fr_1.4fr_1.4fr_1.1fr] bg-[#fef7e0] text-center text-sm font-medium text-gray-800">
            <div className="border-r border-b border-gray-300 px-3 py-3">고정지출표</div>
            <div className="border-r border-b border-gray-300 px-3 py-3">식비</div>
            <div className="border-r border-b border-gray-300 px-3 py-3">그 외 지출</div>
            <div className="border-r border-b border-gray-300 px-3 py-3">지출 요약</div>
            <div className="border-r border-b border-gray-300 px-3 py-3">금월 수익 내역</div>
            <div className="border-b border-gray-300 px-3 py-3">실제 저금 금액</div>
          </div>

          <div className="grid grid-cols-[1.3fr_1.3fr_1.6fr_1.4fr_1.4fr_1.1fr]">
            <div className="border-r border-gray-300 p-4 text-sm text-gray-400">데이터 없음</div>
            <div className="border-r border-gray-300 p-4 text-sm text-gray-400">데이터 없음</div>
            <div className="border-r border-gray-300 p-4 text-sm text-gray-400">데이터 없음</div>
            <div className="border-r border-gray-300 p-4 text-sm text-gray-400">데이터 없음</div>
            <div className="border-r border-gray-300 p-4 text-sm text-gray-400">데이터 없음</div>
            <div className="p-4 text-sm text-gray-400">데이터 없음</div>
          </div>
        </div>
      </div>
    </div>
  );
}
