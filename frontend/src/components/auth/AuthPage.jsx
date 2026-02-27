import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoginPage from '../../pages/LoginPage';
import RegisterPage from '../../pages/RegisterPage';

const AuthPage = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    setIsLogin(initialMode === 'login');
  }, [initialMode]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative"
      style={{
        backgroundImage: 'url(/assets/background-images/login-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 backdrop-blur-[3px] bg-white/10" />

      {/* Back to home */}
      <a
        href="/"
        className="relative z-10 mb-4 text-sm text-gray-700 font-medium flex items-center gap-1.5 transition-all bg-white px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:bg-gray-50"
      >
        ← Back to Home
      </a>

      <div
        className="relative w-full max-w-[900px] rounded-3xl shadow-2xl bg-white overflow-hidden"
        style={{ height: 620 }}
      >
        {/* ═══ LOGIN FORM — sits on LEFT half, visible when isLogin ═══ */}
        <div
          className="absolute top-0 bottom-0 w-full lg:w-1/2"
          style={{
            left: 0,
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? 'translateX(0)' : 'translateX(-60px)',
            pointerEvents: isLogin ? 'auto' : 'none',
            zIndex: isLogin ? 5 : 1,
          }}
        >
          <LoginPage onSwitchToRegister={() => setIsLogin(false)} />
        </div>

        {/* ═══ REGISTER FORM — sits on RIGHT half, visible when !isLogin ═══ */}
        <div
          className="absolute top-0 bottom-0 w-full lg:w-1/2"
          style={{
            right: 0,
            left: 'auto',
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            opacity: !isLogin ? 1 : 0,
            transform: !isLogin ? 'translateX(0)' : 'translateX(60px)',
            pointerEvents: !isLogin ? 'auto' : 'none',
            zIndex: !isLogin ? 5 : 1,
          }}
        >
          <RegisterPage onSwitchToLogin={() => setIsLogin(true)} />
        </div>

        {/* ═══ PURPLE PANEL — slides between right (login) and left (register) ═══ */}
        <div
          className="hidden lg:flex absolute top-0 bottom-0 flex-col items-center justify-center text-center px-10"
          style={{
            width: '50%',
            left: isLogin ? '50%' : '0%',
            background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 45%, #4f46e5 100%)',
            borderRadius: isLogin
              ? '120px 1.5rem 1.5rem 120px'
              : '1.5rem 120px 120px 1.5rem',
            transition: 'left 0.6s cubic-bezier(0.65, 0, 0.35, 1), border-radius 0.6s ease',
            zIndex: 10,
          }}
        >
          {/* Vedda logo */}
          <img src="/logo.png" alt="Vedda System" className="w-16 h-16 rounded-full object-cover mb-5 shadow-lg" />

          <h2
            className="text-3xl font-extrabold text-white mb-3 leading-tight"
            style={{ whiteSpace: 'pre-line' }}
          >
            {isLogin ? 'Hello,\nFriend!' : 'Welcome\nBack!'}
          </h2>

          <p className="text-purple-200 text-sm leading-relaxed mb-8 max-w-[240px]">
            {isLogin
              ? 'Join us in preserving the rich cultural heritage of Sri Lanka\'s indigenous Vedda community.'
              : 'Continue your journey exploring Vedda artifacts, language, and traditions.'}
          </p>

          <button
            onClick={() => setIsLogin((v) => !v)}
            className="px-12 py-3 border-2 border-white text-white rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-purple-700 transition-all duration-200"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
