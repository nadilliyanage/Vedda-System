import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import AdminSidebar from "./AdminSidebar";
import Header from "../layout/Header";

const AdminLayout = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Check if user is admin or elder
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.role !== "admin" && user?.role !== "elder") {
      navigate("/");
      return;
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Show loading while auth is being verified
  if (authLoading) {
    return (
      <div
        className="min-h-screen pt-20 flex items-center justify-center"
        style={{
          background:
            "linear-gradient(160deg, #13100a 0%, #1a140b 60%, #0f0d07 100%)",
        }}
      >
        <div className="text-xl" style={{ color: "rgba(212,180,131,0.70)" }}>
          Loading...
        </div>
      </div>
    );
  }

  // Only render if user is admin or elder
  if (!user || (user.role !== "admin" && user.role !== "elder")) {
    return null;
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #13100a 0%, #1a140b 60%, #0f0d07 100%)",
      }}
    >
      <Header />
      <div className="pt-15">
        <AdminSidebar />
        <div className="ml-64 p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
