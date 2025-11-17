import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../constants/languages";

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
  });

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/auth/users`);

        if (response.data.success) {
          const usersData = response.data.users;
          setUsers(usersData);

          // Calculate statistics
          const stats = usersData.reduce(
            (acc, user) => {
              acc.totalUsers++;
              if (user.role === "admin") acc.adminCount++;
              else if (user.role === "elder") acc.elderCount++;
              else acc.userCount++;
              return acc;
            },
            { totalUsers: 0, adminCount: 0, elderCount: 0, userCount: 0 }
          );

          setStats(stats);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "admin") {
      fetchUsers();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <p className="text-gray-600">Manage users and system settings</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
      </div>
    </div>
  );
};

export default AdminDashboard;
