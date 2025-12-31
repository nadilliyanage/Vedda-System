import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminArtifactCard from '../components/artifacts/AdminArtifactCard';
import ArtifactFormModal from '../components/artifacts/ArtifactFormModal';
import { getArtifacts, deleteArtifact } from '../services/artifactService';

const AdminArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [artifactToDelete, setArtifactToDelete] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  });

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
        console.error('Fetch error:', error);
        toast.error('Failed to load artifacts');
      } finally {
        setLoading(false);
      }
    };

    fetchArtifacts();
  }, [pagination.page, pagination.limit, categoryFilter, statusFilter, searchTerm]);

  const handleDelete = (artifact) => {
    setArtifactToDelete(artifact);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      const response = await deleteArtifact(artifactToDelete._id);
      if (response.success) {
        toast.success('Artifact deleted successfully');
        setShowDeleteConfirm(false);
        setArtifactToDelete(null);
        // Force refresh by updating pagination
        setPagination((prev) => ({ ...prev, page: prev.page }));
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete artifact');
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
    // TODO: Implement edit functionality
    toast('Edit functionality coming soon!', { icon: '🚧' });
  };

  const handleView = (artifact) => {
    // TODO: Implement view modal
    toast('View details coming soon!', { icon: '👀' });
  };

  const handleSuccess = (newArtifact) => {
    // Force refresh by updating pagination
    setPagination((prev) => ({ ...prev, page: prev.page }));
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Artifact Management</h1>
        <p className="text-gray-600 mt-2">Manage cultural artifacts with AI-powered metadata tagging</p>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          {/* Category Filter */}
          <div className="w-full lg:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page }))}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <Plus size={20} />
              Add Artifact
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing <strong>{artifacts.length}</strong> of <strong>{pagination.total}</strong> artifacts
          </span>
          {(searchTerm || categoryFilter || statusFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setStatusFilter('');
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Artifacts Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={48} className="text-blue-600 animate-spin" />
        </div>
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
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: i + 1 }))}
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Filter size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No artifacts found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || categoryFilter || statusFilter
              ? 'Try adjusting your filters'
              : 'Get started by adding your first artifact'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus size={20} />
            Add Your First Artifact
          </button>
        </div>
      )}

      {/* Add Artifact Modal */}
      <ArtifactFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && artifactToDelete && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-2xl p-8 shadow-2xl transform transition-all duration-200 scale-100 max-w-md w-full mx-4">
            <div className="flex flex-col items-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Artifact</h3>
                <p className="text-gray-600">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">&ldquo;{artifactToDelete.name}&rdquo;</span>? This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-4 w-full">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
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
