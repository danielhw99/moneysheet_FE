import { Link, useLocation, useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';

export function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home' || location.pathname.startsWith('/ledger');
    if (path === '/budget') return location.pathname === '/budget';
    if (path === '/fixed-expenses') return location.pathname === '/fixed-expenses';
    if (path === '/report') return location.pathname === '/report';
    return false;
  };

  const handleLogout = () => {
    navigate('/');
  };

  const navItems = [
    { path: '/home', label: 'Ledger' },
    { path: '/budget', label: 'Budget' },
    { path: '/fixed-expenses', label: 'Fixed Expenses' },
    { path: '/report', label: 'Report' },
  ];

  return (
    <nav className="bg-white border-b border-gray-300 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/home" className="text-lg font-semibold text-[#34a853]">
            MoneySheet
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm rounded transition-colors ${
                  isActive(item.path)
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden mt-3 flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
              isActive(item.path)
                ? 'bg-gray-100 text-gray-900 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
