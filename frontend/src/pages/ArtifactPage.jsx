import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaLandmark } from "react-icons/fa";
import { Sparkles } from "lucide-react";
import { getArtifacts } from "../services/artifactService";
import ArtifactFilter from "../components/artifacts/ArtifactFilter";
import ArtifactSearch from "../components/artifacts/ArtifactSearch";
import ArtifactGrid from "../components/artifacts/ArtifactGrid";
import ArtifactDetailModal from "../components/artifacts/ArtifactDetailModal";
import IdentifyArtifactModal from "../components/artifacts/IdentifyArtifactModal";
import toast from 'react-hot-toast';

const ArtifactPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArtifacts, setFilteredArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showIdentifyModal, setShowIdentifyModal] = useState(false);

  const fetchArtifacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      const response = await getArtifacts(params);
      
      if (response.success) {
        const artifacts = response.artifacts || [];
        setFilteredArtifacts(artifacts);
      } else {
        setFilteredArtifacts([]);
      }
    } catch (error) {
      console.error('Error fetching artifacts:', error);
      toast.error('Failed to load artifacts');
      setFilteredArtifacts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  // Scroll to top only on initial mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    fetchArtifacts();
  }, [fetchArtifacts]);

  const handleArtifactClick = (artifact) => {
    setSelectedArtifact(artifact);
  };

  const handleCloseModal = () => {
    setSelectedArtifact(null);
  };

  return (
    <div
      className="min-h-screen mt-16"
      style={{
        backgroundImage: `url('/assets/background-images/background-1.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ── Glassmorphic nav bar (matches Header style) ── */}
      <div
        style={{
          background: "rgba(28,20,8,0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(200,170,100,0.18)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.20)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                color: "rgba(255,248,230,0.90)",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(200,165,90,0.25)",
                borderRadius: "9px", padding: "0.4rem 0.9rem",
                fontFamily: "system-ui, sans-serif", fontWeight: "600",
                fontSize: "0.88rem", cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(200,165,90,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              <FaArrowLeft style={{ fontSize: "0.8rem" }} />
              Back to Home
            </button>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              color: "#d4b483", fontFamily: "system-ui, sans-serif",
              fontWeight: "600", fontSize: "0.9rem",
            }}>
              <FaLandmark />
              <span>{filteredArtifacts.length} Artifact{filteredArtifacts.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section: white fade only where text lives ── */}
      <div
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)",
          paddingTop: "1.5rem",
          paddingBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        {/* Badge */}
        <span style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.60)",
          border: "1px solid rgba(100,80,40,0.22)",
          borderRadius: "999px",
          padding: "0.28rem 1rem",
          fontSize: "0.73rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#5c4a1e",
          marginBottom: "0.6rem",
          fontFamily: "system-ui, sans-serif",
        }}>
          🏺 Cultural Heritage Collection
        </span>

        <h1 style={{
          fontSize: "clamp(1.8rem,4.5vw,3.2rem)",
          fontWeight: "800",
          color: "#1c1409",
          lineHeight: 1.2,
          margin: "0 auto 0.5rem",
          maxWidth: "720px",
          fontFamily: "'Georgia', serif",
          letterSpacing: "-0.3px",
          textShadow: "0 1px 0 rgba(255,255,255,0.8)",
          padding: "0 1rem",
        }}>
          Vedda{" "}
          <span style={{ color: "#9a6f2a", textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)" }}>
            Artifact
          </span>{" "}
          Preservation System
        </h1>

        <p style={{
          fontSize: "clamp(0.9rem,1.8vw,1.08rem)",
          color: "#3d2e0f",
          maxWidth: "540px",
          margin: "0 auto 1rem",
          lineHeight: 1.75,
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
          padding: "0 1rem",
        }}>
          Explore the rich cultural heritage of the indigenous Vedda people
          through their traditional artifacts, tools, and ceremonial objects.
        </p>

        {/* Identify Artifact button */}
        <button
          onClick={() => setShowIdentifyModal(true)}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            padding: "0.7rem 1.6rem",
            background: "linear-gradient(135deg, #7c3fa8, #4a6fa8)",
            color: "#fff",
            border: "none", borderRadius: "10px",
            fontWeight: "700", fontSize: "0.95rem",
            fontFamily: "system-ui, sans-serif",
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(124,63,168,0.40)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,63,168,0.50)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(124,63,168,0.40)"; }}
        >
          <Sparkles size={18} />
          Identify Artifact
        </button>

        {/* Gold divider */}
        <div style={{
          width: "52px", height: "3px",
          background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
          margin: "1rem auto 0",
          borderRadius: "99px",
        }} />
      </div>

      {/* ── Content area ── */}
      <div className="container mx-auto px-4 pb-12">
        {/* Search — frosted wrapper */}
        <div style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: "14px",
          padding: "0.5rem",
          marginBottom: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          border: "1px solid rgba(255,255,255,0.60)",
        }}>
          <ArtifactSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Filter — frosted wrapper */}
        <div style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: "14px",
          padding: "0.5rem",
          marginBottom: "1.75rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          border: "1px solid rgba(255,255,255,0.60)",
        }}>
          <ArtifactFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Artifacts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div
              className="animate-spin"
              style={{
                width: "48px", height: "48px",
                border: "3px solid rgba(154,111,42,0.25)",
                borderTopColor: "#9a6f2a",
                borderRadius: "50%",
              }}
            />
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "5rem 1rem",
            color: "#3d2e0f",
            fontFamily: "system-ui, sans-serif",
            fontSize: "1.05rem",
            background: "rgba(255,255,255,0.70)",
            borderRadius: "14px",
          }}>
            No artifacts found
          </div>
        ) : (
          <ArtifactGrid
            artifacts={filteredArtifacts}
            onArtifactClick={handleArtifactClick}
          />
        )}

        {/* About section */}
        <div style={{
          marginTop: "3rem",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: "18px",
          padding: "2.25rem 2.5rem",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
          border: "1px solid rgba(255,255,255,0.60)",
        }}>
          <div style={{
            width: "36px", height: "2px",
            background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
            marginBottom: "1.25rem", borderRadius: "99px",
          }} />
          <h2 style={{
            fontSize: "1.4rem", fontWeight: "700",
            color: "#1c1409", marginBottom: "0.85rem",
            fontFamily: "'Georgia', serif",
          }}>
            About This Collection
          </h2>
          <p style={{ color: "#4b5563", lineHeight: 1.85, marginBottom: "0.85rem", fontFamily: "system-ui, sans-serif" }}>
            This collection showcases traditional Vedda artifacts spanning thousands
            of years of indigenous culture in Sri Lanka. Each artifact tells a story
            of the Vedda people&apos;s deep connection with the forest, their
            ingenious use of natural materials, and their rich spiritual traditions.
          </p>
          <p style={{ color: "#4b5563", lineHeight: 1.85, margin: 0, fontFamily: "system-ui, sans-serif" }}>
            The Vedda people (Wanniyala-Aetto) are the indigenous inhabitants of Sri
            Lanka, with a heritage dating back over 16,000 years. Their artifacts
            represent not just tools and objects, but a complete way of life in
            harmony with nature. By learning about these artifacts, we help preserve
            and honor this ancient culture for future generations.
          </p>
        </div>
      </div>

      {/* Modals */}
      {selectedArtifact && (
        <ArtifactDetailModal
          artifact={selectedArtifact}
          onClose={handleCloseModal}
          onArtifactClick={handleArtifactClick}
        />
      )}
      <IdentifyArtifactModal
        isOpen={showIdentifyModal}
        onClose={() => setShowIdentifyModal(false)}
      />
    </div>
  );

};

export default ArtifactPage;
