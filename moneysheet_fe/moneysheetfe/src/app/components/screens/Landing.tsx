import { Link } from 'react-router';
import { Calendar, TrendingUp, PieChart, Settings } from 'lucide-react';

export function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-semibold text-[#34a853]">MoneySheet</div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm bg-[#34a853] text-white rounded hover:bg-[#2d8e47] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
          Your Personal Finance Spreadsheet
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Manage your monthly ledger, track daily spending, and control your budget with a clean spreadsheet-inspired interface.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="px-6 py-3 bg-[#34a853] text-white rounded font-medium hover:bg-[#2d8e47] transition-colors"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded font-medium hover:bg-gray-50 transition-colors"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#34a853] bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="text-[#34a853]" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Monthly Ledger</h3>
            <p className="text-sm text-gray-600">
              View your entire month at a glance with a calendar-style ledger showing daily expenses and balances.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#0066cc] bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="text-[#0066cc]" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Food Budget</h3>
            <p className="text-sm text-gray-600">
              Track your food expenses separately from other spending to stay within your budget goals.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#ea4335] bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <Settings className="text-[#ea4335]" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fixed Expenses</h3>
            <p className="text-sm text-gray-600">
              Manage recurring monthly expenses like rent, subscriptions, and utilities with ease.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="w-12 h-12 bg-[#fbbc04] bg-opacity-10 rounded-lg flex items-center justify-center mb-4">
              <PieChart className="text-[#fbbc04]" size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Monthly Report</h3>
            <p className="text-sm text-gray-600">
              Understand your spending patterns with clear monthly reports and savings calculations.
            </p>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Spreadsheet-Style Interface</h2>
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-sm">
          <div className="grid grid-cols-12 gap-px bg-gray-300">
            <div className="col-span-2 bg-gray-100 p-3 text-xs font-medium text-gray-700">Date</div>
            <div className="col-span-3 bg-gray-100 p-3 text-xs font-medium text-gray-700">Category</div>
            <div className="col-span-4 bg-gray-100 p-3 text-xs font-medium text-gray-700">Description</div>
            <div className="col-span-3 bg-gray-100 p-3 text-xs font-medium text-gray-700 text-right">Amount</div>

            <div className="col-span-2 bg-white p-3 text-xs">05.01</div>
            <div className="col-span-3 bg-white p-3 text-xs">식비</div>
            <div className="col-span-4 bg-white p-3 text-xs">점심</div>
            <div className="col-span-3 bg-white p-3 text-xs text-right tabular-nums">₩9,000</div>

            <div className="col-span-2 bg-white p-3 text-xs">05.01</div>
            <div className="col-span-3 bg-white p-3 text-xs">기타</div>
            <div className="col-span-4 bg-white p-3 text-xs">편의점</div>
            <div className="col-span-3 bg-white p-3 text-xs text-right tabular-nums">₩4,500</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-gray-600">
          <p>© 2026 MoneySheet. A practical personal finance tool.</p>
        </div>
      </footer>
    </div>
  );
}
