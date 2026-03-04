import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEdit, FaTrash, FaPlus, FaList } from "react-icons/fa";
import AdminCategories from "./AdminCategories";
import TextEditor from "./TextEditor";
import { lessonsAPI, categoriesAPI } from "../../services/learningAPI";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingScreen from "../../components/ui/LoadingScreen";

const AdminLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("list"); // 'list', 'add', 'edit', 'view', 'categories'
  const [currentLesson, setCurrentLesson] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    lessonId: null,
  });
  const [formData, setFormData] = useState({
    id: "",
    _id: "",
    categoryId: "",
    topic: "",
    description: "",
    content: "",
    xp: 10,
    coins: 5,
    imageUrl: "",
    audioUrl: "",
  });

  useEffect(() => {
    if (activeView === "list") {
      fetchLessons();
      fetchCategories();
    } else if (activeView === "add" || activeView === "edit") {
      fetchCategories();
    }
  }, [activeView]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await lessonsAPI.getAll();
      setLessons(response.data);
    } catch (error) {
      toast.error("Failed to fetch lessons");
      console.error(error);
    } finally {
      setLoading(false);
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
      categoryId: "",
      topic: "",
      description: "",
      content: "",
      xp: 10,
      coins: 5,
      imageUrl: "",
      audioUrl: "",
    });
    setCurrentLesson(null);
    setActiveView("add");
  };

  const openEditForm = (lesson) => {
    setFormData({
      id: lesson.id,
      _id: lesson._id,
      categoryId: lesson.categoryId || "",
      topic: lesson.topic || "",
      description: lesson.description || "",
      content: lesson.content || "",
      xp: lesson.xp || 10,
      coins: lesson.coins || 5,
      imageUrl: lesson.imageUrl || "",
      audioUrl: lesson.audioUrl || "",
    });
    setCurrentLesson(lesson);
    setActiveView("edit");
  };

  const openViewForm = (lesson) => {
    setCurrentLesson(lesson);
    setActiveView("view");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        xp: parseInt(formData.xp),
        coins: parseInt(formData.coins),
      };

      if (activeView === "add") {
        await lessonsAPI.create(submitData);
        toast.success("Lesson created successfully");
      } else if (activeView === "edit") {
        await lessonsAPI.update(formData._id, submitData);
        toast.success("Lesson updated successfully");
      }

      setActiveView("list");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save lesson");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await lessonsAPI.delete(confirmDialog.lessonId);
      toast.success("Lesson deleted successfully");
      fetchLessons();
    } catch (error) {
      toast.error("Failed to delete lesson");
      console.error(error);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.name : "N/A";
  };

  // Categories Management View
  if (activeView === "categories") {
    return <AdminCategories onBack={() => setActiveView("list")} />;
  }

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
              Create and organize learning lessons
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveView("categories")}
              className="admin-btn-secondary px-4 py-2 flex items-center gap-2 border border-blue-400/40"
              style={{ color: "#93c5fd" }}
            >
              <FaList /> Manage Category
            </button>
            <button
              onClick={openAddForm}
              className="admin-btn-primary px-4 py-2 flex items-center gap-2"
            >
              <FaPlus /> Add Lesson
            </button>
          </div>
        </div>

        <div className="admin-glass">
          {loading ? (
            <LoadingScreen message="Loading lessons..." />
          ) : lessons.length === 0 ? (
            <div className="text-center py-12">
              <p
                className="text-lg"
                style={{ color: "rgba(212,180,131,0.70)" }}
              >
                No lessons found
              </p>
              <p className="mt-2" style={{ color: "rgba(212,180,131,0.50)" }}>
                Create your first lesson to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="admin-table-head">
                  <tr>
                    <th className="admin-table-th">ID</th>
                    <th className="admin-table-th">Category</th>
                    <th className="admin-table-th">Topic</th>
                    <th className="admin-table-th">Description</th>
                    <th className="admin-table-th">Rewards</th>
                    <th className="admin-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="admin-table-row">
                      <td
                        className="admin-table-td whitespace-nowrap text-sm font-medium"
                        style={{ color: "#f5e9c8" }}
                      >
                        {lesson.id}
                      </td>
                      <td className="admin-table-td whitespace-nowrap text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-sky-900/25 text-sky-300 border border-sky-500/25">
                          {getCategoryName(lesson.categoryId)}
                        </span>
                      </td>
                      <td
                        className="admin-table-td text-sm"
                        style={{ color: "#f5e9c8" }}
                      >
                        {lesson.topic}
                      </td>
                      <td
                        className="admin-table-td text-sm max-w-xs truncate"
                        style={{ color: "rgba(212,180,131,0.70)" }}
                      >
                        {lesson.description}
                      </td>
                      <td
                        className="admin-table-td whitespace-nowrap text-sm"
                        style={{ color: "rgba(212,180,131,0.70)" }}
                      >
                        {lesson.xp} XP
                      </td>
                      <td className="admin-table-td whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openViewForm(lesson)}
                            className="text-blue-400 hover:text-blue-300"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openEditForm(lesson)}
                            className="text-green-400 hover:text-green-300"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                lessonId: lesson.id,
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
          onClose={() => setConfirmDialog({ isOpen: false, lessonId: null })}
          onConfirm={handleDelete}
          title="Delete Lesson"
          message="Are you sure you want to delete this lesson? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    );
  }

  // View Form
  if (activeView === "view" && currentLesson) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
            View Lesson
          </h1>
        </div>

        <div className="admin-glass p-6">
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Category
              </label>
              <p style={{ color: "#f5e9c8" }}>
                {getCategoryName(currentLesson.categoryId)}
              </p>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Topic
              </label>
              <p style={{ color: "#f5e9c8" }}>{currentLesson.topic}</p>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Description
              </label>
              <p style={{ color: "#f5e9c8" }}>{currentLesson.description}</p>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Content
              </label>
              <div className="admin-glass p-4 rounded-lg">
                {currentLesson.content ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                  />
                ) : (
                  <p style={{ color: "rgba(212,180,131,0.55)" }}>
                    No content available
                  </p>
                )}
              </div>
            </div>
            {currentLesson.imageUrl && (
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Image
                </label>
                <img
                  src={currentLesson.imageUrl}
                  alt="Lesson"
                  className="max-w-md rounded-lg"
                />
              </div>
            )}
            {currentLesson.audioUrl && (
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Audio
                </label>
                <audio controls className="w-full max-w-md">
                  <source src={currentLesson.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  XP Reward
                </label>
                <p style={{ color: "#f5e9c8" }}>{currentLesson.xp}</p>
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Coins Reward
                </label>
                <p style={{ color: "#f5e9c8" }}>{currentLesson.coins}</p>
              </div>
            </div>
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
          {activeView === "add" ? "Add Lesson" : "Edit Lesson"}
        </h1>
      </div>

      <div className="admin-glass p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Lesson ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                className="admin-input w-full"
                placeholder="e.g., lesson1"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Select Category
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) =>
                  setFormData({ ...formData, categoryId: e.target.value })
                }
                className="admin-select w-full"
                required
              >
                <option value="">Choose a category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Topic
              </label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) =>
                  setFormData({ ...formData, topic: e.target.value })
                }
                className="admin-input w-full"
                placeholder="Enter lesson topic"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="admin-textarea w-full"
                rows="3"
                placeholder="Brief description of the lesson"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Lesson Content
              </label>
              <TextEditor
                key={`${activeView}-${formData.id || "new"}`}
                value={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
              />
            </div>

            {/* <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audio URL (Optional)</label>
                <input
                  type="url"
                  value={formData.audioUrl}
                  onChange={(e) => setFormData({ ...formData, audioUrl: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="https://example.com/audio.mp3"
                />
              </div>
            </div> */}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  XP Reward
                </label>
                <input
                  type="number"
                  value={formData.xp}
                  onChange={(e) =>
                    setFormData({ ...formData, xp: e.target.value })
                  }
                  className="admin-input w-full"
                  min="0"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: "rgba(212,180,131,0.80)" }}
                >
                  Coins Reward
                </label>
                <input
                  type="number"
                  value={formData.coins}
                  onChange={(e) =>
                    setFormData({ ...formData, coins: e.target.value })
                  }
                  className="admin-input w-full"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          <div
            className="flex justify-between items-center mt-6 pt-6"
            style={{ borderTop: "1px solid rgba(200,165,90,0.18)" }}
          >
            <button
              type="button"
              className="admin-btn-primary px-4 py-2 flex items-center gap-2"
              onClick={() =>
                toast.info("Exercise attachment feature coming soon")
              }
            >
              <FaPlus /> Add Exercise
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveView("list")}
                className="admin-btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button type="submit" className="admin-btn-primary px-4 py-2">
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLessons;
