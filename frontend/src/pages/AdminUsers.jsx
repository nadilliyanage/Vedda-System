import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";
import LoadingScreen from "../components/ui/LoadingScreen";

const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/users`,
        );

        if (response.data.success) {
          setUsers(response.data.users);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };

    // Only admins can access user management
    if (user?.role !== "admin") {
      setError("Access denied. Admin only.");
      setLoading(false);
      return;
    }

    fetchUsers();
  }, [user]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/users/${userId}/role`,
        {
          role: newRole,
        },
      );

      if (response.data.success) {
        setUsers(
          users.map((u) => (u._id === userId ? { ...u, role: newRole } : u)),
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user role");
    }
  };

  const handleDeleteUser = (userId, username) => {
    setUserToDelete({ id: userId, username });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/auth/users/${userToDelete.id}`,
      );

      if (response.data.success) {
        setUsers(users.filter((u) => u._id !== userToDelete.id));
        setShowDeleteConfirm(false);
        setUserToDelete(null);
      }
      toast.success("User deleted successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      cancelDelete();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: "#f5e9c8" }}>
          User Management
        </h1>
        <p style={{ color: "rgba(212,180,131,0.70)" }}>
          Manage all users in the system
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

      <div className="admin-glass overflow-hidden">
        <div
          className="px-6 py-4"
          style={{ borderBottom: "1px solid rgba(200,165,90,0.18)" }}
        >
          <h2 className="text-xl font-semibold" style={{ color: "#f5e9c8" }}>
            All Users ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="admin-table-head">
              <tr>
                <th className="admin-table-th">Username</th>
                <th className="admin-table-th">Email</th>
                <th className="admin-table-th">Role</th>
                <th className="admin-table-th">Joined</th>
                <th className="admin-table-th">Last Login</th>
                <th className="admin-table-th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem._id} className="admin-table-row">
                  <td className="admin-table-td">
                    <div
                      className="text-sm font-semibold"
                      style={{ color: "#f5e9c8" }}
                    >
                      {userItem.username}
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <div
                      className="text-sm"
                      style={{ color: "rgba(212,180,131,0.70)" }}
                    >
                      {userItem.email}
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <select
                      value={userItem.role}
                      onChange={(e) =>
                        handleRoleChange(userItem._id, e.target.value)
                      }
                      disabled={userItem._id === user?.id}
                      className={`admin-select text-sm px-3 py-1 rounded-full font-medium ${
                        userItem._id === user?.id
                          ? "cursor-not-allowed opacity-60"
                          : "cursor-pointer"
                      }`}
                      style={{
                        color:
                          userItem.role === "admin"
                            ? "#c084fc"
                            : userItem.role === "elder"
                              ? "#86efac"
                              : "#93c5fd",
                      }}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="elder">Elder</option>
                    </select>
                  </td>
                  <td className="admin-table-td">
                    {formatDate(userItem.createdAt)}
                  </td>
                  <td className="admin-table-td">
                    {formatDate(userItem.lastLogin)}
                  </td>
                  <td className="admin-table-td">
                    <button
                      onClick={() =>
                        handleDeleteUser(userItem._id, userItem.username)
                      }
                      disabled={userItem._id === user?.id}
                      className={`font-medium transition-colors ${
                        userItem._id === user?.id
                          ? "cursor-not-allowed opacity-40"
                          : "cursor-pointer"
                      }`}
                      style={{ color: "#fca5a5" }}
                      onMouseEnter={(e) => {
                        if (userItem._id !== user?.id)
                          e.currentTarget.style.color = "#f87171";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#fca5a5";
                      }}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div
            className="rounded-2xl p-8 shadow-2xl transform transition-all duration-200 scale-100 max-w-md w-full mx-4"
            style={{
              background: "rgba(20,14,4,0.95)",
              border: "1px solid rgba(200,165,90,0.25)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex flex-col items-center space-y-6">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(220,38,38,0.18)" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "#fca5a5" }}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="text-center">
                <h3
                  className="text-xl font-semibold mb-2"
                  style={{ color: "#f5e9c8" }}
                >
                  Delete User
                </h3>
                <p style={{ color: "rgba(212,180,131,0.75)" }}>
                  Are you sure you want to delete user{" "}
                  <span className="font-semibold" style={{ color: "#f5e9c8" }}>
                    {userToDelete?.username}
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="flex space-x-4 w-full">
                <button
                  onClick={cancelDelete}
                  className="admin-btn-secondary flex-1 px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="admin-btn-danger flex-1 px-6 py-3"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
