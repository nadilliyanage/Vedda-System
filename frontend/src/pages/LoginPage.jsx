import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import PropTypes from "prop-types";

const inputStyle = {
  width: "100%",
  padding: "0.75rem 1rem",
  background: "rgba(0,0,0,0.32)",
  border: "1px solid rgba(200,165,90,0.30)",
  borderRadius: "0.5rem",
  color: "rgba(245,233,200,0.92)",
  fontSize: "0.875rem",
  outline: "none",
  transition: "border-color 200ms, box-shadow 200ms",
};

const LoginPage = ({ onSwitchToRegister }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(formData.email, formData.password);
    setLoading(false);
    if (result.success) {
      toast.success("Login successful!");
      // Check if there's a redirect destination in location state
      const redirectTo = location.state?.from || "/";
      navigate(redirectTo);
    } else {
      toast.error(result.message || "Login failed. Please try again.");
    }
  };

  const getFocusStyle = (name) =>
    focused === name
      ? {
          ...inputStyle,
          borderColor: "rgba(200,165,90,0.65)",
          boxShadow: "0 0 0 2px rgba(154,111,42,0.25)",
        }
      : inputStyle;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 md:px-14 py-10">
      <h1
        className="text-3xl md:text-4xl font-extrabold mb-2"
        style={{ color: "#f5e9c8", fontFamily: "'Georgia', serif" }}
      >
        Sign In
      </h1>
      <p className="text-sm mb-8" style={{ color: "rgba(212,180,131,0.65)" }}>
        Access the Vedda Heritage Platform
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onFocus={() => setFocused("email")}
            onBlur={() => setFocused("")}
            placeholder="Email"
            required
            className="auth-input"
            style={getFocusStyle("email")}
          />
        </div>

        <div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            onFocus={() => setFocused("password")}
            onBlur={() => setFocused("")}
            placeholder="Password"
            required
            minLength={6}
            className="auth-input"
            style={getFocusStyle("password")}
          />
        </div>

        <p
          className="text-center text-xs cursor-pointer py-1 transition-colors"
          style={{ color: "rgba(212,180,131,0.55)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#d4b483";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(212,180,131,0.55)";
          }}
        >
          Forget Your Password?
        </p>

        <div className="flex justify-center pt-1">
          <button
            type="submit"
            disabled={loading}
            className="px-14 py-3 rounded-full text-xs font-bold uppercase tracking-[0.15em] transition-all active:scale-95 disabled:opacity-50"
            style={{
              background:
                "linear-gradient(135deg, rgba(154,111,42,0.92) 0%, rgba(185,138,55,0.95) 100%)",
              color: "rgba(255,248,230,0.96)",
              border: "1px solid rgba(212,175,90,0.45)",
              boxShadow: "0 4px 18px rgba(0,0,0,0.35)",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </form>

      {/* Mobile only toggle */}
      <p
        className="mt-8 text-sm lg:hidden"
        style={{ color: "rgba(212,180,131,0.55)" }}
      >
        Don&apos;t have an account?{" "}
        <button
          onClick={onSwitchToRegister}
          className="font-semibold hover:underline"
          style={{ color: "#d4b483" }}
        >
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
