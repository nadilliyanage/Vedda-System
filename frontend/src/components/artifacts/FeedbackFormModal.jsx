import { useState } from "react";
import PropTypes from "prop-types";
import { FaTimes, FaPaperPlane, FaInfoCircle } from "react-icons/fa";
import { submitFeedback } from "../../services/feedbackService";
import { useAuth } from "../../contexts/AuthContext";
import toast from "react-hot-toast";

const FEEDBACK_TYPES = [
  {
    value: "edit_suggestion",
    label: "Edit Suggestion",
    description: "Suggest changes to existing information",
    color: "blue",
  },
  {
    value: "correction",
    label: "Correction",
    description: "Report incorrect or inaccurate information",
    color: "red",
  },
  {
    value: "new_info",
    label: "New Information",
    description: "Add missing details or new findings",
    color: "green",
  },
  {
    value: "general",
    label: "General Feedback",
    description: "General comments or observations",
    color: "gray",
  },
];

const CATEGORIES = ["tools", "pottery", "jewelry", "weapons", "clothing", "other"];

const FeedbackFormModal = ({ isOpen, onClose, artifact }) => {
  const { user } = useAuth();
  const [feedbackType, setFeedbackType] = useState("edit_suggestion");
  const [suggestedChanges, setSuggestedChanges] = useState({
    name: "",
    description: "",
    category: "",
    tags: "",
    location: "",
    additionalInfo: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !artifact) return null;

  const handleChange = (field, value) => {
    setSuggestedChanges((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Build changes object — only include non-empty fields
    const changes = {};
    if (suggestedChanges.name.trim()) changes.name = suggestedChanges.name.trim();
    if (suggestedChanges.description.trim())
      changes.description = suggestedChanges.description.trim();
    if (suggestedChanges.category) changes.category = suggestedChanges.category;
    if (suggestedChanges.tags.trim())
      changes.tags = suggestedChanges.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    if (suggestedChanges.location.trim())
      changes.location = suggestedChanges.location.trim();
    if (suggestedChanges.additionalInfo.trim())
      changes.additionalInfo = suggestedChanges.additionalInfo.trim();

    if (Object.keys(changes).length === 0) {
      toast.error("Please provide at least one suggested change or additional information");
      return;
    }

    setSubmitting(true);
    try {
      await submitFeedback({
        artifactId: artifact._id,
        feedbackType,
        suggestedChanges: changes,
        username: user?.username || "Anonymous",
      });
      toast.success("Feedback submitted! It will be reviewed by a curator.");
      onClose();
      // Reset form
      setSuggestedChanges({
        name: "",
        description: "",
        category: "",
        tags: "",
        location: "",
        additionalInfo: "",
      });
      setFeedbackType("edit_suggestion");
    } catch (error) {
      console.error("Submit feedback error:", error);
      toast.error(
        error.response?.data?.message || "Failed to submit feedback"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-yellow-50 shadow-md p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-black">Suggest an Edit</h2>
            <p className="text-black text-sm mt-1">
              for &ldquo;{artifact.name}&rdquo;
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <FaTimes size={20} color="black" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Feedback Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Feedback Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {FEEDBACK_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFeedbackType(type.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    feedbackType === type.value
                      ? "border-purple-500 bg-purple-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="font-medium text-sm text-gray-800">
                    {type.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {type.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Current Details Reference */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <FaInfoCircle className="text-blue-500" />
              <span className="text-sm font-semibold text-gray-700">
                Current Details (reference)
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">Name:</span> {artifact.name}
              </p>
              <p>
                <span className="font-medium">Category:</span>{" "}
                <span className="capitalize">{artifact.category}</span>
              </p>
              {artifact.location && (
                <p>
                  <span className="font-medium">Location:</span>{" "}
                  {artifact.location}
                </p>
              )}
              <p className="line-clamp-2">
                <span className="font-medium">Description:</span>{" "}
                {artifact.description}
              </p>
              {artifact.tags?.length > 0 && (
                <p>
                  <span className="font-medium">Tags:</span>{" "}
                  {artifact.tags.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Suggested Changes */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Your Suggested Changes
              <span className="text-gray-400 font-normal ml-1">
                (fill only fields you want to change)
              </span>
            </h3>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Suggested Name
              </label>
              <input
                type="text"
                value={suggestedChanges.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder={artifact.name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Suggested Description
              </label>
              <textarea
                value={suggestedChanges.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter a corrected or improved description..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Suggested Category
              </label>
              <select
                value={suggestedChanges.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="">-- No change --</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Suggested Tags
                <span className="text-gray-400 font-normal ml-1">
                  (comma-separated)
                </span>
              </label>
              <input
                type="text"
                value={suggestedChanges.tags}
                onChange={(e) => handleChange("tags", e.target.value)}
                placeholder="e.g. traditional, hunting, ancient"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Suggested Location
              </label>
              <input
                type="text"
                value={suggestedChanges.location}
                onChange={(e) => handleChange("location", e.target.value)}
                placeholder={artifact.location || "Enter a location..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Additional Info */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Additional Information / Comments
              </label>
              <textarea
                value={suggestedChanges.additionalInfo}
                onChange={(e) => handleChange("additionalInfo", e.target.value)}
                placeholder="Any extra context, sources, or details you'd like to share..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-3 text-black border-2 border-gray-300 rounded-lg hover:bg-gray-500 hover:text-white transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Submitting...
                </>
              ) : (
                <>
                  <FaPaperPlane />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

FeedbackFormModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  artifact: PropTypes.object,
};

export default FeedbackFormModal;
