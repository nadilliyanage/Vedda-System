import { useState, useEffect} from "react";
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
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: Clock,
    label: "Pending",
  },
  approved: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle,
    label: "Approved",
  },
  rejected: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: XCircle,
    label: "Rejected",
  },
};

const TYPE_LABELS = {
  edit_suggestion: { label: "Edit Suggestion", color: "blue" },
  correction: { label: "Correction", color: "red" },
  new_info: { label: "New Information", color: "green" },
  general: { label: "General", color: "gray" },
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
            : "Feedback rejected"
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
          f.artifactId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          f.suggestedChanges?.additionalInfo
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : feedbackList;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Feedback Management</h1>
        <p className="text-gray-600 mt-2">
          Review and manage community feedback on cultural artifacts
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-800">
                  {stats.total}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.byStatus?.pending || 0}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.byStatus?.approved || 0}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">This Week</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.recentWeek || 0}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <MessageSquare className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by username or artifact name..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing <strong>{filteredFeedback.length}</strong> of{" "}
            <strong>{pagination.total}</strong> feedback items
          </span>
          {(statusFilter || typeFilter || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setTypeFilter("");
                setSearchTerm("");
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
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
            const typeInfo = TYPE_LABELS[feedback.feedbackType] || TYPE_LABELS.general;
            const StatusIcon = statusBadge.icon;
            const isExpanded = expandedId === feedback._id;

            return (
              <div
                key={feedback._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all"
              >
                {/* Summary Row */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : feedback._id)
                  }
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.bg} ${statusBadge.text}`}
                    >
                      <StatusIcon size={14} />
                      {statusBadge.label}
                    </span>

                    {/* Type Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium bg-${typeInfo.color}-100 text-${typeInfo.color}-800`}
                    >
                      {typeInfo.label}
                    </span>

                    {/* Artifact & User Info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 truncate">
                        {feedback.artifactId?.name || "Unknown Artifact"}
                      </p>
                      <p className="text-sm text-gray-500">
                        by {feedback.username} &middot;{" "}
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Expand Icon */}
                  <div className="text-gray-400 ml-4">
                    {isExpanded ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    {/* Suggested Changes — Side by Side */}
                    <h4 className="font-semibold text-gray-700 mb-3">
                      Suggested Changes
                    </h4>
                    <div className="space-y-3 mb-4">
                      {feedback.suggestedChanges?.name && (
                        <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-lg border">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Current Name</p>
                            <p className="text-sm text-gray-700">
                              {feedback.artifactId?.name || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 mb-1 font-medium">
                              Suggested Name
                            </p>
                            <p className="text-sm text-green-700 font-medium">
                              {feedback.suggestedChanges.name}
                            </p>
                          </div>
                        </div>
                      )}

                      {feedback.suggestedChanges?.description && (
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-green-600 mb-1 font-medium">
                            Suggested Description
                          </p>
                          <p className="text-sm text-gray-700">
                            {feedback.suggestedChanges.description}
                          </p>
                        </div>
                      )}

                      {feedback.suggestedChanges?.category && (
                        <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-lg border">
                          <div>
                            <p className="text-xs text-gray-400 mb-1">Current Category</p>
                            <p className="text-sm text-gray-700 capitalize">
                              {feedback.artifactId?.category || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-green-600 mb-1 font-medium">
                              Suggested Category
                            </p>
                            <p className="text-sm text-green-700 font-medium capitalize">
                              {feedback.suggestedChanges.category}
                            </p>
                          </div>
                        </div>
                      )}

                      {feedback.suggestedChanges?.tags?.length > 0 && (
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-green-600 mb-1 font-medium">
                            Suggested Tags
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {feedback.suggestedChanges.tags.map((tag, i) => (
                              <span
                                key={i}
                                className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {feedback.suggestedChanges?.location && (
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-green-600 mb-1 font-medium">
                            Suggested Location
                          </p>
                          <p className="text-sm text-gray-700">
                            {feedback.suggestedChanges.location}
                          </p>
                        </div>
                      )}

                      {feedback.suggestedChanges?.additionalInfo && (
                        <div className="bg-white p-3 rounded-lg border">
                          <p className="text-xs text-blue-600 mb-1 font-medium">
                            Additional Information
                          </p>
                          <p className="text-sm text-gray-700">
                            {feedback.suggestedChanges.additionalInfo}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Suggested Images */}
                    {feedback.suggestedImages?.length > 0 && (
                      <div className="bg-white p-3 rounded-lg border mb-4">
                        <p className="text-xs text-purple-600 mb-2 font-medium">
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
                      <div className="bg-white p-3 rounded-lg border mb-4">
                        <p className="text-xs text-gray-400 mb-1">Review Note</p>
                        <p className="text-sm text-gray-700">
                          {feedback.reviewNote}
                        </p>
                      </div>
                    )}

                    {/* Actions for Pending */}
                    {feedback.status === "pending" && (
                      <div className="mt-4 space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-1">
                            Review Note (optional)
                          </label>
                          <textarea
                            value={expandedId === feedback._id ? reviewNote : ""}
                            onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="Add a note about your decision..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() =>
                              handleReview(feedback._id, "approved")
                            }
                            disabled={reviewingId === feedback._id}
                            className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <CheckCircle size={18} />
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleReview(feedback._id, "rejected")
                            }
                            disabled={reviewingId === feedback._id}
                            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 hover:bg-gray-50"
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
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-gray-400 mb-4">
            <MessageSquare size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No feedback found
          </h3>
          <p className="text-gray-500">
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
