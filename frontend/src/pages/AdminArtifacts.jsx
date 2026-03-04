import { useState, useEffect } from "react";
import { Plus, Search, Filter, Loader2, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import AdminArtifactCard from "../components/artifacts/AdminArtifactCard";
import ArtifactFormModal from "../components/artifacts/ArtifactFormModal";
import ArtifactDetailModal from "../components/artifacts/ArtifactDetailModal";
import { getArtifacts, deleteArtifact } from "../services/artifactService";
import LoadingScreen from "../components/ui/LoadingScreen";

const AdminArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtifact, setEditingArtifact] = useState(null);
  const [viewingArtifact, setViewingArtifact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchArtifacts = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.page,
          limit: pagination.limit,
        };

        if (searchTerm) params.search = searchTerm;
        if (categoryFilter) params.category = categoryFilter;
        if (statusFilter) params.status = statusFilter;

        const response = await getArtifacts(params);

        if (response.success) {
          setArtifacts(response.artifacts);
          setPagination((prev) => ({
            ...prev,
            total: response.pagination.total,
            pages: response.pagination.pages,
          }));
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load artifacts");
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
  }, [
    pagination.page,
    pagination.limit,
    categoryFilter,
    statusFilter,
    searchTerm,
    refreshTrigger,
  ]);

  const handleDelete = (artifact) => {
    setArtifactToDelete(artifact);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteArtifact(artifactToDelete._id);
      if (response.success) {
        toast.success("Artifact deleted successfully");
        setShowDeleteConfirm(false);
        setArtifactToDelete(null);
        // Force refresh
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete artifact");
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setArtifactToDelete(null);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      cancelDelete();
    }
  };

  const handleEdit = (artifact) => {
    setEditingArtifact(artifact);
    setIsModalOpen(true);
  };

  const handleView = (artifact) => {
    setViewingArtifact(artifact);
  };

  const handleSuccess = (artifactData, isUpdate = false) => {
    if (isUpdate) {
      // Update existing artifact in the list
      setArtifacts((prev) =>
        prev.map((item) =>
          item._id === artifactData._id ? artifactData : item,
        ),
      );
      toast.success("Artifact list updated");
    } else {
      // Add the new artifact to the beginning of the list
      setArtifacts((prev) => [artifactData, ...prev]);
      // Update total count
      setPagination((prev) => ({ ...prev, total: prev.total + 1 }));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
          Artifact Management
        </h1>
        <p className="mt-2" style={{ color: "rgba(212,180,131,0.70)" }}>
          Manage cultural artifacts with AI-powered metadata tagging
        </p>
      </div>

      {/* Filters & Actions */}
      <div className="admin-glass p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Search artifacts..."
                className="admin-input w-full pl-10"
              />
              <Search
                className="absolute left-3 top-2.5"
                style={{ color: "rgba(212,180,131,0.45)" }}
                size={20}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select w-full"
            >
              <option value="">All Categories</option>
              <option value="tools">Tools</option>
              <option value="pottery">Pottery</option>
              <option value="jewelry">Jewelry</option>
              <option value="weapons">Weapons</option>
              <option value="clothing">Clothing</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="admin-select w-full"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setRefreshTrigger((prev) => prev + 1)}
              className="admin-btn-secondary px-4 py-2 flex items-center gap-2"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="admin-btn-primary px-6 py-2 flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Add Artifact
            </button>
          </div>
        </div>

        {/* Stats */}
        <div
          className="mt-4 pt-4 flex items-center justify-between text-sm"
          style={{
            borderTop: "1px solid rgba(200,165,90,0.18)",
            color: "rgba(212,180,131,0.65)",
          }}
        >
          <span>
            Showing{" "}
            <strong style={{ color: "#d4b483" }}>{artifacts.length}</strong> of{" "}
            <strong style={{ color: "#d4b483" }}>{pagination.total}</strong>{" "}
            artifacts
          </span>
          {(searchTerm || categoryFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("");
                setStatusFilter("");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ color: "#d4b483" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f5e9c8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#d4b483";
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Artifacts Grid */}
      {loading ? (
        <LoadingScreen />
      ) : artifacts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {artifacts.map((artifact) => (
              <AdminArtifactCard
                key={artifact._id}
                artifact={artifact}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="admin-btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: i + 1 }))
                  }
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === i + 1
                      ? "admin-btn-primary"
                      : "admin-btn-secondary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.pages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.pages}
                className="admin-btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="admin-glass p-12 text-center">
          <div className="mb-4" style={{ color: "rgba(212,180,131,0.40)" }}>
            <Filter size={64} className="mx-auto" />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: "#f5e9c8" }}
          >
            No artifacts found
          </h3>
          <p className="mb-6" style={{ color: "rgba(212,180,131,0.65)" }}>
            {searchTerm || categoryFilter || statusFilter
              ? "Try adjusting your filters"
              : "Get started by adding your first artifact"}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="admin-btn-primary px-6 py-3 inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Add Your First Artifact
          </button>
        </div>
      )}

      {/* Add/Edit Artifact Modal */}
      <ArtifactFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingArtifact(null);
        }}
        onSuccess={handleSuccess}
        artifact={editingArtifact}
      />

      {/* View Artifact Detail Modal */}
      {viewingArtifact && (
        <ArtifactDetailModal
          artifact={viewingArtifact}
          onClose={() => setViewingArtifact(null)}
          onArtifactClick={(artifact) => setViewingArtifact(artifact)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && artifactToDelete && (
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
                  Delete Artifact
                </h3>
                <p style={{ color: "rgba(212,180,131,0.75)" }}>
                  Are you sure you want to delete{" "}
                  <span className="font-semibold" style={{ color: "#f5e9c8" }}>
                    &ldquo;{artifactToDelete.name}&rdquo;
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

export default AdminArtifacts;
