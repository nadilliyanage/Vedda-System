import PropTypes from "prop-types";

const ArtifactCard = ({ artifact, onClick }) => {
  return (
    <div
      onClick={() => onClick(artifact)}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden group"
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img
          src={artifact.imageUrl}
          alt={artifact.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold capitalize">
          {artifact.category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-purple-600 transition-colors">
          {artifact.name}
        </h3>
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {artifact.tags.slice(0, 2).map((tag, index) => (
              <span key={index} className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {artifact.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          {artifact.estimatedAge && (
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {artifact.estimatedAge}
            </span>
          )}
          <span className="text-purple-600 text-sm font-semibold flex items-center">
            Learn More
            <svg
              className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
};

ArtifactCard.propTypes = {
  artifact: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.number,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    imageUrl: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    tags: PropTypes.arrayOf(PropTypes.string),
    estimatedAge: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ArtifactCard;
