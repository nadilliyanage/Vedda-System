import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { FaTimes, FaCalendarAlt, FaRuler, FaLeaf, FaMapMarkerAlt, FaTag } from "react-icons/fa";
import { getArtifacts } from "../../services/artifactService";

const ArtifactDetailModal = ({ artifact, onClose, onArtifactClick }) => {
  const [relatedArtifacts, setRelatedArtifacts] = useState([]);

  useEffect(() => {
    if (artifact?.category) {
      fetchRelatedArtifacts();
    }
  }, [artifact]);

  const fetchRelatedArtifacts = async () => {
    try {
      const response = await getArtifacts({
        category: artifact.category,
        limit: 3,
      });
      if (response.success) {
        // Filter out the current artifact and get max 3 related
        const related = response.data.artifacts
          .filter(a => a._id !== artifact._id)
          .slice(0, 3);
        setRelatedArtifacts(related);
      }
    } catch (error) {
      console.error('Error fetching related artifacts:', error);
    }
  };

  if (!artifact) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
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
            <span className="inline-block bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium capitalize">
              {artifact.category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {artifact.estimatedAge && (
              <div className="bg-purple-50 rounded-lg p-4">
                <FaCalendarAlt className="text-purple-600 text-2xl mb-2" />
                <p className="text-xs text-gray-600 mb-1">Estimated Age</p>
                <p className="font-semibold text-gray-800">{artifact.estimatedAge}</p>
              </div>
            )}
            {artifact.location && (
              <div className="bg-purple-50 rounded-lg p-4">
                <FaMapMarkerAlt className="text-purple-600 text-2xl mb-2" />
                <p className="text-xs text-gray-600 mb-1">Location</p>
                <p className="font-semibold text-gray-800 text-sm">
                  {artifact.location}
                </p>
              </div>
            )}
            
          </div>

          {/* Description */}
          <section className="mb-6">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">About</h3>
            <p className="text-gray-700 leading-relaxed">{artifact.description}</p>
          </section>

          {/* Tags */}
          {artifact.tags && artifact.tags.length > 0 && (
            <section className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                <FaTag className="inline mr-2" />Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {artifact.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Date Found */}
          {artifact.dateFound && (
            <section className="mb-6 bg-purple-50 rounded-lg p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                Discovery Information
              </h3>
              <p className="text-gray-700">
                <strong>Date Found:</strong> {new Date(artifact.dateFound).toLocaleDateString()}
              </p>
              {artifact.location && (
                <p className="text-gray-700 mt-2">
                  <strong>Location:</strong> {artifact.location}
                </p>
              )}
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
                    key={relatedArtifact._id}
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
                    <p className="text-xs text-purple-600 capitalize">
                      {relatedArtifact.category}
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
    funFacts: PropTypes.arrayOf(PropTypes.string),
    relatedArtifacts: PropTypes.arrayOf(PropTypes.number),
  }),
  onClose: PropTypes.func.isRequired,
  onArtifactClick: PropTypes.func.isRequired,
};

export default ArtifactDetailModal;
