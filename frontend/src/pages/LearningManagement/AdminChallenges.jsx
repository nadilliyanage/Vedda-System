import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEdit, FaTrash, FaPlus, FaSave } from "react-icons/fa";
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
      <div className="border-2 border-gray-200 rounded-lg p-4 mb-3 bg-white">
        <div className="flCh justify-between items-start mb-2">
          <div>
            <span className="font-semibold text-gray-700">Question:</span>
            <span className="ml-2 text-gray-900">{question.prompt}</span>
            <span className="ml-2 text-xs text-gray-500">
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
                  <span className="font-medium">{option.id}.</span>
                  <span>{option.text}</span>
                </div>
              ))}
            </div>
          )}

          {question.type === "text_input" && (
            <div className="border rounded px-3 py-2 bg-gray-50 text-gray-600">
              Your answer: <span className="italic">(Text input)</span>
            </div>
          )}

          {question.type === "match_pairs" && question.pairs && (
            <div className="space-y-2">
              {question.pairs.map((pair, idx) => (
                <div key={idx} className="flCh items-center gap-2">
                  <span className="bg-blue-100 px-3 py-1 rounded">
                    {pair.left}
                  </span>
                  <span>=</span>
                  <span className="bg-green-100 px-3 py-1 rounded">
                    {pair.right}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-500">
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
            <h1 className="text-3xl font-bold text-gray-800"></h1>
            <p className="text-gray-600 mt-2">
              Create practice challenges with questions
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Add New
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <LoadingScreen />
          ) : challenges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No challenges found</p>
              <p className="text-gray-400 mt-2">
                Create your first challenge to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Challenge No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rewards
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {challenges.map((challenge) => (
                    <tr key={challenge.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {challenge.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Ch {challenge.challengeNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {challenge.question?.type?.replace("_", " ") || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {challenge.question?.xp || 0} XP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openViewForm(challenge)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openEditForm(challenge)}
                            className="text-green-600 hover:text-green-900"
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
                            className="text-red-600 hover:text-red-900"
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
          <h1 className="text-3xl font-bold text-gray-800">View Challenge</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4 mb-6">
            <div className="max-w-xs">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Number
                </label>
                <p className="text-gray-900">
                  Ch {currentChallenge.challengeNumber}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Question
            </h3>
            {currentChallenge.question ? (
              renderQuestionPreview(currentChallenge.question)
            ) : (
              <p className="text-gray-500">No question added</p>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setActiveView("list")}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
        <h1 className="text-3xl font-bold text-gray-800">
          {activeView === "add" ? "Add Challenge" : "Edit Challenge"}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Top Level Settings */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Challenge Settings
          </h3>
          <div className="max-w-xs">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Challenge Number
              </label>
              <input
                type="text"
                value={formData.challengeNumber}
                onChange={(e) =>
                  setFormData({ ...formData, challengeNumber: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., 1"
                required
              />
            </div>
          </div>
        </div>

        {/* Question Builder */}
        <div className="mb-6 pb-6 border-b-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Question</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 1"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text_input">Text Input</option>
                  <option value="match_pairs">Match Pairs</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full border rounded-lg px-3 py-2"
                rows="2"
                placeholder="Enter question prompt"
              />
            </div>

            {/* Skill Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                <p className="text-xs text-gray-500 mt-2">
                  Selected: {formData.skillTags.length} tag(s)
                </p>
              )}
            </div>

            {/* Type-specific fields */}
            {formData.question.type === "multiple_choice" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <span className="font-medium">{option.id}.</span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) =>
                        updateOption(index, "text", e.target.value)
                      }
                      className="flex-1 border rounded-lg px-3 py-2"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter expected answer"
                />
              </div>
            )}

            {formData.question.type === "match_pairs" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Left side"
                    />
                    <span className="self-center text-gray-400">=</span>
                    <input
                      type="text"
                      value={pair.right}
                      onChange={(e) =>
                        updatePair(index, "right", e.target.value)
                      }
                      className="flex-1 border rounded-lg px-3 py-2"
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Question Preview
          </h3>
          {formData.question.prompt ? (
            <div>{renderQuestionPreview(formData.question)}</div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">
                Fill in the question details above to see a preview.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flCh justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setActiveView("list")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Save Challenge
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminChallenges;
