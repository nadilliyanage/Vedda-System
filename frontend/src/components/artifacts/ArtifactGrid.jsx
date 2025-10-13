import PropTypes from "prop-types";
import ArtifactCard from "./ArtifactCard";

const ArtifactGrid = ({ artifacts, onArtifactClick }) => {
  if (artifacts.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">No Artifacts Found</h3>
        <p className="text-gray-600">
          Try adjusting your search or filter to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          onClick={onArtifactClick}
        />
      ))}
    </div>
  );
};

ArtifactGrid.propTypes = {
  artifacts: PropTypes.array.isRequired,
  onArtifactClick: PropTypes.func.isRequired,
};

export default ArtifactGrid;
