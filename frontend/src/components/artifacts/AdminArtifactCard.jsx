import { Edit, Trash2, Eye } from "lucide-react";
import PropTypes from "prop-types";

const AdminArtifactCard = ({ artifact, onEdit, onDelete, onView }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      tools: "bg-blue-900/25 text-blue-300 border border-blue-500/25",
      pottery: "bg-orange-900/25 text-orange-300 border border-orange-500/25",
      jewelry: "bg-purple-900/25 text-purple-300 border border-purple-500/25",
      weapons: "bg-red-900/25 text-red-300 border border-red-500/25",
      clothing: "bg-pink-900/25 text-pink-300 border border-pink-500/25",
      other: "bg-stone-700/35 text-stone-300 border border-stone-500/25",
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="admin-glass hover:shadow-2xl transition-all duration-300 overflow-hidden">
      {/* Image Section */}
      <div
        className="relative h-48 overflow-hidden"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        {artifact.imageUrl ? (
          <img
            src={artifact.imageUrl}
            alt={artifact.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ color: "rgba(212,180,131,0.40)" }}
          >
            <span>No Image</span>
          </div>
        )}

        {/* AI Generated Badge */}
        {artifact.metadata?.aiGenerated && (
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-900/25 text-purple-300 border border-purple-500/25 flex items-center gap-1">
              ✨ AI Generated
            </span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <div className="mb-3">
          <h3
            className="text-lg font-bold mb-1 line-clamp-1"
            style={{ color: "#f5e9c8" }}
          >
            {artifact.name}
          </h3>
          <span
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${getCategoryColor(artifact.category)}`}
          >
            {artifact.category?.charAt(0).toUpperCase() +
              artifact.category?.slice(1)}
          </span>
        </div>

        <p
          className="text-sm line-clamp-2 mb-3"
          style={{ color: "rgba(212,180,131,0.70)" }}
        >
          {artifact.description}
        </p>

        {/* Tags */}
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {artifact.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: "rgba(255,248,230,0.08)",
                  color: "rgba(212,180,131,0.75)",
                }}
              >
                #{tag}
              </span>
            ))}
            {artifact.tags.length > 3 && (
              <span
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: "rgba(255,248,230,0.08)",
                  color: "rgba(212,180,131,0.75)",
                }}
              >
                +{artifact.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Location & Date */}
        <div
          className="text-xs mb-3 space-y-1"
          style={{ color: "rgba(212,180,131,0.55)" }}
        >
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
        <div
          className="flex gap-2 pt-3"
          style={{ borderTop: "1px solid rgba(200,165,90,0.18)" }}
        >
          <button
            onClick={() => onView(artifact)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            style={{ background: "rgba(59,130,246,0.12)", color: "#93c5fd" }}
          >
            <Eye size={16} />
            View
          </button>
          <button
            onClick={() => onEdit(artifact)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            style={{ background: "rgba(22,163,74,0.12)", color: "#86efac" }}
          >
            <Edit size={16} />
            Edit
          </button>
          <button
            onClick={() => onDelete(artifact)}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
            style={{ background: "rgba(220,38,38,0.12)", color: "#fca5a5" }}
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
