import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { LogIn } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.id === 'test' && formData.password === 'test123') {
      navigate('/home');
    } else {
      setError('Invalid credentials. Please check the helper text below.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-semibold text-[#34a853]">
            MoneySheet
          </Link>
          <p className="text-sm text-gray-600 mt-2">Login to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-300 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="Enter your ID"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#34a853] text-white rounded font-medium hover:bg-[#2d8e47] transition-colors"
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#0066cc] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Helper Section */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <div className="font-medium text-yellow-900 mb-1">Test Credentials</div>
          <div className="text-yellow-800 space-y-0.5">
            <div>ID: <code className="bg-yellow-100 px-1 rounded">test</code></div>
            <div>Password: <code className="bg-yellow-100 px-1 rounded">test123</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
