import { Link, useLocation } from "react-router-dom";
import {
  HiHome,
  HiUsers,
  HiCog,
  HiBookOpen,
  HiTranslate,
  HiCollection,
  HiChatAlt,
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
      icon: HiTranslate,
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
      path: "/admin/feedback",
      icon: HiChatAlt,
      label: "Feedback",
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
    <div
      className="w-64 h-screen fixed left-0 top-16 overflow-y-auto"
      style={{
        background: "rgba(22, 16, 5, 0.82)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(200, 165, 90, 0.30)",
      }}
    >
      <div className="p-6">
        <h2
          className="text-sm font-bold mb-6 tracking-widest uppercase"
          style={{
            color: "rgba(212, 180, 131, 0.55)",
            letterSpacing: "0.14em",
          }}
        >
          Admin Panel
        </h2>

        <nav className="space-y-1">
          {menuItems
            .filter((item) => item.roles.includes(user?.role))
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200"
                  style={{
                    background: active
                      ? "rgba(154, 111, 42, 0.28)"
                      : "transparent",
                    color: active ? "#d4b483" : "rgba(212, 180, 131, 0.60)",
                    fontWeight: active ? "600" : "400",
                    borderLeft: active
                      ? "3px solid rgba(200, 165, 90, 0.70)"
                      : "3px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background =
                        "rgba(255,248,230,0.06)";
                      e.currentTarget.style.color = "rgba(212,180,131,0.90)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "rgba(212,180,131,0.60)";
                    }
                  }}
                >
                  <Icon
                    className="w-4 h-4 flex-shrink-0"
                    style={{
                      color: active ? "#d4b483" : "rgba(212,180,131,0.45)",
                    }}
                  />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
