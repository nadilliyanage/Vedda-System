import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const LoginPage = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      toast.success('Login successful!');
      navigate('/');
    } else {
      toast.error(result.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 md:px-14 py-10">
     
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Sign In</h1>
      <p className="text-gray-400 text-sm mb-8">Access the Vedda Heritage Platform</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            required
            className="w-full px-5 py-3.5 bg-gray-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            required
            minLength={6}
            className="w-full px-5 py-3.5 bg-gray-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
          />
        </div>

        <p className="text-center text-xs text-gray-400 cursor-pointer hover:text-purple-600 transition-colors py-1">
          Forget Your Password?
        </p>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={loading}
            className="px-14 py-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold uppercase tracking-[0.15em] rounded-full shadow-lg shadow-purple-200 hover:shadow-purple-300 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </form>

      {/* Mobile only toggle */}
      <p className="mt-8 text-sm text-gray-400 lg:hidden">
        Don&apos;t have an account?{' '}
        <button onClick={onSwitchToRegister} className="text-purple-600 font-semibold hover:underline">
          Sign Up
        </button>
      </p>
    </div>
  );
};

LoginPage.propTypes = {
  onSwitchToRegister: PropTypes.func,
};

export default LoginPage;
