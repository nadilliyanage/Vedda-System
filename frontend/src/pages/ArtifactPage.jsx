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
      className="min-h-screen mt-[60px] bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url('/assets/background-images/background-1.png')` }}
    >
      {/* ── Glassmorphic sub-nav bar ── */}
      <div
        className="border-b shadow-md"
        style={{
          background: "rgba(28,20,8,0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderColor: "rgba(200,170,100,0.18)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back button */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2 text-[rgba(255,248,230,0.90)] bg-white/10 border border-[rgba(200,165,90,0.25)] rounded-[9px] px-3.5 py-1.5 font-semibold text-sm cursor-pointer transition-colors duration-200 hover:bg-[rgba(200,165,90,0.18)]"
            >
              <FaArrowLeft className="text-xs" />
              Back to Home
            </button>

            {/* Artifact count */}
            <div className="flex items-center gap-2 text-[#d4b483] font-semibold text-sm">
              <FaLandmark />
              <span>{filteredArtifacts.length} Artifact{filteredArtifacts.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div
        className="py-6 text-center"
        style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)" }}
      >
        {/* Badge */}
        <span
          style={{
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
          }}
        >
          🏺 Cultural Heritage Collection
        </span>

        {/* Title */}
        <h1
          style={{
            fontSize: "clamp(1.8rem, 5vw, 3.2rem)",
            fontWeight: "800",
            color: "#1c1409",
            lineHeight: 1.2,
            margin: "0 auto 0.5rem",
            maxWidth: "100%",
            fontFamily: "'Georgia', serif",
            letterSpacing: "-0.3px",
            textShadow: "0 1px 0 rgba(255,255,255,0.8)",
            padding: "0 1rem",
          }}
        >
          Vedda{" "}
          <span
            className="text-[#9a6f2a]"
            style={{ textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)" }}
          >
            Artifact
          </span>{" "}
          Preservation System
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "clamp(0.9rem, 1.8vw, 1.08rem)",
            color: "#3d2e0f",
            maxWidth: "540px",
            margin: "0 auto 0.5rem",
            lineHeight: 1.75,
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
            padding: "0 1rem",
          }}
        >
          Explore the rich cultural heritage of the indigenous Vedda people
          through their traditional artifacts, tools, and ceremonial objects.
        </p>

        {/* Identify Artifact button */}
        <button
          onClick={() => setShowIdentifyModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.7rem 1.6rem",
            background: "linear-gradient(135deg, #7c3fa8, #4a6fa8)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "0.95rem",
            fontFamily: "system-ui, sans-serif",
            cursor: "pointer",
            boxShadow: "0 4px 18px rgba(124,63,168,0.40)",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 28px rgba(124,63,168,0.50)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 18px rgba(124,63,168,0.40)";
          }}
        >
          <Sparkles size={18} />
          Identify Artifact
        </button>

        {/* Gold divider */}
        <div
          style={{
            width: "52px",
            height: "3px",
            background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
            margin: "1rem auto 0",
            borderRadius: "99px",
          }}
        />
      </div>

      {/* ── Content area ── */}
      <div className="container mx-auto px-4 pb-12">

        {/* Search — frosted wrapper */}
        <div
          className="rounded-[14px] p-2 mb-4 border shadow-lg"
          style={{ 
            background: "rgba(255,248,230,0.45)", 
            backdropFilter: "blur(12px)", 
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "rgba(200,165,90,0.30)"
          }}
        >
          <ArtifactSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        </div>

        {/* Filter — frosted wrapper */}
        <div
          className="rounded-[14px] p-2 mb-7 border shadow-lg"
          style={{ 
            background: "rgba(255,248,230,0.45)", 
            backdropFilter: "blur(12px)", 
            WebkitBackdropFilter: "blur(12px)",
            borderColor: "rgba(200,165,90,0.30)"
          }}
        >
          <ArtifactFilter selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} />
        </div>

        {/* Artifacts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div
              className="animate-spin w-12 h-12 rounded-full"
              style={{ border: "3px solid rgba(154,111,42,0.25)", borderTopColor: "#9a6f2a" }}
            />
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div 
            className="text-center py-20 px-4 text-[#3d2e0f] text-base rounded-[14px] font-sans border shadow-md"
            style={{
              background: "rgba(255,248,230,0.88)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderColor: "rgba(200,165,90,0.22)"
            }}
          >
            No artifacts found
          </div>
        ) : (
          <ArtifactGrid artifacts={filteredArtifacts} onArtifactClick={handleArtifactClick} />
        )}

        {/* About section */}
        <div
          className="mt-12 rounded-[18px] px-10 py-9 border shadow-xl"
          style={{ 
            background: "rgba(255,248,230,0.90)", 
            backdropFilter: "blur(10px)", 
            WebkitBackdropFilter: "blur(10px)",
            borderColor: "rgba(200,165,90,0.22)"
          }}
        >
          <div
            className="w-9 h-[2px] mb-5 rounded-full"
            style={{ background: "linear-gradient(90deg, #9a6f2a, #c9943a)" }}
          />
          <h2 className="text-[1.4rem] font-bold text-[#1c1409] mb-3 font-serif">
            About This Collection
          </h2>
          <p className="text-gray-600 leading-[1.85] mb-3 font-sans">
            This collection showcases traditional Vedda artifacts spanning thousands
            of years of indigenous culture in Sri Lanka. Each artifact tells a story
            of the Vedda people&apos;s deep connection with the forest, their
            ingenious use of natural materials, and their rich spiritual traditions.
          </p>
          <p className="text-gray-600 leading-[1.85] font-sans">
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


