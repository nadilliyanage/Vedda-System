import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const RegisterPage = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.username.length < 3) return toast.error('Username must be at least 3 characters');
    if (formData.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    const result = await register(formData.username, formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      toast.success('Account created successfully!');
      navigate('/');
    } else {
      toast.error(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 md:px-14 py-10">
      <img src="/logo.png" alt="Vedda System" className="w-14 h-14 rounded-full object-cover mb-4 shadow-md" />
      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Create Account</h1>
      <p className="text-gray-400 text-sm mb-8">Join the Vedda Heritage Community</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers, and underscores only"
          className="w-full px-5 py-3.5 bg-gray-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
        />

        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
          required
          className="w-full px-5 py-3.5 bg-gray-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
        />

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

        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm Password"
          required
          minLength={6}
          className="w-full px-5 py-3.5 bg-gray-100 rounded-lg text-sm text-gray-800 placeholder-gray-400 border-none outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
        />

        <div className="flex justify-center pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-14 py-3 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold uppercase tracking-[0.15em] rounded-full shadow-lg shadow-purple-200 hover:shadow-purple-300 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Sign Up'}
          </button>
        </div>
      </form>

      {/* Mobile only toggle */}
      <p className="mt-8 text-sm text-gray-400 lg:hidden">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-purple-600 font-semibold hover:underline">
          Sign In
        </button>
      </p>
    </div>
  );
};

RegisterPage.propTypes = {
  onSwitchToLogin: PropTypes.func,
};

export default RegisterPage;
