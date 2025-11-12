import { HiMenu, HiClock, HiUser, HiLogin, HiLogout, HiShieldCheck } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const Header = ({ onHistoryClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const h = useState;

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
    <header className="bg-blue-500 text-white shadow-sm z-50 fixed top-0 left-0 right-0">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button className="p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 mr-2">
              <HiMenu className="w-6 h-6" />
            </button>

            <Link to="/">
              <h1 className="text-xl font-semibold cursor-pointer hover:text-blue-100 transition-colors">
                Vedda System
              </h1>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && onHistoryClick && (
              <button
                className="p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                onClick={onHistoryClick}
                title="Translation History"
              >
                <HiClock className="w-6 h-6" />
              </button>
            )}

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                    title="Admin Dashboard"
                  >
                    <HiShieldCheck className="w-5 h-5" />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  title="Profile"
                >
                  <HiUser className="w-5 h-5" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                  title="Logout"
                >
                  <HiLogout className="w-5 h-5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                title="Login"
              >
                <HiLogin className="w-5 h-5" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
    
    {/* Logout Confirmation Modal */}
    {showLogoutConfirm && (
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl p-8 shadow-2xl transform transition-all duration-200 scale-100 max-w-md w-full mx-4">
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Confirm Logout</h3>
              <p className="text-gray-600">Are you sure you want to logout from your account?</p>
            </div>
            
            <div className="flex space-x-4 w-full">
              <button
                onClick={cancelLogout}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default Header;
