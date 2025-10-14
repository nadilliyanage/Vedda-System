import { HiMenu, HiClock, HiUser, HiLogin, HiLogout } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Header = ({ onHistoryClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-500 text-white shadow-sm">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button className="p-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 mr-2">
              <HiMenu className="w-6 h-6" />
            </button>

            <Link to="/">
              <h1 className="text-xl font-semibold cursor-pointer hover:text-blue-100 transition-colors">
                Vedda Translate
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
  );
};

export default Header;
