import PropTypes from "prop-types";
import { artifactCategories } from "../../data/artifacts";

const ArtifactFilter = ({ selectedCategory, onCategoryChange }) => {
  return (
    <div className="p-2">
      <h3 className="text-lg font-bold text-black mb-2">Filter by Category</h3>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {artifactCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className="flex flex-col items-center p-2 rounded-lg transition-all duration-200"
            style={
              selectedCategory === category.id
                ? {
                    background: "rgba(139,92,246,0.75)",
                    border: "1px solid rgba(167,139,250,0.9)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    color: "#ffffff",
                    boxShadow: "0 4px 16px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.12)",
                    transform: "scale(1.05)",
                  }
                : {
                    background: "rgba(255,255,255,0.35)",
                    border: "1px solid rgba(200,165,90,0.18)",
                    color: "#3d2e0f",
                  }
            }
          >
            <span className="text-xl mb-1">{category.icon}</span>
            <span className="text-xs font-medium text-center">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

ArtifactFilter.propTypes = {
  selectedCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
};

export default ArtifactFilter;
