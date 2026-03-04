import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaEye, FaEdit, FaTrash, FaPlus, FaArrowLeft } from "react-icons/fa";
import { categoriesAPI } from "../../services/learningAPI";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LoadingScreen from "../../components/ui/LoadingScreen";

const AdminCategories = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("list"); // 'list', 'add', 'edit', 'view'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    categoryId: null,
  });
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
  });

  useEffect(() => {
    if (activeView === "list") {
      fetchCategories();
    }
  }, [activeView]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error("Failed to fetch categories");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setFormData({
      id: "",
      name: "",
      description: "",
    });
    setCurrentCategory(null);
    setActiveView("add");
  };

  const openEditForm = (category) => {
    setFormData({
      id: category.id,
      _id: category._id,
      name: category.name || "",
      description: category.description || "",
    });
    setCurrentCategory(category);
    setActiveView("edit");
  };

  const openViewForm = (category) => {
    setCurrentCategory(category);
    setActiveView("view");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (activeView === "add") {
        await categoriesAPI.create(formData);
        toast.success("Category created successfully");
      } else if (activeView === "edit") {
        await categoriesAPI.update(formData._id, formData);
        toast.success("Category updated successfully");
      }

      setActiveView("list");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save category");
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await categoriesAPI.delete(confirmDialog.categoryId);
      toast.success("Category deleted successfully");
      fetchCategories();
    } catch (error) {
      toast.error("Failed to delete category");
      console.error(error);
    }
  };

  // List View
  if (activeView === "list") {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 transition-colors mb-4"
            style={{ color: "rgba(212,180,131,0.75)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#f5e9c8")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "rgba(212,180,131,0.75)")
            }
          >
            <FaArrowLeft /> Back to Lessons
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
              Manage Category
            </h1>
            <p className="mt-2" style={{ color: "rgba(212,180,131,0.70)" }}>
              Organize lessons by categories
            </p>
          </div>
          <button
            onClick={openAddForm}
            className="admin-btn-primary px-4 py-2 flex items-center gap-2"
          >
            <FaPlus /> Add New
          </button>
        </div>

        <div className="admin-glass">
          {loading ? (
            <LoadingScreen message="Loading categories..." />
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p
                className="text-lg"
                style={{ color: "rgba(212,180,131,0.70)" }}
              >
                No categories found
              </p>
              <p className="mt-2" style={{ color: "rgba(212,180,131,0.50)" }}>
                Create your first category to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="admin-table-head">
                  <tr>
                    <th className="admin-table-th">ID</th>
                    <th className="admin-table-th">Name</th>
                    <th className="admin-table-th">Description</th>
                    <th className="admin-table-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="admin-table-row">
                      <td
                        className="admin-table-td whitespace-nowrap text-sm font-medium"
                        style={{ color: "#f5e9c8" }}
                      >
                        {category.id}
                      </td>
                      <td
                        className="admin-table-td whitespace-nowrap text-sm"
                        style={{ color: "#f5e9c8" }}
                      >
                        {category.name}
                      </td>
                      <td
                        className="admin-table-td text-sm max-w-md truncate"
                        style={{ color: "rgba(212,180,131,0.70)" }}
                      >
                        {category.description}
                      </td>
                      <td className="admin-table-td whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openViewForm(category)}
                            className="text-blue-400 hover:text-blue-300"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openEditForm(category)}
                            className="text-green-400 hover:text-green-300"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                isOpen: true,
                                categoryId: category.id,
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
          onClose={() => setConfirmDialog({ isOpen: false, categoryId: null })}
          onConfirm={handleDelete}
          title="Delete Category"
          message="Are you sure you want to delete this category? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    );
  }

  // View Form
  if (activeView === "view" && currentCategory) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{ color: "#f5e9c8" }}>
            View Category
          </h1>
        </div>

        <div className="admin-glass p-6">
          <div className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Name
              </label>
              <p style={{ color: "#f5e9c8" }}>{currentCategory.name}</p>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Description
              </label>
              <p style={{ color: "#f5e9c8" }}>{currentCategory.description}</p>
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
          {activeView === "add" ? "Add Category" : "Edit Category"}
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
                Category ID
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                className="admin-input w-full"
                placeholder="e.g., cat1"
                required
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: "rgba(212,180,131,0.80)" }}
              >
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="admin-input w-full"
                placeholder="Enter category name"
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
                rows="5"
                placeholder="Enter category description"
                required
              />
            </div>
          </div>

          <div
            className="flex justify-end gap-3 mt-6 pt-6"
            style={{ borderTop: "1px solid rgba(200,165,90,0.18)" }}
          >
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
        </form>
      </div>
    </div>
  );
};

export default AdminCategories;
