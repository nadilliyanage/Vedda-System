import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    elderCount: 0,
    userCount: 0
  });

  // Check if user is admin
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/auth/users');
        
        if (response.data.success) {
          const usersData = response.data.users;
          setUsers(usersData);
          
          // Calculate statistics
          const stats = usersData.reduce((acc, user) => {
            acc.totalUsers++;
            if (user.role === 'admin') acc.adminCount++;
            else if (user.role === 'elder') acc.elderCount++;
            else acc.userCount++;
            return acc;
          }, { totalUsers: 0, adminCount: 0, elderCount: 0, userCount: 0 });
          
          setStats(stats);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, [user]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await axios.patch(`http://localhost:5001/api/auth/users/${userId}/role`, {
        role: newRole
      });

      if (response.data.success) {
        // Update local state
        setUsers(users.map(u => 
          u._id === userId ? { ...u, role: newRole } : u
        ));

        // Recalculate stats
        const updatedUsers = users.map(u => 
          u._id === userId ? { ...u, role: newRole } : u
        );
        const newStats = updatedUsers.reduce((acc, user) => {
          acc.totalUsers++;
          if (user.role === 'admin') acc.adminCount++;
          else if (user.role === 'elder') acc.elderCount++;
          else acc.userCount++;
          return acc;
        }, { totalUsers: 0, adminCount: 0, elderCount: 0, userCount: 0 });
        setStats(newStats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5001/api/auth/users/${userId}`);

      if (response.data.success) {
        setUsers(users.filter(u => u._id !== userId));
        
        // Recalculate stats
        const updatedUsers = users.filter(u => u._id !== userId);
        const newStats = updatedUsers.reduce((acc, user) => {
          acc.totalUsers++;
          if (user.role === 'admin') acc.adminCount++;
          else if (user.role === 'elder') acc.elderCount++;
          else acc.userCount++;
          return acc;
        }, { totalUsers: 0, adminCount: 0, elderCount: 0, userCount: 0 });
        setStats(newStats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Show loading while auth is being verified
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
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
            <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="text-sm text-gray-600 mb-1">Admins</div>
            <div className="text-3xl font-bold text-gray-900">{stats.adminCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <div className="text-sm text-gray-600 mb-1">Elders</div>
            <div className="text-3xl font-bold text-gray-900">{stats.elderCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
            <div className="text-sm text-gray-600 mb-1">Regular Users</div>
            <div className="text-3xl font-bold text-gray-900">{stats.userCount}</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{userItem.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{userItem.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={userItem.role}
                        onChange={(e) => handleRoleChange(userItem._id, e.target.value)}
                        disabled={userItem._id === user?.id}
                        className={`text-sm px-3 py-1 rounded-full font-medium ${
                          userItem.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : userItem.role === 'elder'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        } ${
                          userItem._id === user?.id
                            ? 'cursor-not-allowed opacity-60'
                            : 'cursor-pointer'
                        }`}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="elder">Elder</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(userItem.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(userItem.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteUser(userItem._id)}
                        disabled={userItem._id === user?.id}
                        className={`text-red-600 hover:text-red-800 font-medium ${
                          userItem._id === user?.id
                            ? 'cursor-not-allowed opacity-40'
                            : 'cursor-pointer'
                        }`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
