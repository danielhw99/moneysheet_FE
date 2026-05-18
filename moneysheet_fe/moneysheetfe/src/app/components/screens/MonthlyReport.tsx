import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export function MonthlyReport() {
  const data = {
    monthLabel: "2026년 5월",
    incomeTotal: 1170000,
    totalExpense: 1177449,
    fixedExpenseTotal: 616940,
    foodExpenseTotal: 415000,
    otherExpenseTotal: 145509,
    actualSavingAmount: -7449
  };

  const chartData = [
    { name: '식비', value: data.foodExpenseTotal, color: '#4285f4' },
    { name: '고정', value: data.fixedExpenseTotal, color: '#ea4335' },
    { name: '기타', value: data.otherExpenseTotal, color: '#fbbc04' }
  ];

  const renderCustomLabel = ({ name, percent }: { name: string; percent: number }) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">월간 리포트</h1>
        <div className="text-base text-gray-600">{data.monthLabel}</div>
      </div>

      <div className="max-w-3xl">
        {/* Summary Grid */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">월 수입</div>
              <div className="text-lg font-semibold tabular-nums">₩{data.incomeTotal.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">총 지출</div>
              <div className="text-lg font-semibold tabular-nums">₩{data.totalExpense.toLocaleString()}</div>
            </div>
            <div className="col-span-2 pt-3 border-t border-gray-300">
              <div className="text-xs text-gray-600 mb-1">실제 저축액</div>
              <div className={`text-2xl font-bold tabular-nums ${data.actualSavingAmount >= 0 ? 'text-[#34a853]' : 'text-red-600'}`}>
                ₩{data.actualSavingAmount.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white border border-gray-300 rounded p-4 mb-4">
          <h3 className="text-sm font-medium mb-3">지출 구성</h3>

          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#4285f4' }}></div>
                <span className="text-sm">식비</span>
              </div>
              <div className="text-sm font-semibold tabular-nums">₩{data.foodExpenseTotal.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ea4335' }}></div>
                <span className="text-sm">고정 지출</span>
              </div>
              <div className="text-sm font-semibold tabular-nums">₩{data.fixedExpenseTotal.toLocaleString()}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: '#fbbc04' }}></div>
                <span className="text-sm">기타 지출</span>
              </div>
              <div className="text-sm font-semibold tabular-nums">₩{data.otherExpenseTotal.toLocaleString()}</div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomLabel}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Percentage Breakdown */}
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <h3 className="text-sm font-medium mb-3">지출 비율</h3>
          <div className="space-y-2">
            {chartData.map((item) => {
              const percentage = ((item.value / data.totalExpense) * 100).toFixed(1);
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="font-medium tabular-nums">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.color
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Saving Rate */}
        <div className={`mt-4 p-4 border rounded ${data.actualSavingAmount >= 0 ? 'bg-[#34a853] bg-opacity-10 border-[#34a853]' : 'bg-red-50 border-red-300'}`}>
          <div className={`text-xs mb-1 ${data.actualSavingAmount >= 0 ? 'text-[#34a853]' : 'text-red-600'}`}>저축률</div>
          <div className={`text-2xl font-bold tabular-nums ${data.actualSavingAmount >= 0 ? 'text-[#34a853]' : 'text-red-600'}`}>
            {((data.actualSavingAmount / data.incomeTotal) * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}
