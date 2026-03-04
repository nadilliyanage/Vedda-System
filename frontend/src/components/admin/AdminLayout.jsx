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
        className="min-h-screen pt-20 flex items-center justify-center relative"
        style={{
          backgroundImage: "url('/assets/background-images/background-1.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div
          className="absolute inset-0"
          style={{ background: "rgba(10,7,2,0.62)" }}
        />
        <div
          className="text-xl relative z-10"
          style={{ color: "rgba(212,180,131,0.70)" }}
        >
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
      className="min-h-screen relative"
      style={{
        backgroundImage: "url('/assets/background-images/background-1.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(10,7,2,0.62)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div className="relative z-10">
        <Header />
        <div className="pt-15">
          <AdminSidebar />
          <div className="ml-64 p-6">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
