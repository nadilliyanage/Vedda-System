import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FaTimes, FaCalendarAlt, FaRuler, FaLeaf, FaMapMarkerAlt, FaTag, FaEdit } from "react-icons/fa";
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
    <>
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto py-8"
      style={{ background: "rgba(10,8,4,0.72)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Sticky close button — sits outside the scrollable modal body */}
      <button
        onClick={onClose}
        className="fixed top-6 right-6 z-[60] rounded-full p-2 shadow-xl transition-colors"
        style={{
          background: "rgba(28,20,8,0.75)",
          border: "1px solid rgba(200,165,90,0.35)",
          color: "rgba(255,248,230,0.90)",
          backdropFilter: "blur(8px)",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(200,165,90,0.30)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(28,20,8,0.75)")}
      >
        <FaTimes className="text-lg" />
      </button>

      <div
        className="rounded-2xl max-w-4xl w-full relative"
        style={{
          background: "rgba(250,245,230,0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(200,165,90,0.35)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
        }}
      >


        {/* Image Header */}
        {(() => {
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
              <div className="relative h-64 md:h-80 overflow-hidden rounded-t-2xl">
                <img src={activeImage} alt={artifact.name} className="w-full h-full object-cover" />
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(28,20,8,0.82) 0%, rgba(28,20,8,0.20) 55%, transparent 100%)" }} />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 font-serif" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                    {artifact.name}
                  </h2>
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white capitalize"
                    style={{ background: "linear-gradient(135deg, #7c3fa8, #4a6fa8)", boxShadow: "0 2px 8px rgba(124,63,168,0.40)" }}
                  >
                    {artifact.category}
                  </span>
                </div>
              </div>

              {/* Thumbnail strip */}
              {allImages.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto" style={{ background: "rgba(200,165,90,0.12)", borderBottom: "1px solid rgba(200,165,90,0.20)" }}>
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(url)}
                      className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all"
                      style={{
                        borderColor: activeImage === url ? "#7c3fa8" : "rgba(200,165,90,0.30)",
                        boxShadow: activeImage === url ? "0 0 0 2px rgba(124,63,168,0.25)" : "none",
                      }}
                    >
                      <img src={url} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          );
        })()}

        {/* Content */}
        <div className="p-6 md:p-8">

          {/* Quick Info — auto columns so a single item doesn't leave a gap */}
          <div className="flex flex-wrap gap-3 mb-5">
            {artifact.location && (
              <div
                className="rounded-xl px-4 py-3 border flex items-center gap-3"
                style={{ background: "rgba(124,63,168,0.08)", borderColor: "rgba(124,63,168,0.18)" }}
              >
                <FaMapMarkerAlt className="text-lg shrink-0" style={{ color: "#7c3fa8" }} />
                <div>
                  <p className="text-[0.68rem] uppercase tracking-wider font-bold mb-0.5" style={{ color: "#7c6a47" }}>Location</p>
                  <p className="font-semibold text-sm" style={{ color: "#1c1409" }}>{artifact.location}</p>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="w-10 h-[2px] mb-6 rounded-full" style={{ background: "linear-gradient(90deg, #9a6f2a, #c9943a)" }} />

          {/* Description */}
          <section className="mb-6">
            <h3 className="text-xl font-bold mb-2 font-serif" style={{ color: "#1c1409" }}>About</h3>
            <p className="leading-relaxed text-[#1a1208] font-medium">{artifact.description}</p>
          </section>

          {/* Tags */}
          {artifact.tags && artifact.tags.length > 0 && (
            <section className="mb-6">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2 font-serif" style={{ color: "#1c1409" }}>
                <FaTag style={{ color: "#9a6f2a" }} /> Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {artifact.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{ color: "#5c2fa8", background: "rgba(124,63,168,0.14)", border: "1px solid rgba(124,63,168,0.25)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Suggest Edit */}
          <section className="mb-6">
            <button
              onClick={handleSuggestEdit}
              className="w-full px-4 py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2"
              style={{
                color: "#7c3fa8",
                border: "1.5px solid rgba(124,63,168,0.28)",
                background: "rgba(124,63,168,0.07)",
                backdropFilter: "blur(6px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,63,168,0.14)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(124,63,168,0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(124,63,168,0.07)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <FaEdit /> Suggest an Edit
            </button>
          </section>

          {/* Related Artifacts */}
          {relatedArtifacts.length > 0 && (
            <section className="mb-2">
              <h3 className="text-xl font-bold mb-4 font-serif" style={{ color: "#1c1409" }}>Related Artifacts</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedArtifacts.map((rel) => (
                  <div
                    key={rel._id}
                    onClick={() => onArtifactClick(rel)}
                    className="rounded-xl p-3 cursor-pointer transition-all border"
                    style={{
                      background: "rgba(255,248,230,0.40)",
                      borderColor: "rgba(200,165,90,0.25)",
                      backdropFilter: "blur(8px)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#7c3fa8";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,63,168,0.22)";
                      e.currentTarget.style.background = "rgba(255,248,230,0.95)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "rgba(200,165,90,0.25)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.background = "rgba(255,248,230,0.80)";
                    }}
                  >
                    <img src={rel.imageUrl} alt={rel.name} className="w-full h-28 object-cover rounded-lg mb-3" />
                    <h4 className="font-bold text-sm mb-1 text-[#1a1208]">{rel.name}</h4>
                    <p className="text-xs capitalize font-medium" style={{ color: "#7c3fa8" }}>{rel.category}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

      </div>
      {/* Portal FeedbackFormModal to document.body so backdropFilter on the
          parent overlay cannot break its position:fixed behaviour */}
      {showFeedbackForm && createPortal(
        <FeedbackFormModal
          isOpen={showFeedbackForm}
          onClose={() => setShowFeedbackForm(false)}
          artifact={artifact}
        />,
        document.body
      )}
    </div>
    </>
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
