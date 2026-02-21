import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEdit, FaTrash, FaPlus, FaArrowLeft } from 'react-icons/fa';
import { categoriesAPI } from '../../services/learningAPI';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminCategories = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit', 'view'
  const [currentCategory, setCurrentCategory] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, categoryId: null });
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: ''
  });

  useEffect(() => {
    if (activeView === 'list') {
      fetchCategories();
    }
  }, [activeView]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to fetch categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setFormData({
      id: '',
      name: '',
      description: ''
    });
    setCurrentCategory(null);
    setActiveView('add');
  };

  const openEditForm = (category) => {
    setFormData({
      id: category.id,
      _id: category._id,
      name: category.name || '',
      description: category.description || ''
    });
    setCurrentCategory(category);
    setActiveView('edit');
  };

  const openViewForm = (category) => {
    setCurrentCategory(category);
    setActiveView('view');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (activeView === 'add') {
        await categoriesAPI.create(formData);
        toast.success('Category created successfully');
      } else if (activeView === 'edit') {
        await categoriesAPI.update(formData._id, formData);
        toast.success('Category updated successfully');
      }

      setActiveView('list');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save category');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await categoriesAPI.delete(confirmDialog.categoryId);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
      console.error(error);
    }
  };

  // List View
  if (activeView === 'list') {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <FaArrowLeft /> Back to Lessons
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Category</h1>
            <p className="text-gray-600 mt-2">Organize lessons by categories</p>
          </div>
          <button
            onClick={openAddForm}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Add New
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No categories found</p>
              <p className="text-gray-400 mt-2">Create your first category to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{category.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">{category.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openViewForm(category)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openEditForm(category)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => setConfirmDialog({ isOpen: true, categoryId: category.id })}
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
  if (activeView === 'view' && currentCategory) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">View Category</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <p className="text-gray-900">{currentCategory.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900">{currentCategory.description}</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setActiveView('list')}
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
          {activeView === 'add' ? 'Add Category' : 'Edit Category'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category ID</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., cat1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter category name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows="5"
                placeholder="Enter category description"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCategories;
