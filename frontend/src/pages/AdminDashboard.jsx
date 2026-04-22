import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import LoadingScreen from "../components/ui/LoadingScreen";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    elderCount: 0,
    userCount: 0,
    wordCount: 0,
    artifactCount: 0,
  });

  // Fetch all statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        // Fetch user stats (admins only)
        if (user?.role === "admin") {
          const userResponse = await axios.get(
            `${import.meta.env.VITE_AUTH_SERVICE_URL}/users`,
          );
          if (userResponse.data.success) {
            const usersData = userResponse.data.users;
            setUsers(usersData);

            const userStats = usersData.reduce(
              (acc, user) => {
                acc.totalUsers++;
                if (user.role === "admin") acc.adminCount++;
                else if (user.role === "elder") acc.elderCount++;
                else acc.userCount++;
                return acc;
              },
              { totalUsers: 0, adminCount: 0, elderCount: 0, userCount: 0 },
            );

            setStats((prev) => ({ ...prev, ...userStats }));
          }
        }

        // Fetch artifact count (for both admin and elder)
        try {
          const apiGatewayBaseUrl = import.meta.env.VITE_API_GATEWAY_URL || "";
          const artifactServiceUrl =
            import.meta.env.VITE_ARTIFACT_SERVICE_URL ||
            `${apiGatewayBaseUrl}/api/artifacts`;
          const token = localStorage.getItem("token");
          const artifactResponse = await axios.get(
            `${artifactServiceUrl}?limit=1`,
            token
              ? { headers: { Authorization: `Bearer ${token}` } }
              : undefined,
          );
          if (artifactResponse.data.success) {
            setStats((prev) => ({
              ...prev,
              artifactCount: artifactResponse.data.pagination.total,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch artifact count:", err);
        }

        // TODO: Fetch word count when word management API is ready
        // For now, set a placeholder or remove this section
        setStats((prev) => ({ ...prev, wordCount: 0 }));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch statistics");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin" || user?.role === "elder") {
      fetchStats();
    }
  }, [user]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#f5e9c8" }}>
          {user?.role === "admin" ? "Admin Dashboard" : "Elder Dashboard"}
        </h1>
        <p style={{ color: "rgba(212,180,131,0.70)" }}>
          {user?.role === "admin"
            ? "Manage users and system settings"
            : "Manage words and artifacts"}
        </p>
      </div>

      {error && (
        <div
          className="px-4 py-3 rounded-lg mb-6"
          style={{
            background: "rgba(220,38,38,0.14)",
            border: "1px solid rgba(220,38,38,0.30)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {user?.role === "admin" && (
          <>
            <div
              className="admin-stat-card"
              style={{ borderLeft: "4px solid #6366f1" }}
            >
              <div
                className="text-sm mb-1"
                style={{ color: "rgba(212,180,131,0.65)" }}
              >
                Total Users
              </div>
              <div className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
                {stats.totalUsers}
              </div>
            </div>
            <div
              className="admin-stat-card"
              style={{ borderLeft: "4px solid #a855f7" }}
            >
              <div
                className="text-sm mb-1"
                style={{ color: "rgba(212,180,131,0.65)" }}
              >
                Admins
              </div>
              <div className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
                {stats.adminCount}
              </div>
            </div>
            <div
              className="admin-stat-card"
              style={{ borderLeft: "4px solid #22c55e" }}
            >
              <div
                className="text-sm mb-1"
                style={{ color: "rgba(212,180,131,0.65)" }}
              >
                Elders
              </div>
              <div className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
                {stats.elderCount}
              </div>
            </div>
            <div
              className="admin-stat-card"
              style={{ borderLeft: "4px solid #eab308" }}
            >
              <div
                className="text-sm mb-1"
                style={{ color: "rgba(212,180,131,0.65)" }}
              >
                Regular Users
              </div>
              <div className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
                {stats.userCount}
              </div>
            </div>
          </>
        )}

        {/* Word and Artifact counts - visible to both admin and elder */}
        <div
          className="admin-stat-card"
          style={{ borderLeft: "4px solid #818cf8" }}
        >
          <div
            className="text-sm mb-1"
            style={{ color: "rgba(212,180,131,0.65)" }}
          >
            Total Words
          </div>
          <div className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
            {stats.wordCount}
          </div>
        </div>
        <div
          className="admin-stat-card"
          style={{ borderLeft: "4px solid #14b8a6" }}
        >
          <div
            className="text-sm mb-1"
            style={{ color: "rgba(212,180,131,0.65)" }}
          >
            Total Artifacts
          </div>
          <div className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
            {stats.artifactCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
