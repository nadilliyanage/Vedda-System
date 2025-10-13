import PropTypes from "prop-types";
import { FaTimes, FaCalendarAlt, FaRuler, FaLeaf } from "react-icons/fa";
import { getRelatedArtifacts } from "../../data/artifacts";

const ArtifactDetailModal = ({ artifact, onClose, onArtifactClick }) => {
  if (!artifact) return null;

  const relatedArtifacts = getRelatedArtifacts(artifact.id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <FaTimes className="text-gray-600 text-xl" />
        </button>

        {/* Image Header */}
        <div className="relative h-64 md:h-96 overflow-hidden rounded-t-2xl">
          <img
            src={artifact.imageUrl}
            alt={artifact.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {artifact.name}
            </h2>
            <p className="text-xl text-purple-300 font-medium">
              {artifact.veddaName}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <FaCalendarAlt className="text-purple-600 text-2xl mb-2" />
              <p className="text-xs text-gray-600 mb-1">Era</p>
              <p className="font-semibold text-gray-800">{artifact.era}</p>
              <p className="text-sm text-gray-600 mt-1">{artifact.dateRange}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <FaRuler className="text-purple-600 text-2xl mb-2" />
              <p className="text-xs text-gray-600 mb-1">Dimensions</p>
              <p className="font-semibold text-gray-800 text-sm">
                {artifact.dimensions}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <FaLeaf className="text-purple-600 text-2xl mb-2" />
              <p className="text-xs text-gray-600 mb-1">Status</p>
              <p className="font-semibold text-gray-800 text-sm">
                {artifact.modernStatus}
              </p>
            </div>
          </div>

          {/* Description */}
          <section className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">About</h3>
            <p className="text-gray-700 leading-relaxed">{artifact.longDescription}</p>
          </section>

          {/* Materials */}
          <section className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Materials Used</h3>
            <div className="flex flex-wrap gap-2">
              {artifact.materials.map((material, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {material}
                </span>
              ))}
            </div>
          </section>

          {/* Cultural Significance */}
          <section className="mb-6 bg-purple-50 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Cultural Significance
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {artifact.culturalSignificance}
            </p>
          </section>

          {/* Usage Context */}
          <section className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Historical Usage
            </h3>
            <p className="text-gray-700 leading-relaxed">{artifact.usageContext}</p>
          </section>

          {/* Fun Facts */}
          {artifact.funFacts && artifact.funFacts.length > 0 && (
            <section className="mb-6 bg-blue-50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                💡 Interesting Facts
              </h3>
              <ul className="space-y-2">
                {artifact.funFacts.map((fact, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span className="text-gray-700">{fact}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Related Artifacts */}
          {relatedArtifacts.length > 0 && (
            <section className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Related Artifacts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedArtifacts.map((relatedArtifact) => (
                  <div
                    key={relatedArtifact.id}
                    onClick={() => {
                      onArtifactClick(relatedArtifact);
                    }}
                    className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-purple-500 hover:shadow-md transition-all"
                  >
                    <img
                      src={relatedArtifact.imageUrl}
                      alt={relatedArtifact.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h4 className="font-bold text-gray-800 mb-1 text-sm">
                      {relatedArtifact.name}
                    </h4>
                    <p className="text-xs text-purple-600">
                      {relatedArtifact.veddaName}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

ArtifactDetailModal.propTypes = {
  artifact: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    veddaName: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    longDescription: PropTypes.string.isRequired,
    imageUrl: PropTypes.string.isRequired,
    era: PropTypes.string.isRequired,
    dateRange: PropTypes.string.isRequired,
    dimensions: PropTypes.string.isRequired,
    materials: PropTypes.arrayOf(PropTypes.string).isRequired,
    culturalSignificance: PropTypes.string.isRequired,
    usageContext: PropTypes.string.isRequired,
    modernStatus: PropTypes.string.isRequired,
    funFacts: PropTypes.arrayOf(PropTypes.string),
    relatedArtifacts: PropTypes.arrayOf(PropTypes.number),
  }),
  onClose: PropTypes.func.isRequired,
  onArtifactClick: PropTypes.func.isRequired,
};

export default ArtifactDetailModal;
