import { Link, useLocation } from "react-router-dom";
import {
  HiHome,
  HiUsers,
  HiCog,
  HiBookOpen,
  HiCollection,
} from "react-icons/hi";
import { useAuth } from "../../contexts/AuthContext";
import LoadingScreen from "../ui/LoadingScreen";

const AdminSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) {
    return <LoadingScreen />;
  }

  const menuItems = [
    {
      path: "/admin",
      icon: HiHome,
      label: "Dashboard",
      exact: true,
      roles: ["admin", "elder"],
    },
    {
      path: "/admin/users",
      icon: HiUsers,
      label: "User Management",
      roles: ["admin"],
    },
    {
      path: "/admin/words",
      icon: HiBookOpen,
      label: "Word Management",
      roles: ["admin", "elder"],
    },
    {
      path: "/admin/lernings",
      icon: HiBookOpen,
      label: "Learning Management",
      roles: ["admin", "elder"],
    },
    {
      path: "/admin/artifacts",
      icon: HiCollection,
      label: "Artifact Management",
      roles: ["admin", "elder"],
    },
    {
      path: "/admin/settings",
      icon: HiCog,
      label: "Settings",
      roles: ["admin"],
    },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="w-64 bg-white h-screen fixed left-0 top-16 border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Admin Panel
        </h2>

        <nav className="space-y-2">
          {menuItems
            .filter((item) => item.roles.includes(user?.role))
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 py-3 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${active ? "text-blue-600" : "text-gray-400"}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
