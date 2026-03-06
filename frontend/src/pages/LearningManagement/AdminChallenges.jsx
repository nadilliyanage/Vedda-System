import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEdit, FaTrash, FaPlus, FaSave, FaSearch, FaTimes } from "react-icons/fa";
import {
  challengesAPI,
  lessonsAPI,
  categoriesAPI,
} from "../../services/learningAPI";
import { SKILL_TAGS, TAG_COLORS } from "../../constants/skillTags";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingScreen from "../../components/ui/LoadingScreen";

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("list"); // 'list', 'add', 'edit', 'view'
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    challengeId: null,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");

  // Top-level form data
  const [formData, setFormData] = useState({
    id: "",
    lessonId: "",
    categoryId: "",
    challengeNumber: "",
    skillTags: [],
    question: {
      questionNo: "1",
      type: "multiple_choice",
      prompt: "",
      xp: 1,
      points: 1,
      timeLimitSec: 30,
      rest: "",
      options: [
        { id: "A", text: "", correct: false },
        { id: "B", text: "", correct: false },
      ],
      answer: "",
      pairs: [{ left: "", right: "" }],
    },
  });

  useEffect(() => {
    if (activeView === "list") {
      fetchChallenges();
      fetchLessons();
      fetchCategories();
    }
  }, [activeView]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await challengesAPI.getAll();
      setChallenges(response.data);
    } catch (error) {
      toast.error("Failed to fetch challenges");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await lessonsAPI.getAll();
      setLessons(response.data);
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const openAddForm = () => {
    setFormData({
      id: "",
      lessonId: "",
      categoryId: "",
      challengeNumber: "",
      skillTags: [],
      question: {
        questionNo: "1",
        type: "multiple_choice",
        prompt: "",
        xp: 1,
        points: 1,
        timeLimitSec: 30,
        rest: "",
        options: [
          { id: "A", text: "", correct: false },
          { id: "B", text: "", correct: false },
        ],
        answer: "",
        pairs: [{ left: "", right: "" }],
      },
    });
    setCurrentChallenge(null);
    setActiveView("add");
  };

  const openEditForm = (challenge) => {
    setFormData({
      id: challenge.id,
      lessonId: challenge.lessonId || "",
      categoryId: challenge.categoryId || "",
      challengeNumber: challenge.challengeNumber || "",
      skillTags: challenge.skillTags || [],
      question: challenge.question || {
        questionNo: "1",
        type: "multiple_choice",
        prompt: "",
        xp: 1,
        points: 1,
        timeLimitSec: 30,
        rest: "",
        options: [
          { id: "A", text: "", correct: false },
          { id: "B", text: "", correct: false },
        ],
        answer: "",
        pairs: [{ left: "", right: "" }],
      },
    });
    setCurrentChallenge(challenge);
    setActiveView("edit");
  };

  const openViewForm = (challenge) => {
    setCurrentChallenge(challenge);
    setActiveView("view");
  };

  const handleSubmit = async () => {
    if (!formData.challengeNumber) {
      toast.error("Please enter challenge number");
      return;
    }

    if (!formData.question.prompt) {
      toast.error("Please fill in the question prompt");
      return;
    }

    // Validate based on question type
    const question = formData.question;
    if (question.type === "multiple_choice") {
      const validOptions = question.options.filter((o) => o.text.trim());
      if (validOptions.length < 2) {
        toast.error("Multiple choice requires at least 2 options");
        return;
      }
      const hasCorrect = question.options.some(
        (o) => o.correct && o.text.trim(),
      );
      if (!hasCorrect) {
        toast.error("Please mark at least one option as correct");
        return;
      }
    } else if (question.type === "text_input") {
      if (!question.answer || !question.answer.trim()) {
        toast.error("Please provide the expected answer");
        return;
      }
    } else if (question.type === "match_pairs") {
      const validPairs = question.pairs.filter(
        (p) => p.left.trim() && p.right.trim(),
      );
      if (validPairs.length < 1) {
        toast.error("Match pairs requires at least 1 complete pair");
        return;
      }
    }

    try {
      // Prepare question data based on type
      const questionData = {
        questionNo: "1", // Always 1 since there's only one question
        type: question.type,
        prompt: question.prompt,
        xp: parseInt(question.xp) || 1,
        points: parseInt(question.points) || 1,
        timeLimitSec: parseInt(question.timeLimitSec) || 30,
        rest: question.rest || "",
      };

      if (question.type === "multiple_choice") {
        questionData.options = question.options.filter((o) => o.text.trim());
        questionData.correctOptions = question.options
          .filter((o) => o.correct && o.text.trim())
          .map((o) => o.id);
        // Add correct_answer field with text values
        const correctOptions = question.options.filter(
          (o) => o.correct && o.text.trim(),
        );
        questionData.correct_answer = correctOptions
          .map((o) => o.text)
          .join(", ");
      } else if (question.type === "text_input") {
        questionData.answer = question.answer;
        questionData.correct_answer = question.answer || "";
      } else if (question.type === "match_pairs") {
        questionData.pairs = question.pairs.filter(
          (p) => p.left.trim() && p.right.trim(),
        );
        const validPairs = question.pairs.filter(
          (p) => p.left.trim() && p.right.trim(),
        );
        questionData.correct_answer = validPairs
          .map((p) => `${p.left}: ${p.right}`)
          .join(", ");
      }

      const submitData = {
        id: formData.id || `ch${formData.challengeNumber}`,
        lessonId: formData.lessonId || "",
        categoryId: formData.categoryId || "",
        challengeNumber: formData.challengeNumber,
        skillTags: formData.skillTags || [],
        question: questionData,
      };

      if (activeView === "add") {
        await challengesAPI.create(submitData);
        toast.success("Challenge created successfully");
      } else if (activeView === "edit") {
        await challengesAPI.update(formData.id, submitData);
        toast.success("Challenge updated successfully");
      }

      setActiveView("list");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save challenge");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await challengesAPI.delete(confirmDialog.challengeId);
      toast.success("Challenge deleted successfully");
      fetchChallenges();
    } catch (error) {
      toast.error("Failed to delete challenge");
      console.error(error);
    }
  };

  const getLessonName = (lessonId) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    return lesson ? lesson.topic : "N/A";
  };

  const filteredChallenges = useMemo(() => {
    return challenges.filter((challenge) => {
      const matchesSearch =
        !searchTerm ||
        challenge.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challenge.question?.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(challenge.challengeNumber)?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        !filterType || challenge.question?.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [challenges, searchTerm, filterType]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("");
  };

  const hasActiveFilters = searchTerm || filterType;

  const addOption = () => {
    const nextId = String.fromCharCode(65 + formData.question.options.length); // A, B, C, D...
    setFormData({
      ...formData,
      question: {
        ...formData.question,
        options: [
          ...formData.question.options,
          { id: nextId, text: "", correct: false },
        ],
      },
    });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...formData.question.options];
    newOptions[index][field] = value;
    setFormData({
      ...formData,
      question: {
        ...formData.question,
        options: newOptions,
      },
    });
  };

  const removeOption = (index) => {
    if (formData.question.options.length <= 2) {
      toast.error("At least 2 options required");
      return;
    }
    setFormData({
      ...formData,
      question: {
        ...formData.question,
        options: formData.question.options.filter((_, i) => i !== index),
      },
    });
  };

  const addPair = () => {
    setFormData({
      ...formData,
      question: {
        ...formData.question,
        pairs: [...formData.question.pairs, { left: "", right: "" }],
      },
    });
  };

  const updatePair = (index, field, value) => {
    const newPairs = [...formData.question.pairs];
    newPairs[index][field] = value;
    setFormData({
      ...formData,
      question: {
        ...formData.question,
        pairs: newPairs,
      },
    });
  };

  const removePair = (index) => {
    if (formData.question.pairs.length <= 1) {
      toast.error("At least 1 pair required");
      return;
    }
    setFormData({
      ...formData,
      question: {
        ...formData.question,
        pairs: formData.question.pairs.filter((_, i) => i !== index),
      },
    });
  };

  const renderQuestionPreview = (question) => {
    return (
      <div className="admin-glass p-4 mb-3">
        <div className="flCh justify-between items-start mb-2">
          <div>
            <span
              className="font-semibold"
              style={{ color: "rgba(212,180,131,0.80)" }}
            >
              Question:
            </span>
            <span className="ml-2" style={{ color: "#f5e9c8" }}>
              {question.prompt}
            </span>
            <span
              className="ml-2 text-xs"
              style={{ color: "rgba(212,180,131,0.55)" }}
            >
              ({question.type.replace("_", " ")})
            </span>
          </div>
        </div>

        <div className="mt-3 ml-4 text-sm">
          {question.type === "multiple_choice" && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <div key={option.id} className="flCh items-center gap-2">
                  <input
                    type="checkbox"
                    checked={question.correctOptions?.includes(option.id)}
                    disabled
                    className="w-4 h-4"
                  />
                  <span
                    className="font-medium"
                    style={{ color: "rgba(212,180,131,0.80)" }}
                  >
                    {option.id}.
                  </span>
                  <span style={{ color: "#f5e9c8" }}>{option.text}</span>
                </div>
              ))}
            </div>
          )}

          {question.type === "text_input" && (
            <div
              className="rounded px-3 py-2"
              style={{
                background: "rgba(0,0,0,0.25)",
                color: "rgba(212,180,131,0.70)",
              }}
            >
              Your answer: <span className="italic">(Text input)</span>
            </div>
          )}

          {question.type === "match_pairs" && question.pairs && (
            <div className="space-y-2">
              {question.pairs.map((pair, idx) => (
                <div key={idx} className="flCh items-center gap-2">
                  <span
                    className="px-3 py-1 rounded"
                    style={{
                      background: "rgba(59,130,246,0.12)",
                      color: "#93c5fd",
                    }}
                  >
                    {pair.left}
                  </span>
                  <span style={{ color: "rgba(212,180,131,0.55)" }}>=</span>
                  <span
                    className="px-3 py-1 rounded"
                    style={{
                      background: "rgba(22,163,74,0.12)",
                      color: "#86efac",
                    }}
                  >
                    {pair.right}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          className="mt-2 text-xs"
          style={{ color: "rgba(212,180,131,0.55)" }}
        >
          {question.xp} XP • {question.points} Points • {question.timeLimitSec}s
        </div>
      </div>
    );
  };

  // List View
  if (activeView === "list") {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1
              className="text-3xl font-bold"
              style={{ color: "#f5e9c8" }}
            ></h1>
            <p className="mt-2" style={{ color: "rgba(212,180,131,0.70)" }}>
              Create practice challenges with questions
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="admin-btn-success px-4 py-2 flex items-center gap-2"
          >
            <FaPlus /> Add New
          </button>
        </div>

        {/* Filter Bar */}
        <div className="admin-glass p-4 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <FaSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                style={{ color: "rgba(212,180,131,0.45)" }}
              />
              <input
                type="text"
                placeholder="Search by prompt, number, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-input py-2 w-full text-sm"
                style={{ paddingLeft: "2.25rem" }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="admin-input py-2 text-sm min-w-[150px]"
            >
              <option value="">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="text_input">Text Input</option>
              <option value="match_pairs">Match Pairs</option>
            </select>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm rounded-lg transition-colors"
                style={{ color: "#f87171" }}
              >
                <FaTimes /> Clear
              </button>
            )}
            {hasActiveFilters && (
              <span
                className="text-xs ml-auto"
                style={{ color: "rgba(212,180,131,0.55)" }}
              >
                {filteredChallenges.length} of {challenges.length} challenges
              </span>
            )}
          </div>
        </div>

        <div className="admin-glass">
          {loading ? (
            <LoadingScreen message="Loading challenges..." />
          ) : filteredChallenges.length === 0 ? (
            <div className="text-center py-12">
              <p
                className="text-lg"
                style={{ color: "rgba(212,180,131,0.70)" }}
              >
                {hasActiveFilters ? "No challenges match your filters" : "No challenges found"}
              </p>
              <p className="mt-2" style={{ color: "rgba(212,180,131,0.50)" }}>
                {hasActiveFilters
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first challenge to get started"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="admin-table-head">
                  <tr>
                    <th className="hidden admin-table-th">ID</th>
                    <th className="admin-table-th">Challenge No.</th>
                    <th className="admin-table-th">Type</th>
                    <th className="admin-table-th">Rewards</th>
                    <th className="admin-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChallenges.map((challenge) => (
                    <tr key={challenge.id} className="admin-table-row">
                      <td
                        className="hidden admin-table-td whitespace-nowrap text-sm font-medium"
                        style={{ color: "#f5e9c8" }}
                      >
                        {challenge.id}
                      </td>
                      <td
                        className="admin-table-td whitespace-nowrap text-sm"
                        style={{ color: "#f5e9c8" }}
                      >
                        Ch {challenge.challengeNumber}
                      </td>
                      <td
                        className="admin-table-td whitespace-nowrap text-sm"
                        style={{ color: "rgba(212,180,131,0.70)" }}
                      >
                        {challenge.question?.type?.replace("_", " ") || "N/A"}
                      </td>
                      <td
                        className="admin-table-td whitespace-nowrap text-sm"
                        style={{ color: "rgba(212,180,131,0.70)" }}
                      >
                        {challenge.question?.xp || 0} XP
                      </td>
                      <td className="admin-table-td whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openViewForm(challenge)}
                            className="text-blue-400 hover:text-blue-300"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openEditForm(challenge)}
                            className="text-green-400 hover:text-green-300"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                challengeId: challenge.id,
                              })
                            }
                            className="text-red-400 hover:text-red-300"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, challengeId: null })}
          onConfirm={handleDelete}
          title="Delete Challenge"
          message="Are you sure you want to delete this challenge? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    );
  }

  // View Form
  if (activeView === "view" && currentChallenge) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
            View Challenge
          </h1>
        </div>

        <div className="admin-glass p-6">
          <div className="space-y-4 mb-6">
            <div className="max-w-xs">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Challenge Number
                </label>
                <p style={{ color: "#f5e9c8" }}>
                  Ch {currentChallenge.challengeNumber}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3
              className="text-lg font-semibold mb-3"
              style={{ color: "#f5e9c8" }}
            >
              Question
            </h3>
            {currentChallenge.question ? (
              renderQuestionPreview(currentChallenge.question)
            ) : (
              <p style={{ color: "rgba(212,180,131,0.55)" }}>
                No question added
              </p>
            )}
          </div>

          <div
            className="flex justify-end gap-3 mt-6 pt-6"
            style={{ borderTop: "1px solid rgba(200,165,90,0.18)" }}
          >
            <button
              onClick={() => setActiveView("list")}
              className="admin-btn-secondary px-4 py-2"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add/Edit Form
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
          {activeView === "add" ? "Add Challenge" : "Edit Challenge"}
        </h1>
      </div>

      <div className="admin-glass p-6">
        {/* Top Level Settings */}
        <div
          className="mb-6 pb-6"
          style={{ borderBottom: "1px solid rgba(200,165,90,0.18)" }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#f5e9c8" }}
          >
            Challenge Settings
          </h3>
          <div className="max-w-xs">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Challenge Number
              </label>
              <input
                type="text"
                value={formData.challengeNumber}
                onChange={(e) =>
                  setFormData({ ...formData, challengeNumber: e.target.value })
                }
                className="admin-input w-full"
                placeholder="e.g., 1"
                required
              />
            </div>
          </div>
        </div>

        {/* Question Builder */}
        <div
          className="mb-6 pb-6"
          style={{ borderBottom: "2px dashed rgba(200,165,90,0.20)" }}
        >
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#f5e9c8" }}
          >
            Question
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Question No.
                </label>
                <input
                  type="text"
                  value={formData.question.questionNo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      question: {
                        ...formData.question,
                        questionNo: e.target.value,
                      },
                    })
                  }
                  className="admin-input w-full"
                  placeholder="e.g., 1"
                  disabled
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Type
                </label>
                <select
                  value={formData.question.type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      question: { ...formData.question, type: e.target.value },
                    })
                  }
                  className="admin-select w-full"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text_input">Text Input</option>
                  <option value="match_pairs">Match Pairs</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  XP Reward
                </label>
                <input
                  type="number"
                  value={formData.question.xp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      question: { ...formData.question, xp: e.target.value },
                    })
                  }
                  className="admin-input w-full"
                  min="0"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Points
                </label>
                <input
                  type="number"
                  value={formData.question.points}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      question: {
                        ...formData.question,
                        points: e.target.value,
                      },
                    })
                  }
                  className="admin-input w-full"
                  min="0"
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Time Limit (sec)
                </label>
                <input
                  type="number"
                  value={formData.question.timeLimitSec}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      question: {
                        ...formData.question,
                        timeLimitSec: e.target.value,
                      },
                    })
                  }
                  className="admin-input w-full"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Prompt
              </label>
              <textarea
                value={formData.question.prompt}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    question: { ...formData.question, prompt: e.target.value },
                  })
                }
                className="admin-textarea w-full"
                rows="2"
                placeholder="Enter question prompt"
              />
            </div>

            {/* Skill Tags */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Skill Tags
              </label>
              <div className="flCh flex-wrap gap-2">
                {SKILL_TAGS.map((tag) => {
                  const isSelected = formData.skillTags.includes(tag.id);
                  const colorScheme = TAG_COLORS[tag.color];

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const newTags = isSelected
                          ? formData.skillTags.filter((t) => t !== tag.id)
                          : [...formData.skillTags, tag.id];
                        setFormData({ ...formData, skillTags: newTags });
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? colorScheme.selected
                          : `${colorScheme.bg} ${colorScheme.text} ${colorScheme.hover}`
                      }`}
                      title={tag.description}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
              {formData.skillTags.length > 0 && (
                <p
                  className="text-xs mt-2"
                  style={{ color: "rgba(212,180,131,0.55)" }}
                >
                  Selected: {formData.skillTags.length} tag(s)
                </p>
              )}
            </div>

            {/* Type-specific fields */}
            {formData.question.type === "multiple_choice" && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Options
                </label>
                {formData.question.options.map((option, index) => (
                  <div key={index} className="flCh items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={option.correct}
                      onChange={(e) =>
                        updateOption(index, "correct", e.target.checked)
                      }
                      className="w-5 h-5"
                      title="Mark as correct"
                    />
                    <span
                      className="font-medium"
                      style={{ color: "rgba(212,180,131,0.80)" }}
                    >
                      {option.id}.
                    </span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        updateOption(index, "text", e.target.value)
                      }
                      className="admin-input flex-1"
                      placeholder={`Option ${option.id}`}
                    />
                    {formData.question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800 px-3"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  + Add Option
                </button>
              </div>
            )}

            {formData.question.type === "text_input" && (
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Expected Answer
                </label>
                <input
                  type="text"
                  value={formData.question.answer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      question: {
                        ...formData.question,
                        answer: e.target.value,
                      },
                    })
                  }
                  className="admin-input w-full"
                  placeholder="Enter expected answer"
                />
              </div>
            )}

            {formData.question.type === "match_pairs" && (
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Pairs
                </label>
                {formData.question.pairs.map((pair, index) => (
                  <div key={index} className="flCh gap-2 mb-2">
                    <input
                      type="text"
                      value={pair.left}
                      onChange={(e) =>
                        updatePair(index, "left", e.target.value)
                      }
                      className="admin-input flex-1"
                      placeholder="Left side"
                    />
                    <span
                      className="self-center"
                      style={{ color: "rgba(212,180,131,0.55)" }}
                    >
                      =
                    </span>
                    <input
                      type="text"
                      value={pair.right}
                      onChange={(e) =>
                        updatePair(index, "right", e.target.value)
                      }
                      className="admin-input flex-1"
                      placeholder="Right side"
                    />
                    {formData.question.pairs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePair(index)}
                        className="text-red-600 hover:text-red-800 px-3"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPair}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  + Add Pair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Question Preview */}
        <div className="mb-6">
          <h3
            className="text-lg font-semibold mb-4"
            style={{ color: "#f5e9c8" }}
          >
            Question Preview
          </h3>
          {formData.question.prompt ? (
            <div>{renderQuestionPreview(formData.question)}</div>
          ) : (
            <div
              className="text-center py-8 rounded-lg"
              style={{
                background: "rgba(0,0,0,0.18)",
                border: "2px dashed rgba(200,165,90,0.25)",
              }}
            >
              <p style={{ color: "rgba(212,180,131,0.55)" }}>
                Fill in the question details above to see a preview.
              </p>
            </div>
          )}
        </div>

        <div
          className="flCh justify-end gap-3 pt-6"
          style={{ borderTop: "1px solid rgba(200,165,90,0.18)" }}
        >
          <button
            type="button"
            onClick={() => setActiveView("list")}
            className="admin-btn-secondary px-6 py-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="admin-btn-success px-6 py-2"
          >
            Save Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChallenges;
