import PropTypes from "prop-types";

const ArtifactCard = ({ artifact, onClick }) => {
  return (
    <div
      onClick={() => onClick(artifact)}
      className="rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden group"
      style={{
        background: "rgba(255,248,230,0.8)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid rgba(200,165,90,0.30)",
      }}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden" style={{ background: "rgba(220,210,190,0.6)" }}>
        <img
          src={artifact.imageUrl}
          alt={artifact.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div 
          className="absolute top-3 right-3 text-white px-3 py-1 rounded-full text-xs font-semibold capitalize"
          style={{
            background: "linear-gradient(135deg, #7c3fa8, #4a6fa8)",
            boxShadow: "0 2px 8px rgba(124,63,168,0.35)"
          }}
        >
          {artifact.category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5">
        <h3 
          className="text-xl font-bold mb-1 transition-colors group-hover:text-[#7c3fa8]"
          style={{ color: "#1c1409" }}
        >
          {artifact.name}
        </h3>
        {artifact.tags && artifact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {artifact.tags.slice(0, 2).map((tag, index) => (
              <span 
                key={index} 
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  color: "#7c3fa8",
                  background: "rgba(124,63,168,0.08)"
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <p 
          className="text-sm line-clamp-3 mb-4"
          style={{ color: "#3d2e0f" }}
        >
          {artifact.description}
        </p>

        {/* Footer */}
        <div 
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid rgba(200,165,90,0.22)" }}
        >
          {artifact.estimatedAge && (
            <span 
              className="text-xs px-3 py-1 rounded-full"
              style={{
                color: "#5c4a1e",
                background: "rgba(200,165,90,0.15)"
              }}
            >
              {artifact.estimatedAge}
            </span>
          )}
          <span 
            className="text-sm font-semibold flex items-center transition-colors"
            style={{ color: "#7c3fa8" }}
          >
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
