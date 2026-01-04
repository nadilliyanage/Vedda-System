import { useState, useEffect } from "react";
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

  const fetchArtifacts = async () => {
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
      console.log('API Response:', response);
      
      if (response.success) {
        // The artifacts are directly on the response object
        const artifacts = response.artifacts || [];
        console.log('Artifacts found:', artifacts.length, artifacts);
        setFilteredArtifacts(artifacts);
      } else {
        console.log('No artifacts in response');
        setFilteredArtifacts([]);
      }
    } catch (error) {
      console.error('Error fetching artifacts:', error);
      toast.error('Failed to load artifacts');
      setFilteredArtifacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtifacts();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [selectedCategory, searchQuery]);

  const handleArtifactClick = (artifact) => {
    setSelectedArtifact(artifact);
  };

  const handleCloseModal = () => {
    setSelectedArtifact(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 mt-16">
      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span className="font-medium">Back to Home</span>
            </button>
            <div className="flex items-center text-purple-600">
              <FaLandmark className="mr-2" />
              <span className="font-semibold">
                {filteredArtifacts.length} Artifact{filteredArtifacts.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-3">
            Vedda Artifact Learning System
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            Explore the rich cultural heritage of the indigenous Vedda people
            through their traditional artifacts, tools, and ceremonial objects
          </p>
          {/* Identify Artifact Button */}
          <button
            onClick={() => setShowIdentifyModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold"
          >
            <Sparkles size={20} />
            Identify Artifact
          </button>
        </div>

        {/* Search */}
        <ArtifactSearch
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Category Filter */}
        <ArtifactFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Artifacts Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : filteredArtifacts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No artifacts found</p>
          </div>
        ) : (
          <ArtifactGrid
            artifacts={filteredArtifacts}
            onArtifactClick={handleArtifactClick}
          />
        )}

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            About This Collection
          </h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            This collection showcases traditional Vedda artifacts spanning thousands
            of years of indigenous culture in Sri Lanka. Each artifact tells a story
            of the Vedda people&apos;s deep connection with the forest, their
            ingenious use of natural materials, and their rich spiritual traditions.
          </p>
          <p className="text-gray-700 leading-relaxed">
            The Vedda people (Wanniyala-Aetto) are the indigenous inhabitants of Sri
            Lanka, with a heritage dating back over 16,000 years. Their artifacts
            represent not just tools and objects, but a complete way of life in
            harmony with nature. By learning about these artifacts, we help preserve
            and honor this ancient culture for future generations.
          </p>
        </div>
      </div>

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <ArtifactDetailModal
          artifact={selectedArtifact}
          onClose={handleCloseModal}
          onArtifactClick={handleArtifactClick}
        />
      )}

      {/* Identify Artifact Modal */}
      <IdentifyArtifactModal
        isOpen={showIdentifyModal}
        onClose={() => setShowIdentifyModal(false)}
      />
    </div>
  );
};

export default ArtifactPage;
