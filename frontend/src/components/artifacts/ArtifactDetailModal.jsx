import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import {
  FaTimes,
  FaCalendarAlt,
  FaRuler,
  FaLeaf,
  FaMapMarkerAlt,
  FaTag,
  FaEdit,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getArtifacts } from "../../services/artifactService";
import FeedbackFormModal from "./FeedbackFormModal";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const ArtifactDetailModal = ({ artifact, onClose, onArtifactClick }) => {
  const [relatedArtifacts, setRelatedArtifacts] = useState([]);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSuggestEdit = () => {
    if (!isAuthenticated) {
      toast("You have to sign in to suggest an edit", { icon: "🔒" });
      onClose();
      navigate("/login");
      return;
    }
    setShowFeedbackForm(true);
  };

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
        const related = (response.artifacts || [])
          .filter((a) => a._id !== artifact._id)
          .slice(0, 3);
        setRelatedArtifacts(related);
      }
    } catch (error) {
      console.error("Error fetching related artifacts:", error);
    }
  };

  if (!artifact) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        style={{
          background: "rgba(18,12,3,0.97)",
          border: "1px solid rgba(200,165,90,0.22)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.70)",
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full p-2 transition-colors"
          style={{
            background: "rgba(255,248,230,0.08)",
            border: "1px solid rgba(200,165,90,0.22)",
            color: "rgba(212,180,131,0.70)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(200,165,90,0.18)";
            e.currentTarget.style.color = "#f5e9c8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,248,230,0.08)";
            e.currentTarget.style.color = "rgba(212,180,131,0.70)";
          }}
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Image Header */}
        {(() => {
          // Build full image list: primary imageUrl + images array
          const allImages = [];
          if (artifact.imageUrl) allImages.push(artifact.imageUrl);
          if (artifact.images?.length > 0) {
            artifact.images.forEach((img) => {
              const url = typeof img === "string" ? img : img.url;
              if (url && url !== artifact.imageUrl) allImages.push(url);
            });
          }
          const activeImage = selectedImage || allImages[0];

          return (
            <>
              <div className="relative h-64 md:h-96 overflow-hidden rounded-t-2xl">
                <img
                  src={activeImage}
                  alt={artifact.name}
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute bottom-0 left-0 right-0 p-6"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(10,6,1,0.92) 0%, transparent 100%)",
                  }}
                >
                  <h2
                    className="text-3xl md:text-4xl font-bold mb-2"
                    style={{ color: "#f5e9c8" }}
                  >
                    {artifact.name}
                  </h2>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium capitalize"
                    style={{
                      background: "rgba(200,165,90,0.22)",
                      color: "#d4b483",
                      border: "1px solid rgba(200,165,90,0.35)",
                    }}
                  >
                    {artifact.category}
                  </span>
                </div>
              </div>

              {/* Thumbnail strip — only show if more than 1 image */}
              {allImages.length > 1 && (
                <div
                  className="flex gap-2 p-3 overflow-x-auto"
                  style={{
                    background: "rgba(0,0,0,0.25)",
                    borderBottom: "1px solid rgba(200,165,90,0.15)",
                  }}
                >
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(url)}
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all"
                      style={{
                        border:
                          activeImage === url
                            ? "2px solid rgba(200,165,90,0.80)"
                            : "2px solid rgba(200,165,90,0.20)",
                        boxShadow:
                          activeImage === url
                            ? "0 0 0 2px rgba(200,165,90,0.20)"
                            : "none",
                      }}
                    >
                      <img
                        src={url}
                        alt={`View ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Content */}
        <div className="p-6 md:p-8">
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {artifact.location && (
              <div
                className="rounded-lg p-4"
                style={{
                  background: "rgba(200,165,90,0.08)",
                  border: "1px solid rgba(200,165,90,0.18)",
                }}
              >
                <FaMapMarkerAlt
                  className="text-2xl mb-2"
                  style={{ color: "rgba(212,180,131,0.70)" }}
                />
                <p
                  className="text-xs mb-1"
                  style={{ color: "rgba(212,180,131,0.55)" }}
                >
                  Location
                </p>
                <p
                  className="font-semibold text-sm"
                  style={{ color: "#f5e9c8" }}
                >
                  {artifact.location}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <section className="mb-6">
            <h3
              className="text-2xl font-bold mb-3"
              style={{ color: "#f5e9c8" }}
            >
              About
            </h3>
            <p
              className="leading-relaxed"
              style={{ color: "rgba(212,180,131,0.80)" }}
            >
              {artifact.description}
            </p>
          </section>

          {/* Tags */}
          {artifact.tags && artifact.tags.length > 0 && (
            <section className="mb-6">
              <h3
                className="text-2xl font-bold mb-3"
                style={{ color: "#f5e9c8" }}
              >
                <FaTag
                  className="inline mr-2"
                  style={{ color: "rgba(212,180,131,0.65)" }}
                />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {artifact.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      background: "rgba(255,248,230,0.07)",
                      color: "rgba(212,180,131,0.85)",
                      border: "1px solid rgba(200,165,90,0.22)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Suggest Edit Button */}
          <section className="mb-6">
            <button
              onClick={handleSuggestEdit}
              className="w-full px-4 py-3 rounded-lg transition-all font-medium flex items-center justify-center gap-2"
              style={{
                background: "rgba(255,248,230,0.05)",
                border: "1px solid rgba(200,165,90,0.28)",
                color: "rgba(212,180,131,0.80)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(200,165,90,0.12)";
                e.currentTarget.style.color = "#f5e9c8";
                e.currentTarget.style.borderColor = "rgba(200,165,90,0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,248,230,0.05)";
                e.currentTarget.style.color = "rgba(212,180,131,0.80)";
                e.currentTarget.style.borderColor = "rgba(200,165,90,0.28)";
              }}
            >
              <FaEdit />
              Suggest an Edit
            </button>
          </section>

          {/* Related Artifacts */}
          {relatedArtifacts.length > 0 && (
            <section className="mb-6">
              <h3
                className="text-2xl font-bold mb-4"
                style={{ color: "#f5e9c8" }}
              >
                Related Artifacts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedArtifacts.map((relatedArtifact) => (
                  <div
                    key={relatedArtifact._id}
                    onClick={() => onArtifactClick(relatedArtifact)}
                    className="rounded-lg p-3 cursor-pointer transition-all"
                    style={{
                      background: "rgba(255,248,230,0.05)",
                      border: "1px solid rgba(200,165,90,0.18)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(200,165,90,0.10)";
                      e.currentTarget.style.borderColor =
                        "rgba(200,165,90,0.40)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255,248,230,0.05)";
                      e.currentTarget.style.borderColor =
                        "rgba(200,165,90,0.18)";
                    }}
                  >
                    <img
                      src={relatedArtifact.imageUrl}
                      alt={relatedArtifact.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                      style={{ border: "1px solid rgba(200,165,90,0.15)" }}
                    />
                    <h4
                      className="font-bold mb-1 text-sm"
                      style={{ color: "#f5e9c8" }}
                    >
                      {relatedArtifact.name}
                    </h4>
                    <p
                      className="text-xs capitalize"
                      style={{ color: "rgba(212,180,131,0.60)" }}
                    >
                      {relatedArtifact.category}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Feedback Form Modal */}
        <FeedbackFormModal
          isOpen={showFeedbackForm}
          onClose={() => setShowFeedbackForm(false)}
          artifact={artifact}
        />
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
