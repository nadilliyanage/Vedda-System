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
          const artifactServiceUrl =
            import.meta.env.VITE_ARTIFACT_SERVICE_URL ||
            "http://localhost:5010/api/artifacts";
          const artifactResponse = await axios.get(
            `${artifactServiceUrl}?limit=1`,
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
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {user?.role === "admin" ? "Admin Dashboard" : "Elder Dashboard"}
        </h1>
        <p className="text-gray-600">
          {user?.role === "admin"
            ? "Manage users and system settings"
            : "Manage words and artifacts"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {user?.role === "admin" && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="text-sm text-gray-600 mb-1">Total Users</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalUsers}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
              <div className="text-sm text-gray-600 mb-1">Admins</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.adminCount}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="text-sm text-gray-600 mb-1">Elders</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.elderCount}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
              <div className="text-sm text-gray-600 mb-1">Regular Users</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.userCount}
              </div>
            </div>
          </>
        )}

        {/* Word and Artifact counts - visible to both admin and elder */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="text-sm text-gray-600 mb-1">Total Words</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.wordCount}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-teal-500">
          <div className="text-sm text-gray-600 mb-1">Total Artifacts</div>
          <div className="text-3xl font-bold text-gray-900">
            {stats.artifactCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
