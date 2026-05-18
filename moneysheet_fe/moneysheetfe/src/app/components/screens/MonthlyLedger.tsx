import { useNavigate } from 'react-router';
import { Plus } from 'lucide-react';

export function MonthlyLedger() {
  const navigate = useNavigate();

  const calendarData = {
    monthLabel: "2026년 5월",
    calendar: [
      { "date": "2026-05-01", "dailyExpenseTotal": 12100, "status": "used" },
      { "date": "2026-05-02", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-03", "dailyExpenseTotal": 18700, "status": "used" },
      { "date": "2026-05-04", "dailyExpenseTotal": 5200, "status": "used" },
      { "date": "2026-05-05", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-06", "dailyExpenseTotal": 3000, "status": "used" },
      { "date": "2026-05-07", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-08", "dailyExpenseTotal": 14500, "status": "used" },
      { "date": "2026-05-09", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-10", "dailyExpenseTotal": 8900, "status": "used" },
      { "date": "2026-05-11", "dailyExpenseTotal": 7200, "status": "used" },
      { "date": "2026-05-12", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-13", "dailyExpenseTotal": 19800, "status": "used" },
      { "date": "2026-05-14", "dailyExpenseTotal": 56250, "status": "used" },
      { "date": "2026-05-15", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-16", "dailyExpenseTotal": 11300, "status": "used" },
      { "date": "2026-05-17", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-18", "dailyExpenseTotal": 8500, "status": "used" },
      { "date": "2026-05-19", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-20", "dailyExpenseTotal": 15600, "status": "used" },
      { "date": "2026-05-21", "dailyExpenseTotal": 9400, "status": "used" },
      { "date": "2026-05-22", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-23", "dailyExpenseTotal": 12800, "status": "used" },
      { "date": "2026-05-24", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-25", "dailyExpenseTotal": 18300, "status": "used" },
      { "date": "2026-05-26", "dailyExpenseTotal": 6700, "status": "used" },
      { "date": "2026-05-27", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-28", "dailyExpenseTotal": 14200, "status": "used" },
      { "date": "2026-05-29", "dailyExpenseTotal": 0, "status": "empty" },
      { "date": "2026-05-30", "dailyExpenseTotal": 10500, "status": "used" },
      { "date": "2026-05-31", "dailyExpenseTotal": 0, "status": "empty" }
    ]
  };

  const budgetData = {
    fixedExpenseTable: [
      { "title": "관리비", "amount": 100000 },
      { "title": "교통", "amount": 150000 },
      { "title": "건강", "amount": 21940 },
      { "title": "헤어", "amount": 35000 },
      { "title": "통신", "amount": 19000 }
    ],
    fixedExpenseTotal: 616940,
    foodBudgetTable: {
      weekdayCount: 21,
      saturdayCount: 5,
      sundayCount: 5,
      weekdayBudget: 15000,
      saturdayBudget: 5000,
      sundayBudget: 15000,
      total: 415000
    },
    otherExpenseTable: [
      { "date": "26.05.11", "title": "4월 서초값", "amount": 40000 },
      { "date": "26.05.13", "title": "캡더선물", "amount": 19800 },
      { "date": "25.05.14", "title": "뮤지컬", "amount": 56250 }
    ],
    otherExpenseTotal: 145509,
    baseSpendingTotal: 1031940,
    totalExpense: 1177449,
    incomeRecords: [
      { "date": "26.05.01", "title": "용돈", "amount": 570000 },
      { "date": "26.05.18", "title": "국취제", "amount": 600000 }
    ],
    incomeTotal: 1170000,
    actualSavingAmount: -7449,
    remarks: [
      { "title": "목양비잔액", "amount": 30000 }
    ]
  };

  // Create calendar grid (May 1, 2026 is Thursday)
  const firstDayOfWeek = 4;
  const emptyDays = Array(firstDayOfWeek).fill(null);
  const allDays = [...emptyDays, ...calendarData.calendar];

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">Monthly Ledger</h1>
        <div className="text-base text-gray-600">{calendarData.monthLabel}</div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-gray-300 rounded overflow-hidden mb-8">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-[#fef7e0] border-b border-gray-400">
          {weekdays.map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300 last:border-r-0">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7">
          {allDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square border-r border-b border-gray-300 bg-gray-50 last:border-r-0"
                />
              );
            }

            const date = new Date(day.date);
            const dayNum = date.getDate();
            const hasExpense = day.dailyExpenseTotal > 0;

            return (
              <div
                key={day.date}
                onClick={() => navigate(`/ledger/${day.date}`)}
                className="aspect-square border-r border-b border-gray-300 p-2 hover:bg-gray-50 cursor-pointer transition-colors last:border-r-0"
              >
                <div className="h-full flex flex-col">
                  <div className="text-sm font-medium text-gray-900 mb-1">{dayNum}</div>
                  {hasExpense && (
                    <div className="text-xs text-gray-600 tabular-nums">
                      {day.dailyExpenseTotal.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Budget Sheet Section */}
      <div className="bg-white border border-gray-400 rounded overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-px bg-gray-400">
          {/* Left Column */}
          <div className="bg-white p-6 space-y-6">
            {/* Fixed Expense Table */}
            <div className="border border-gray-400 rounded overflow-hidden">
              <div className="bg-[#fef7e0] border-b border-gray-400 p-2 text-sm font-medium">고정지출</div>
              <div className="divide-y divide-gray-300">
                {budgetData.fixedExpenseTable.map((item, i) => (
                  <div key={i} className="grid grid-cols-2 p-2 text-sm">
                    <div>{item.title}</div>
                    <div className="text-right tabular-nums">{item.amount.toLocaleString()}</div>
                  </div>
                ))}
                <div className="grid grid-cols-2 p-2 text-sm font-semibold bg-[#e8f5e9]">
                  <div>합계</div>
                  <div className="text-right tabular-nums text-[#34a853]">
                    {budgetData.fixedExpenseTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Food Budget Table */}
            <div className="border border-gray-400 rounded overflow-hidden">
              <div className="bg-[#fef7e0] border-b border-gray-400 p-2 text-sm font-medium">식비</div>
              <div className="divide-y divide-gray-300">
                <div className="grid grid-cols-3 p-2 text-xs">
                  <div>평일({budgetData.foodBudgetTable.weekdayCount}일)</div>
                  <div className="text-right tabular-nums">{budgetData.foodBudgetTable.weekdayBudget.toLocaleString()}</div>
                  <div className="text-right tabular-nums">
                    {(budgetData.foodBudgetTable.weekdayCount * budgetData.foodBudgetTable.weekdayBudget).toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-3 p-2 text-xs">
                  <div>토요일({budgetData.foodBudgetTable.saturdayCount}일)</div>
                  <div className="text-right tabular-nums">{budgetData.foodBudgetTable.saturdayBudget.toLocaleString()}</div>
                  <div className="text-right tabular-nums">
                    {(budgetData.foodBudgetTable.saturdayCount * budgetData.foodBudgetTable.saturdayBudget).toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-3 p-2 text-xs">
                  <div>일요일({budgetData.foodBudgetTable.sundayCount}일)</div>
                  <div className="text-right tabular-nums">{budgetData.foodBudgetTable.sundayBudget.toLocaleString()}</div>
                  <div className="text-right tabular-nums">
                    {(budgetData.foodBudgetTable.sundayCount * budgetData.foodBudgetTable.sundayBudget).toLocaleString()}
                  </div>
                </div>
                <div className="grid grid-cols-2 p-2 text-sm font-semibold bg-[#e8f5e9]">
                  <div>합계</div>
                  <div className="text-right tabular-nums text-[#34a853]">
                    {budgetData.foodBudgetTable.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Other Expense Table */}
            <div className="border border-gray-400 rounded overflow-hidden">
              <div className="bg-[#fef7e0] border-b border-gray-400 p-2 text-sm font-medium">기타지출</div>
              <div className="divide-y divide-gray-300">
                {budgetData.otherExpenseTable.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 p-2 text-xs">
                    <div>{item.date}</div>
                    <div>{item.title}</div>
                    <div className="text-right tabular-nums">{item.amount.toLocaleString()}</div>
                  </div>
                ))}
                <div className="grid grid-cols-2 p-2 text-sm font-semibold bg-[#e8f5e9]">
                  <div>합계</div>
                  <div className="text-right tabular-nums text-[#34a853]">
                    {budgetData.otherExpenseTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="bg-white p-6 space-y-6">
            {/* Summary Blocks */}
            <div className="space-y-3">
              <div className="border border-gray-400 rounded p-3">
                <div className="text-xs text-gray-600 mb-1">기본지출총액</div>
                <div className="text-lg font-bold tabular-nums">{budgetData.baseSpendingTotal.toLocaleString()}</div>
              </div>

              <div className="border border-gray-400 rounded p-3 bg-[#fff3cd]">
                <div className="text-xs text-gray-600 mb-1">총지출</div>
                <div className="text-lg font-bold tabular-nums">{budgetData.totalExpense.toLocaleString()}</div>
              </div>
            </div>

            {/* Monthly Income Table */}
            <div className="border border-gray-400 rounded overflow-hidden">
              <div className="bg-[#fef7e0] border-b border-gray-400 p-2 text-sm font-medium">월수입</div>
              <div className="divide-y divide-gray-300">
                {budgetData.incomeRecords.map((item, i) => (
                  <div key={i} className="grid grid-cols-3 p-2 text-xs">
                    <div>{item.date}</div>
                    <div>{item.title}</div>
                    <div className="text-right tabular-nums">{item.amount.toLocaleString()}</div>
                  </div>
                ))}
                <div className="grid grid-cols-2 p-2 text-sm font-semibold bg-[#e8f5e9]">
                  <div>합계</div>
                  <div className="text-right tabular-nums text-[#34a853]">
                    {budgetData.incomeTotal.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Actual Saving */}
            <div className={`border border-gray-400 rounded p-3 ${budgetData.actualSavingAmount < 0 ? 'bg-[#ffebee]' : 'bg-[#e8f5e9]'}`}>
              <div className="text-xs text-gray-600 mb-1">실제저축액</div>
              <div className={`text-xl font-bold tabular-nums ${budgetData.actualSavingAmount < 0 ? 'text-red-600' : 'text-[#34a853]'}`}>
                {budgetData.actualSavingAmount.toLocaleString()}
              </div>
            </div>

            {/* Remarks */}
            <div className="border border-gray-400 rounded overflow-hidden">
              <div className="bg-[#fef7e0] border-b border-gray-400 p-2 text-sm font-medium">비고</div>
              <div className="divide-y divide-gray-300">
                {budgetData.remarks.map((item, i) => (
                  <div key={i} className="grid grid-cols-2 p-2 text-xs">
                    <div>{item.title}</div>
                    <div className="text-right tabular-nums">{item.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
