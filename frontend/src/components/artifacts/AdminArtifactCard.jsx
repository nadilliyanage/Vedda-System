import { Edit, Trash2, Eye } from 'lucide-react';
import PropTypes from 'prop-types';

const AdminArtifactCard = ({ artifact, onEdit, onDelete, onView }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      tools: 'bg-blue-100 text-blue-800',
      pottery: 'bg-orange-100 text-orange-800',
      jewelry: 'bg-purple-100 text-purple-800',
      weapons: 'bg-red-100 text-red-800',
      clothing: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200">
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {artifact.imageUrl ? (
          <img
            src={artifact.imageUrl}
            alt={artifact.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span>No Image</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(artifact.status)}`}>
            {artifact.status?.charAt(0).toUpperCase() + artifact.status?.slice(1)}
          </span>
        </div>

        {/* AI Generated Badge */}
        {artifact.metadata?.aiGenerated && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 flex items-center gap-1">
              ✨ AI Generated
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">
            {artifact.name}
          </h3>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(artifact.category)}`}>
            {artifact.category?.charAt(0).toUpperCase() + artifact.category?.slice(1)}
          </span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {artifact.description}
        </p>

        {/* Tags */}
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {artifact.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
              >
                #{tag}
              </span>
            ))}
            {artifact.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{artifact.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Location & Date */}
        <div className="text-xs text-gray-500 mb-3 space-y-1">
          {artifact.location && (
            <div className="flex items-center gap-1">
              <span className="font-medium">📍</span>
              <span>{artifact.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span className="font-medium">🕒</span>
            <span>Added: {formatDate(artifact.createdAt)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={() => onView(artifact)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            <Eye size={16} />
            View
          </button>
          <button
            onClick={() => onEdit(artifact)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => onDelete(artifact)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

AdminArtifactCard.propTypes = {
  artifact: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    imageUrl: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    location: PropTypes.string,
    status: PropTypes.string,
    createdAt: PropTypes.string,
    metadata: PropTypes.shape({
      aiGenerated: PropTypes.bool,
    }),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onView: PropTypes.func.isRequired,
};

export default AdminArtifactCard;
