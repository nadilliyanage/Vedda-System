import PropTypes from "prop-types";
import { artifactCategories } from "../../data/artifacts";

const ArtifactFilter = ({ selectedCategory, onCategoryChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Filter by Category</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {artifactCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={`flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
              selectedCategory === category.id
                ? "bg-purple-600 text-white shadow-lg scale-105"
                : "bg-gray-50 text-gray-700 hover:bg-purple-50 hover:text-purple-600"
            }`}
          >
            <span className="text-2xl mb-2">{category.icon}</span>
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
