import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { UserPlus } from 'lucide-react';

export function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: '',
    password: '',
    passwordConfirm: '',
    nickname: ''
  });
  const [errors, setErrors] = useState({
    id: '',
    password: '',
    passwordConfirm: '',
    nickname: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = {
      id: formData.id.length < 3 ? 'ID must be at least 3 characters' : '',
      password: formData.password.length < 6 ? 'Password must be at least 6 characters' : '',
      passwordConfirm: formData.password !== formData.passwordConfirm ? 'Passwords do not match' : '',
      nickname: formData.nickname.length < 2 ? 'Nickname must be at least 2 characters' : ''
    };

    setErrors(newErrors);

    if (!Object.values(newErrors).some(e => e)) {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-semibold text-[#34a853]">
            MoneySheet
          </Link>
          <p className="text-sm text-gray-600 mt-2">Create your account</p>
        </div>

        {/* Sign Up Form */}
        <div className="bg-white border border-gray-300 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                placeholder="Choose an ID"
                className={`w-full p-3 border ${errors.id ? 'border-red-300' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-transparent`}
                required
              />
              {errors.id && (
                <div className="text-xs text-red-600 mt-1">{errors.id}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Nickname</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Enter your nickname"
                className={`w-full p-3 border ${errors.nickname ? 'border-red-300' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-transparent`}
                required
              />
              {errors.nickname && (
                <div className="text-xs text-red-600 mt-1">{errors.nickname}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                className={`w-full p-3 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-transparent`}
                required
              />
              {errors.password && (
                <div className="text-xs text-red-600 mt-1">{errors.password}</div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <input
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                placeholder="Confirm your password"
                className={`w-full p-3 border ${errors.passwordConfirm ? 'border-red-300' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-[#34a853] focus:border-transparent`}
                required
              />
              {errors.passwordConfirm && (
                <div className="text-xs text-red-600 mt-1">{errors.passwordConfirm}</div>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#34a853] text-white rounded font-medium hover:bg-[#2d8e47] transition-colors"
            >
              <UserPlus size={18} />
              <span>Sign Up</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0066cc] hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
