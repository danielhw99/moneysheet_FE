import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogIn } from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    id: "",
    password: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="text-2xl font-semibold text-[#34a853]">
            MoneySheet
          </Link>
          <p className="mt-2 text-sm text-gray-600">Login to your account</p>
        </div>

        <div className="rounded-lg border border-gray-300 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full rounded border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#34a853]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#34a853]"
                required
              />
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded bg-[#34a853] py-3 font-medium text-white transition-colors hover:bg-[#2d8e47]"
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
              <Link to="/signup" className="text-[#0066cc] hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
