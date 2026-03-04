const AdminSettings = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "#f5e9c8" }}>
          System Settings
        </h1>
        <p style={{ color: "rgba(212,180,131,0.70)" }}>
          Configure system settings and preferences
        </p>
      </div>

      <div className="admin-glass p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚙️</div>
          <h2
            className="text-2xl font-semibold mb-2"
            style={{ color: "#f5e9c8" }}
          >
            System Settings
          </h2>
          <p style={{ color: "rgba(212,180,131,0.65)" }}>
            System settings features coming soon...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
