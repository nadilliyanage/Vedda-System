import {
  HiMenu,
  HiClock,
  HiUser,
  HiLogin,
  HiLogout,
  HiShieldCheck,
} from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

/* ── Matching the warm earthy forest theme of HomePage ── */
const Header = ({ onHistoryClick }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => setShowLogoutConfirm(true);

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const cancelLogout = () => setShowLogoutConfirm(false);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) setShowLogoutConfirm(false);
  };

  const navBtnBase = {
    display: "flex",
    alignItems: "center",
    gap: "0.45rem",
    padding: "0.4rem 0.85rem",
    borderRadius: "9px",
    fontSize: "0.88rem",
    fontWeight: "600",
    fontFamily: "system-ui, sans-serif",
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "background 0.2s, border-color 0.2s",
    textDecoration: "none",
    color: "rgba(255,248,235,0.92)",
    background: "rgba(255,255,255,0.08)",
  };

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          /* Frosted glass over the forest background */
          background: "rgba(28, 20, 8, 0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(200,170,100,0.18)",
          boxShadow: "0 2px 20px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 1.25rem" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "60px",
            }}
          >
            {/* ── Logo / Brand ── */}
            <Link
              to="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                textDecoration: "none",
              }}
            >
              <img
                src="/logo.png"
                alt="Vedda Heritage"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(200,165,90,0.55)",
                  boxShadow: "0 0 0 3px rgba(200,165,90,0.15)",
                }}
              />
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: "700",
                  fontFamily: "'Georgia', serif",
                  color: "rgba(255,248,230,0.95)",
                  letterSpacing: "0.01em",
                }}
              >
                Vedda Heritage
              </span>
            </Link>

            {/* ── Right-side actions ── */}
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
            >
              {/* History (translator page only) */}
              {isAuthenticated && onHistoryClick && (
                <button
                  onClick={onHistoryClick}
                  title="Translation History"
                  style={{
                    ...navBtnBase,
                    background: "transparent",
                    border: "1px solid rgba(200,165,90,0.25)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(200,165,90,0.15)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <HiClock style={{ width: "18px", height: "18px" }} />
                </button>
              )}

              {isAuthenticated ? (
                <>
                  {/* Dashboard (admin/elder) */}
                  {(user?.role === "admin" || user?.role === "elder") && (
                    <Link
                      to="/admin"
                      title="Dashboard"
                      style={navBtnBase}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(200,165,90,0.18)";
                        e.currentTarget.style.borderColor =
                          "rgba(200,165,90,0.35)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.08)";
                        e.currentTarget.style.borderColor = "transparent";
                      }}
                    >
                      <HiShieldCheck
                        style={{
                          width: "17px",
                          height: "17px",
                          color: "#c9a84c",
                        }}
                      />
                      <span className="hidden sm:inline">Dashboard</span>
                    </Link>
                  )}

                  {/* Profile */}
                  <Link
                    to="/profile"
                    title="Profile"
                    style={navBtnBase}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(200,165,90,0.18)";
                      e.currentTarget.style.borderColor =
                        "rgba(200,165,90,0.35)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)";
                      e.currentTarget.style.borderColor = "transparent";
                    }}
                  >
                    <HiUser style={{ width: "17px", height: "17px" }} />
                    <span style={{ fontSize: "0.88rem" }}>
                      {user?.username}
                    </span>
                  </Link>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    style={{
                      ...navBtnBase,
                      background: "rgba(180, 40, 30, 0.70)",
                      border: "1px solid rgba(220,80,60,0.40)",
                      color: "#fff",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(200,50,40,0.85)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(180,40,30,0.70)")
                    }
                  >
                    <HiLogout style={{ width: "17px", height: "17px" }} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  title="Login"
                  style={{
                    ...navBtnBase,
                    background: "rgba(154,111,42,0.75)",
                    border: "1px solid rgba(200,165,90,0.45)",
                    color: "#fff",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "rgba(154,111,42,0.95)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "rgba(154,111,42,0.75)")
                  }
                >
                  <HiLogin style={{ width: "17px", height: "17px" }} />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Logout Confirmation Modal ── */}
      {showLogoutConfirm && (
        <div
          onClick={handleBackdropClick}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(10,8,4,0.60)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "18px",
              padding: "2.5rem 2rem",
              maxWidth: "400px",
              width: "100%",
              boxShadow: "0 24px 64px rgba(0,0,0,0.30)",
              textAlign: "center",
            }}
          >
            {/* Warning icon */}
            <div
              style={{
                width: "60px",
                height: "60px",
                background: "rgba(251,191,36,0.15)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg
                style={{ width: "28px", height: "28px", color: "#b45309" }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: "700",
                color: "#1c1409",
                marginBottom: "0.5rem",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Confirm Logout
            </h3>
            <p
              style={{
                color: "#6b7280",
                fontSize: "0.95rem",
                marginBottom: "2rem",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Are you sure you want to logout from your account?
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={cancelLogout}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  background: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#e5e7eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "600",
                  fontSize: "0.92rem",
                  cursor: "pointer",
                  fontFamily: "system-ui, sans-serif",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#b91c1c")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#dc2626")
                }
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
