import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaLandmark } from "react-icons/fa";
import {
  artifacts,
  getArtifactsByCategory,
  searchArtifacts,
} from "../data/artifacts";
import ArtifactFilter from "../components/artifacts/ArtifactFilter";
import ArtifactSearch from "../components/artifacts/ArtifactSearch";
import ArtifactGrid from "../components/artifacts/ArtifactGrid";
import ArtifactDetailModal from "../components/artifacts/ArtifactDetailModal";

const ArtifactPage = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredArtifacts, setFilteredArtifacts] = useState(artifacts);
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  useEffect(() => {
    let results = artifacts;

    // Apply category filter
    if (selectedCategory !== "all") {
      results = getArtifactsByCategory(selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      results = searchArtifacts(searchQuery);
      // If both filters are active, intersect the results
      if (selectedCategory !== "all") {
        const categoryResults = getArtifactsByCategory(selectedCategory);
        results = results.filter((artifact) =>
          categoryResults.some((cat) => cat.id === artifact.id)
        );
      }
    }

    setFilteredArtifacts(results);
  }, [selectedCategory, searchQuery]);

  const handleArtifactClick = (artifact) => {
    setSelectedArtifact(artifact);
    // Scroll to top when modal opens
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCloseModal = () => {
    setSelectedArtifact(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100">
      {/* Header */}
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
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explore the rich cultural heritage of the indigenous Vedda people
            through their traditional artifacts, tools, and ceremonial objects
          </p>
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
        <ArtifactGrid
          artifacts={filteredArtifacts}
          onArtifactClick={handleArtifactClick}
        />

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
    </div>
  );
};

export default ArtifactPage;
