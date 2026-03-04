import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const inputFocusStyle = {
  ...inputStyle,
  borderColor: "rgba(200,165,90,0.65)",
  boxShadow: "0 0 0 2px rgba(154,111,42,0.25)",
};

const RegisterPage = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.username.length < 3)
      return toast.error("Username must be at least 3 characters");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    if (formData.password !== formData.confirmPassword)
      return toast.error("Passwords do not match");

    setLoading(true);
    const result = await register(
      formData.username,
      formData.email,
      formData.password,
    );
    setLoading(false);
    if (result.success) {
      toast.success("Account created successfully!");
      navigate("/");
    } else {
      toast.error(result.message || "Registration failed. Please try again.");
    }
  };

  const getStyle = (name) => (focused === name ? inputFocusStyle : inputStyle);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full px-8 md:px-14 py-10">
      <h1
        className="text-3xl md:text-4xl font-extrabold mb-2"
        style={{ color: "#f5e9c8", fontFamily: "'Georgia', serif" }}
      >
        Create Account
      </h1>
      <p className="text-sm mb-6" style={{ color: "rgba(212,180,131,0.65)" }}>
        Join the Vedda Heritage Community
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          onFocus={() => setFocused("username")}
          onBlur={() => setFocused("")}
          placeholder="Username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers, and underscores only"
          className="auth-input"
          style={getStyle("username")}
        />
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
          style={getStyle("email")}
        />
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
          style={getStyle("password")}
        />
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          onFocus={() => setFocused("confirmPassword")}
          onBlur={() => setFocused("")}
          placeholder="Confirm Password"
          required
          minLength={6}
          className="auth-input"
          style={getStyle("confirmPassword")}
        />

        <div className="flex justify-center pt-2">
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
            {loading ? "Creating…" : "Sign Up"}
          </button>
        </div>
      </form>

      {/* Mobile only toggle */}
      <p
        className="mt-6 text-sm lg:hidden"
        style={{ color: "rgba(212,180,131,0.55)" }}
      >
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="font-semibold hover:underline"
          style={{ color: "#d4b483" }}
        >
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
