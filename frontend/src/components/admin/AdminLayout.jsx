import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AdminSidebar from './AdminSidebar';
import Header from '../layout/Header';

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
      navigate('/login');
      return;
    }
    
    if (user?.role !== 'admin' && user?.role !== 'elder') {
      navigate('/');
      return;
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Show loading while auth is being verified
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  // Only render if user is admin or elder
  if (!user || (user.role !== 'admin' && user.role !== 'elder')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-15">
        <AdminSidebar />
        <div className="ml-64 p-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
