import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { TopNav } from './components/TopNav';
import { Landing } from './components/screens/Landing';
import { Login } from './components/screens/Login';
import { SignUp } from './components/screens/SignUp';
import { MonthlyLedger } from './components/screens/MonthlyLedger';
import { DailySheet } from './components/screens/DailySheet';
import { ExpenseForm } from './components/screens/ExpenseForm';
import { BudgetSettings } from './components/screens/BudgetSettings';
import { FixedExpenseManagement } from './components/screens/FixedExpenseManagement';
import { MonthlyReport } from './components/screens/MonthlyReport';
import { MockFinanceProvider } from './mock/mockFinance';

export default function App() {
  return (
    <MockFinanceProvider>
      <BrowserRouter>
        <div className="flex flex-col h-screen bg-white">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/*" element={
              <>
                <TopNav />
                <div className="flex-1 overflow-auto">
                  <Routes>
                    <Route path="/home" element={<MonthlyLedger />} />
                    <Route path="/ledger" element={<MonthlyLedger />} />
                    <Route path="/ledger/:date" element={<DailySheet />} />
                    <Route path="/ledger/:date/expense/new" element={<ExpenseForm mode="create" />} />
                    <Route path="/ledger/:date/expense/:id" element={<ExpenseForm mode="edit" />} />
                    <Route path="/budget" element={<BudgetSettings />} />
                    <Route path="/fixed-expenses" element={<FixedExpenseManagement />} />
                    <Route path="/report" element={<MonthlyReport />} />
                  </Routes>
                </div>
              </>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </MockFinanceProvider>
  );
}
