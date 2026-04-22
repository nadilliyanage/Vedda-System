import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoginPage from "../../pages/LoginPage";
import RegisterPage from "../../pages/RegisterPage";

const AuthPage = ({ initialMode = "login" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isLogin, setIsLogin] = useState(initialMode === "login");

  useEffect(() => {
    // If already authenticated, redirect to intended destination or home
    if (isAuthenticated) {
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, location.state]);

  useEffect(() => {
    setIsLogin(initialMode === "login");
  }, [initialMode]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative"
      style={{
        backgroundImage: "url(/assets/background-images/background-1.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(8,5,1,0.58)", backdropFilter: "blur(2px)" }}
      />

      {/* Back to home */}
      <a
        href="/"
        className="relative z-10 mb-4 text-sm font-medium flex items-center gap-1.5 transition-all px-5 py-2.5 rounded-full"
        style={{
          background: "rgba(255,248,230,0.10)",
          border: "1px solid rgba(200,165,90,0.35)",
          color: "rgba(245,233,200,0.88)",
          backdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(200,165,90,0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,248,230,0.10)";
        }}
      >
        ← Back to Home
      </a>

      <div
        className="relative w-full max-w-[900px] rounded-3xl overflow-hidden"
        style={{
          height: 620,
          background: "rgba(18,12,3,0.88)",
          border: "1px solid rgba(200,165,90,0.22)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.70)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* ═══ LOGIN FORM ═══ */}
        <div
          className="absolute top-0 bottom-0 w-full lg:w-1/2"
          style={{
            left: 0,
            transition: "opacity 0.6s ease, transform 0.6s ease",
            opacity: isLogin ? 1 : 0,
            transform: isLogin ? "translateX(0)" : "translateX(-60px)",
            pointerEvents: isLogin ? "auto" : "none",
            zIndex: isLogin ? 5 : 1,
          }}
        >
          <LoginPage onSwitchToRegister={() => setIsLogin(false)} />
        </div>

        {/* ═══ REGISTER FORM ═══ */}
        <div
          className="absolute top-0 bottom-0 w-full lg:w-1/2"
          style={{
            right: 0,
            left: "auto",
            transition: "opacity 0.6s ease, transform 0.6s ease",
            opacity: !isLogin ? 1 : 0,
            transform: !isLogin ? "translateX(0)" : "translateX(60px)",
            pointerEvents: !isLogin ? "auto" : "none",
            zIndex: !isLogin ? 5 : 1,
          }}
        >
          <RegisterPage onSwitchToLogin={() => setIsLogin(true)} />
        </div>

        {/* ═══ GOLD EARTHY PANEL ═══ */}
        <div
          className="hidden lg:flex absolute top-0 bottom-0 flex-col items-center justify-center text-center px-10"
          style={{
            width: "50%",
            left: isLogin ? "50%" : "0%",
            background:
              "linear-gradient(135deg, #5c3a0a 0%, #7a4f15 45%, #9a6828 100%)",
            borderRadius: isLogin
              ? "120px 1.5rem 1.5rem 120px"
              : "1.5rem 120px 120px 1.5rem",
            transition:
              "left 0.6s cubic-bezier(0.65, 0, 0.35, 1), border-radius 0.6s ease",
            zIndex: 10,
            boxShadow: isLogin
              ? "-8px 0 40px rgba(0,0,0,0.40)"
              : "8px 0 40px rgba(0,0,0,0.40)",
            borderLeft: isLogin ? "1px solid rgba(200,165,90,0.30)" : "none",
            borderRight: !isLogin ? "1px solid rgba(200,165,90,0.30)" : "none",
          }}
        >
          <img
            src="/logo.png"
            alt="Vedda Heritage"
            className="w-16 h-16 rounded-full object-cover mb-5 shadow-lg"
            style={{ border: "2px solid rgba(245,233,200,0.35)" }}
          />

          <h2
            className="text-3xl font-extrabold mb-3 leading-tight"
            style={{
              whiteSpace: "pre-line",
              color: "#f5e9c8",
              fontFamily: "'Georgia', serif",
            }}
          >
            {isLogin ? "Hello,\nFriend!" : "Welcome\nBack!"}
          </h2>

          <p
            className="text-sm leading-relaxed mb-8 max-w-[240px]"
            style={{ color: "rgba(212,180,131,0.80)" }}
          >
            {isLogin
              ? "Join us in preserving the rich cultural heritage of Sri Lanka's indigenous Vedda community."
              : "Continue your journey exploring Vedda artifacts, language, and traditions."}
          </p>

          <button
            onClick={() => setIsLogin((v) => !v)}
            className="px-12 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-200"
            style={{
              border: "1.5px solid rgba(245,233,200,0.55)",
              color: "#f5e9c8",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(245,233,200,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
