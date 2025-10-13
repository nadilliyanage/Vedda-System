import PropTypes from "prop-types";
import { FaSearch, FaTimes } from "react-icons/fa";

const ArtifactSearch = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="relative">
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search artifacts by name, description, or cultural significance..."
          className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange("")}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

ArtifactSearch.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
};

export default ArtifactSearch;
