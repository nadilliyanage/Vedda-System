import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getMyFeedback } from "../services/feedbackService";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!user) return;
      try {
        const data = await getMyFeedback({ limit: 50 });
        if (data.success) {
          setFeedbacks(data.feedback);
        }
      } catch (error) {
        console.error("Failed to fetch feedback history:", error);
      } finally {
        setLoadingFeedbacks(false);
      }
    };
    fetchFeedbacks();
  }, [user]);

  if (!user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-4 px-8 relative"
        style={{
          backgroundImage: "url(/assets/background-images/background-1.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "rgba(8,5,1,0.58)" }}
        />
        <div
          className="relative z-10 rounded-xl p-8"
          style={{
            background: "rgba(20,14,4,0.82)",
            border: "1px solid rgba(200,165,90,0.22)",
            backdropFilter: "blur(18px)",
          }}
        >
          <p style={{ color: "rgba(212,180,131,0.70)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span
            className="px-2.5 py-1 text-xs font-semibold rounded-full"
            style={{
              background: "rgba(22,101,52,0.35)",
              color: "#6ee7a0",
              border: "1px solid rgba(74,222,128,0.25)",
            }}
          >
            Approved
          </span>
        );
      case "rejected":
        return (
          <span
            className="px-2.5 py-1 text-xs font-semibold rounded-full"
            style={{
              background: "rgba(127,29,29,0.35)",
              color: "#fca5a5",
              border: "1px solid rgba(248,113,113,0.25)",
            }}
          >
            Rejected
          </span>
        );
      default:
        return (
          <span
            className="px-2.5 py-1 text-xs font-semibold rounded-full"
            style={{
              background: "rgba(113,63,18,0.35)",
              color: "#fcd34d",
              border: "1px solid rgba(251,191,36,0.25)",
            }}
          >
            Pending
          </span>
        );
    }
  };

  const getFeedbackTypeLabel = (type) => {
    switch (type) {
      case "edit_suggestion":
        return "Edit Suggestion";
      case "new_info":
        return "New Information";
      case "correction":
        return "Correction";
      default:
        return "General Feedback";
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: "url(/assets/background-images/background-1.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "rgba(8,5,1,0.58)" }}
      />

      {/* ── Back button ── */}
      <div className="relative z-20 px-4 sm:px-8 pt-[80px] max-w-4xl mx-auto">
        <button
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "rgba(255,248,230,0.90)",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(200,165,90,0.25)",
            borderRadius: "9px",
            padding: "0.4rem 0.9rem",
            fontFamily: "system-ui, sans-serif",
            fontWeight: "600",
            fontSize: "0.88rem",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(200,165,90,0.18)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
          }
        >
          &#8592; Back to Home
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 px-4 sm:px-8 py-6 mt">
        {/* User Info Card */}
        <div
          className="rounded-xl p-8"
          style={{
            background: "rgba(20,14,4,0.80)",
            border: "1px solid rgba(200,165,90,0.22)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.50)",
          }}
        >
          <div className="text-center mb-6">
            <h1
              className="text-3xl font-bold mb-2"
              style={{ color: "#f5e9c8", fontFamily: "'Georgia', serif" }}
            >
              My Profile
            </h1>
            <p style={{ color: "rgba(212,180,131,0.65)" }}>
              Your account information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div
              className="pb-3"
              style={{ borderBottom: "1px solid rgba(200,165,90,0.18)" }}
            >
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "rgba(200,165,90,0.55)" }}
              >
                Username
              </label>
              <p
                className="text-lg"
                style={{ color: "rgba(245,233,200,0.90)" }}
              >
                {user.username}
              </p>
            </div>

            <div
              className="pb-3"
              style={{ borderBottom: "1px solid rgba(200,165,90,0.18)" }}
            >
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "rgba(200,165,90,0.55)" }}
              >
                Email
              </label>
              <p
                className="text-lg"
                style={{ color: "rgba(245,233,200,0.90)" }}
              >
                {user.email}
              </p>
            </div>

            <div
              className="pb-3"
              style={{ borderBottom: "1px solid rgba(200,165,90,0.18)" }}
            >
              <label
                className="block text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: "rgba(200,165,90,0.55)" }}
              >
                Member Since
              </label>
              <p
                className="text-lg"
                style={{ color: "rgba(245,233,200,0.90)" }}
              >
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "N/A"}
              </p>
            </div>

            {user.lastLogin && (
              <div
                className="pb-3"
                style={{ borderBottom: "1px solid rgba(200,165,90,0.18)" }}
              >
                <label
                  className="block text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: "rgba(200,165,90,0.55)" }}
                >
                  Last Login
                </label>
                <p
                  className="text-lg"
                  style={{ color: "rgba(245,233,200,0.90)" }}
                >
                  {new Date(user.lastLogin).toLocaleString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* My Contributions Card */}
        <div
          className="rounded-xl p-8"
          style={{
            background: "rgba(20,14,4,0.80)",
            border: "1px solid rgba(200,165,90,0.22)",
            backdropFilter: "blur(18px)",
            boxShadow: "0 12px 48px rgba(0,0,0,0.50)",
          }}
        >
          <div
            className="mb-6 pb-4"
            style={{ borderBottom: "1px solid rgba(200,165,90,0.18)" }}
          >
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "#f5e9c8", fontFamily: "'Georgia', serif" }}
            >
              My Contributions
            </h2>
            <p style={{ color: "rgba(212,180,131,0.65)" }}>
              Track the feedback and edit suggestions you&apos;ve submitted for
              artifacts.
            </p>
          </div>

          {loadingFeedbacks ? (
            <div
              className="text-center py-8"
              style={{ color: "rgba(212,180,131,0.55)" }}
            >
              Loading your contributions...
            </div>
          ) : feedbacks.length > 0 ? (
            <div className="space-y-4">
              {feedbacks.map((item) => (
                <div
                  key={item._id}
                  className="rounded-lg p-5 transition-shadow"
                  style={{
                    background: "rgba(0,0,0,0.28)",
                    border: "1px solid rgba(200,165,90,0.15)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.border =
                      "1px solid rgba(200,165,90,0.30)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.border =
                      "1px solid rgba(200,165,90,0.15)";
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div>
                      <h3
                        className="font-semibold text-lg"
                        style={{ color: "rgba(245,233,200,0.92)" }}
                      >
                        {item.artifactId?.name || "Unknown Artifact"}
                      </h3>
                      <p
                        className="text-sm"
                        style={{ color: "rgba(212,180,131,0.55)" }}
                      >
                        Submitted on{" "}
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          background: "rgba(200,165,90,0.15)",
                          color: "rgba(212,180,131,0.80)",
                          border: "1px solid rgba(200,165,90,0.22)",
                        }}
                      >
                        {getFeedbackTypeLabel(item.feedbackType)}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  {/* Preview of suggested changes */}
                  <div
                    className="text-sm p-3 rounded"
                    style={{
                      background: "rgba(0,0,0,0.22)",
                      border: "1px solid rgba(200,165,90,0.12)",
                      color: "rgba(245,233,200,0.78)",
                    }}
                  >
                    {item.suggestedChanges &&
                    Object.keys(item.suggestedChanges).length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(item.suggestedChanges).map(
                          ([key, value]) => {
                            if (!value) return null;
                            const displayValue = Array.isArray(value)
                              ? value.join(", ")
                              : value;
                            return (
                              <li key={key} className="truncate">
                                <span className="font-medium capitalize">
                                  {key}:
                                </span>{" "}
                                {displayValue}
                              </li>
                            );
                          },
                        )}
                      </ul>
                    ) : item.suggestedImages &&
                      item.suggestedImages.length > 0 ? (
                      <p
                        className="italic"
                        style={{ color: "rgba(212,180,131,0.55)" }}
                      >
                        Suggested {item.suggestedImages.length} image(s).
                      </p>
                    ) : (
                      <p
                        className="italic"
                        style={{ color: "rgba(212,180,131,0.55)" }}
                      >
                        No details provided.
                      </p>
                    )}
                  </div>

                  {item.status !== "pending" && item.reviewNote && (
                    <div className="mt-3 text-sm">
                      <span
                        className="font-medium"
                        style={{ color: "rgba(200,165,90,0.75)" }}
                      >
                        Curator Note:{" "}
                      </span>
                      <span
                        className="italic"
                        style={{ color: "rgba(212,180,131,0.65)" }}
                      >
                        &quot;{item.reviewNote}&quot;
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-12 rounded-lg"
              style={{
                background: "rgba(0,0,0,0.20)",
                border: "1px dashed rgba(200,165,90,0.25)",
              }}
            >
              <svg
                className="mx-auto h-12 w-12 mb-3"
                style={{ color: "rgba(200,165,90,0.35)" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              <h3
                className="text-lg font-medium mb-1"
                style={{ color: "rgba(245,233,200,0.80)" }}
              >
                No contributions yet
              </h3>
              <p style={{ color: "rgba(212,180,131,0.50)" }}>
                When you suggest edits to artifacts, they will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
