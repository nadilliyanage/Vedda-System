import { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  getAllFeedback,
  reviewFeedback,
  getFeedbackStats,
} from "../services/feedbackService";

import LoadingScreen from "../components/ui/LoadingScreen";

const STATUS_BADGES = {
  pending: {
    className: "admin-badge-pending",
    icon: Clock,
    label: "Pending",
  },
  approved: {
    className: "admin-badge-approved",
    icon: CheckCircle,
    label: "Approved",
  },
  rejected: {
    className: "admin-badge-rejected",
    icon: XCircle,
    label: "Rejected",
  },
};

const TYPE_LABELS = {
  edit_suggestion: {
    label: "Edit Suggestion",
    classes: "bg-sky-900/25 text-sky-300 border border-sky-500/25",
  },
  correction: {
    label: "Correction",
    classes: "bg-red-900/25 text-red-300 border border-red-500/25",
  },
  new_info: {
    label: "New Information",
    classes: "bg-green-900/25 text-green-300 border border-green-500/25",
  },
  general: {
    label: "General",
    classes: "bg-stone-700/35 text-stone-300 border border-stone-500/25",
  },
};

const AdminFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.feedbackType = typeFilter;

      const response = await getAllFeedback(params);
      if (response.success) {
        setFeedbackList(response.feedback);
        setPagination((prev) => ({
          ...prev,
          total: response.pagination.total,
          pages: response.pagination.pages,
        }));
      }
    } catch (error) {
      console.error("Fetch feedback error:", error);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getFeedbackStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [pagination.page, statusFilter, typeFilter]);

  const handleReview = async (feedbackId, status) => {
    setReviewingId(feedbackId);
    try {
      const response = await reviewFeedback(feedbackId, status, reviewNote);
      if (response.success) {
        toast.success(
          status === "approved"
            ? "Feedback approved & changes applied to artifact!"
            : "Feedback rejected",
        );
        setReviewNote("");
        setExpandedId(null);
        fetchFeedback();
        fetchStats();
      }
    } catch (error) {
      console.error("Review error:", error);
      toast.error(error.response?.data?.message || "Failed to review feedback");
    } finally {
      setReviewingId(null);
    }
  };

  const filteredFeedback = searchTerm
    ? feedbackList.filter(
        (f) =>
          f.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.artifactId?.name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          f.suggestedChanges?.additionalInfo
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
    : feedbackList;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
          Feedback Management
        </h1>
        <p className="mt-2" style={{ color: "rgba(212,180,131,0.70)" }}>
          Review and manage community feedback on cultural artifacts
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="admin-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "rgba(212,180,131,0.65)" }}
                >
                  Total Feedback
                </p>
                <p className="text-2xl font-bold" style={{ color: "#f5e9c8" }}>
                  {stats.total}
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgba(99,102,241,0.18)" }}
              >
                <BarChart3 style={{ color: "#818cf8" }} size={24} />
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "rgba(212,180,131,0.65)" }}
                >
                  Pending Review
                </p>
                <p className="text-2xl font-bold" style={{ color: "#fbbf24" }}>
                  {stats.byStatus?.pending || 0}
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgba(217,119,6,0.18)" }}
              >
                <Clock style={{ color: "#fbbf24" }} size={24} />
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "rgba(212,180,131,0.65)" }}
                >
                  Approved
                </p>
                <p className="text-2xl font-bold" style={{ color: "#86efac" }}>
                  {stats.byStatus?.approved || 0}
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgba(22,163,74,0.18)" }}
              >
                <CheckCircle style={{ color: "#86efac" }} size={24} />
              </div>
            </div>
          </div>

          <div className="admin-stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p
                  className="text-sm"
                  style={{ color: "rgba(212,180,131,0.65)" }}
                >
                  This Week
                </p>
                <p className="text-2xl font-bold" style={{ color: "#c084fc" }}>
                  {stats.recentWeek || 0}
                </p>
              </div>
              <div
                className="p-3 rounded-lg"
                style={{ background: "rgba(126,34,206,0.18)" }}
              >
                <MessageSquare style={{ color: "#c084fc" }} size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="admin-glass p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or artifact name..."
                className="admin-input w-full"
                style={{ paddingLeft: "2.5rem" }}
              />
              <Search
                className="absolute left-3 top-2.5"
                style={{ color: "rgba(212,180,131,0.45)" }}
                size={20}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-48">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="admin-select w-full"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="w-full lg:w-48">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="admin-select w-full"
            >
              <option value="">All Types</option>
              <option value="edit_suggestion">Edit Suggestion</option>
              <option value="correction">Correction</option>
              <option value="new_info">New Information</option>
              <option value="general">General</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={() => {
              fetchFeedback();
              fetchStats();
            }}
            className="admin-btn-secondary px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        <div
          className="mt-4 pt-4 flex items-center justify-between text-sm"
          style={{
            borderTop: "1px solid rgba(200,165,90,0.18)",
            color: "rgba(212,180,131,0.65)",
          }}
        >
          <span>
            Showing{" "}
            <strong style={{ color: "#d4b483" }}>
              {filteredFeedback.length}
            </strong>{" "}
            of <strong style={{ color: "#d4b483" }}>{pagination.total}</strong>{" "}
            feedback items
          </span>
          {(statusFilter || typeFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
                setSearchTerm("");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              style={{ color: "#d4b483" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#f5e9c8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#d4b483";
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Feedback List */}
      {loading ? (
        <LoadingScreen />
      ) : filteredFeedback.length > 0 ? (
        <div className="space-y-4">
          {filteredFeedback.map((feedback) => {
            const statusBadge = STATUS_BADGES[feedback.status];
            const typeInfo =
              TYPE_LABELS[feedback.feedbackType] || TYPE_LABELS.general;
            const StatusIcon = statusBadge.icon;
            const isExpanded = expandedId === feedback._id;

            return (
              <div
                key={feedback._id}
                className="admin-glass overflow-hidden transition-all"
              >
                {/* Summary Row */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer transition-colors"
                  style={{ borderRadius: "inherit" }}
                  onClick={() =>
                    setExpandedId(isExpanded ? null : feedback._id)
                  }
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.className}`}
                    >
                      <StatusIcon size={14} />
                      {statusBadge.label}
                    </span>

                    {/* Type Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${typeInfo.classes}`}
                    >
                      {typeInfo.label}
                    </span>

                    {/* Artifact & User Info */}
                    <div className="min-w-0 flex-1">
                      <p
                        className="font-medium truncate"
                        style={{ color: "#f5e9c8" }}
                      >
                        {feedback.artifactId?.name || "Unknown Artifact"}
                      </p>
                      <p
                        className="text-sm"
                        style={{ color: "rgba(212,180,131,0.60)" }}
                      >
                        by {feedback.username} &middot;{" "}
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div
                    className="ml-4"
                    style={{ color: "rgba(212,180,131,0.55)" }}
                  >
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div
                    className="p-5"
                    style={{
                      borderTop: "1px solid rgba(200,165,90,0.18)",
                      background: "rgba(0,0,0,0.25)",
                    }}
                  >
                    {/* Suggested Changes — Side by Side */}
                    <h4
                      className="font-semibold mb-3"
                      style={{ color: "#d4b483" }}
                    >
                      Suggested Changes
                    </h4>
                    <div className="space-y-3 mb-4">
                      {feedback.suggestedChanges?.name && (
                        <div
                          className="grid grid-cols-2 gap-4 p-3 rounded-lg"
                          style={{
                            background: "rgba(255,248,230,0.05)",
                            border: "1px solid rgba(200,165,90,0.15)",
                          }}
                        >
                          <div>
                            <p
                              className="text-xs mb-1"
                              style={{ color: "rgba(212,180,131,0.50)" }}
                            >
                              Current Name
                            </p>
                            <p
                              className="text-sm"
                              style={{ color: "rgba(212,180,131,0.80)" }}
                            >
                              {feedback.artifactId?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p
                              className="text-xs mb-1 font-medium"
                              style={{ color: "#86efac" }}
                            >
                              Suggested Name
                            </p>
                            <p
                              className="text-sm font-medium"
                              style={{ color: "#86efac" }}
                            >
                              {feedback.suggestedChanges.name}
                            </p>
                          </div>
                        </div>
                      )}

                      {feedback.suggestedChanges?.description && (
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            background: "rgba(255,248,230,0.05)",
                            border: "1px solid rgba(200,165,90,0.15)",
                          }}
                        >
                          <p
                            className="text-xs mb-1 font-medium"
                            style={{ color: "#86efac" }}
                          >
                            Suggested Description
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "rgba(212,180,131,0.80)" }}
                          >
                            {feedback.suggestedChanges.description}
                          </p>
                        </div>
                      )}

                      {feedback.suggestedChanges?.category && (
                        <div
                          className="grid grid-cols-2 gap-4 p-3 rounded-lg"
                          style={{
                            background: "rgba(255,248,230,0.05)",
                            border: "1px solid rgba(200,165,90,0.15)",
                          }}
                        >
                          <div>
                            <p
                              className="text-xs mb-1"
                              style={{ color: "rgba(212,180,131,0.50)" }}
                            >
                              Current Category
                            </p>
                            <p
                              className="text-sm capitalize"
                              style={{ color: "rgba(212,180,131,0.80)" }}
                            >
                              {feedback.artifactId?.category || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p
                              className="text-xs mb-1 font-medium"
                              style={{ color: "#86efac" }}
                            >
                              Suggested Category
                            </p>
                            <p
                              className="text-sm font-medium capitalize"
                              style={{ color: "#86efac" }}
                            >
                              {feedback.suggestedChanges.category}
                            </p>
                          </div>
                        </div>
                      )}

                      {feedback.suggestedChanges?.tags?.length > 0 && (
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            background: "rgba(255,248,230,0.05)",
                            border: "1px solid rgba(200,165,90,0.15)",
                          }}
                        >
                          <p
                            className="text-xs mb-1 font-medium"
                            style={{ color: "#86efac" }}
                          >
                            Suggested Tags
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {feedback.suggestedChanges.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                  background: "rgba(22,163,74,0.18)",
                                  color: "#86efac",
                                }}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {feedback.suggestedChanges?.location && (
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            background: "rgba(255,248,230,0.05)",
                            border: "1px solid rgba(200,165,90,0.15)",
                          }}
                        >
                          <p
                            className="text-xs mb-1 font-medium"
                            style={{ color: "#86efac" }}
                          >
                            Suggested Location
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "rgba(212,180,131,0.80)" }}
                          >
                            {feedback.suggestedChanges.location}
                          </p>
                        </div>
                      )}

                      {feedback.suggestedChanges?.additionalInfo && (
                        <div
                          className="p-3 rounded-lg"
                          style={{
                            background: "rgba(255,248,230,0.05)",
                            border: "1px solid rgba(200,165,90,0.15)",
                          }}
                        >
                          <p
                            className="text-xs mb-1 font-medium"
                            style={{ color: "rgba(147,197,253,0.80)" }}
                          >
                            Additional Information
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "rgba(212,180,131,0.80)" }}
                          >
                            {feedback.suggestedChanges.additionalInfo}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Suggested Images */}
                    {feedback.suggestedImages?.length > 0 && (
                      <div
                        className="p-3 rounded-lg mb-4"
                        style={{
                          background: "rgba(255,248,230,0.05)",
                          border: "1px solid rgba(200,165,90,0.15)",
                        }}
                      >
                        <p
                          className="text-xs mb-2 font-medium"
                          style={{ color: "rgba(192,132,252,0.80)" }}
                        >
                          Suggested Images ({feedback.suggestedImages.length})
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {feedback.suggestedImages.map((img, i) => (
                            <a
                              key={i}
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <img
                                src={img.url}
                                alt={`Suggested ${i + 1}`}
                                className="w-full h-24 object-cover rounded-lg border border-gray-200 hover:border-purple-400 transition-colors cursor-pointer"
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Review Note (for already reviewed) */}
                    {feedback.reviewNote && (
                      <div
                        className="p-3 rounded-lg mb-4"
                        style={{
                          background: "rgba(255,248,230,0.05)",
                          border: "1px solid rgba(200,165,90,0.15)",
                        }}
                      >
                        <p
                          className="text-xs mb-1"
                          style={{ color: "rgba(212,180,131,0.50)" }}
                        >
                          Review Note
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "rgba(212,180,131,0.80)" }}
                        >
                          {feedback.reviewNote}
                        </p>
                      </div>
                    )}

                    {/* Actions for Pending */}
                    {feedback.status === "pending" && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label
                            className="block text-sm font-medium mb-1"
                            style={{ color: "rgba(212,180,131,0.70)" }}
                          >
                            Review Note (optional)
                          </label>
                          <textarea
                            value={
                              expandedId === feedback._id ? reviewNote : ""
                            }
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Add a note about your decision..."
                            rows={2}
                            className="admin-textarea w-full text-sm resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleReview(feedback._id, "approved")
                            }
                            disabled={reviewingId === feedback._id}
                            className="flex-1 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                            style={{
                              background: "rgba(22,163,74,0.85)",
                              color: "#fff",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(22,163,74,1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(22,163,74,0.85)";
                            }}
                          >
                            <CheckCircle size={18} />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleReview(feedback._id, "rejected")
                            }
                            disabled={reviewingId === feedback._id}
                            className="flex-1 px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                            style={{
                              background: "rgba(220,38,38,0.85)",
                              color: "#fff",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "rgba(220,38,38,1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "rgba(220,38,38,0.85)";
                            }}
                          >
                            <XCircle size={18} />
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="admin-btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {[...Array(pagination.pages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: i + 1 }))
                  }
                  className={`px-4 py-2 rounded-lg ${
                    pagination.page === i + 1
                      ? "admin-btn-primary"
                      : "admin-btn-secondary"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.pages, prev.page + 1),
                  }))
                }
                disabled={pagination.page === pagination.pages}
                className="admin-btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="admin-glass p-12 text-center">
          <div className="mb-4" style={{ color: "rgba(212,180,131,0.40)" }}>
            <MessageSquare size={64} className="mx-auto" />
          </div>
          <h3
            className="text-xl font-semibold mb-2"
            style={{ color: "#f5e9c8" }}
          >
            No feedback found
          </h3>
          <p style={{ color: "rgba(212,180,131,0.65)" }}>
            {statusFilter || typeFilter || searchTerm
              ? "Try adjusting your filters"
              : "No community feedback has been submitted yet"}
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
