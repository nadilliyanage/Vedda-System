import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaEye, FaEdit, FaTrash, FaPlus, FaList } from 'react-icons/fa';
import AdminCategories from './AdminCategories';

const API_BASE = 'http://localhost:5000';

const AdminLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit', 'view', 'categories'
  const [currentLesson, setCurrentLesson] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    categoryId: '',
    topic: '',
    description: '',
    content: '',
    xp: 10,
    coins: 5,
    imageUrl: '',
    audioUrl: ''
  });

  useEffect(() => {
    if (activeView === 'list') {
      fetchLessons();
      fetchCategories();
    } else if (activeView === 'add' || activeView === 'edit') {
      fetchCategories();
    }
  }, [activeView]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/learn/admin/lessons`);
      setLessons(response.data);
    } catch (error) {
      toast.error('Failed to fetch lessons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/learn/admin/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const openAddForm = () => {
    setFormData({
      id: '',
      categoryId: '',
      topic: '',
      description: '',
      content: '',
      xp: 10,
      coins: 5,
      imageUrl: '',
      audioUrl: ''
    });
    setCurrentLesson(null);
    setActiveView('add');
  };

  const openEditForm = (lesson) => {
    setFormData({
      id: lesson.id,
      categoryId: lesson.categoryId || '',
      topic: lesson.topic || '',
      description: lesson.description || '',
      content: lesson.content || '',
      xp: lesson.xp || 10,
      coins: lesson.coins || 5,
      imageUrl: lesson.imageUrl || '',
      audioUrl: lesson.audioUrl || ''
    });
    setCurrentLesson(lesson);
    setActiveView('edit');
  };

  const openViewForm = (lesson) => {
    setCurrentLesson(lesson);
    setActiveView('view');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        xp: parseInt(formData.xp),
        coins: parseInt(formData.coins)
      };

      if (activeView === 'add') {
        await axios.post(`${API_BASE}/api/learn/admin/lessons`, submitData);
        toast.success('Lesson created successfully');
      } else if (activeView === 'edit') {
        await axios.put(`${API_BASE}/api/learn/admin/lessons/${formData.id}`, submitData);
        toast.success('Lesson updated successfully');
      }

      setActiveView('list');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save lesson');
      console.error(error);
    }
  };

  const handleDelete = async (lessonId) => {
    if (!window.confirm('Are you sure you want to delete this lesson?')) return;

    try {
      await axios.delete(`${API_BASE}/api/learn/admin/lessons/${lessonId}`);
      toast.success('Lesson deleted successfully');
      fetchLessons();
    } catch (error) {
      toast.error('Failed to delete lesson');
      console.error(error);
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'N/A';
  };

  // Categories Management View
  if (activeView === 'categories') {
    return <AdminCategories onBack={() => setActiveView('list')} />;
  }

  // List View
  if (activeView === 'list') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Manage Lessons</h1>
            <p className="text-gray-600 mt-2">Create and organize learning lessons</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveView('categories')}
              className="bg-white border-2 border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <FaList /> Manage Category
            </button>
            <button
              onClick={openAddForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FaPlus /> Add Lesson
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading lessons...</p>
            </div>
          ) : lessons.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No lessons found</p>
              <p className="text-gray-400 mt-2">Create your first lesson to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rewards</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lesson.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {getCategoryName(lesson.categoryId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{lesson.topic}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{lesson.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lesson.xp} XP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openViewForm(lesson)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openEditForm(lesson)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(lesson.id)}
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
      </div>
    );
  }

  // View Form
  if (activeView === 'view' && currentLesson) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">View Lesson</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <p className="text-gray-900">{getCategoryName(currentLesson.categoryId)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <p className="text-gray-900">{currentLesson.topic}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <p className="text-gray-900">{currentLesson.description}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <div className="border rounded-lg p-4 bg-gray-50 prose max-w-none">
                {currentLesson.content ? (
                  <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
                ) : (
                  <p className="text-gray-500">No content available</p>
                )}
              </div>
            </div>
            {currentLesson.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <img src={currentLesson.imageUrl} alt="Lesson" className="max-w-md rounded-lg" />
              </div>
            )}
            {currentLesson.audioUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Audio</label>
                <audio controls className="w-full max-w-md">
                  <source src={currentLesson.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
                <p className="text-gray-900">{currentLesson.xp}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coins Reward</label>
                <p className="text-gray-900">{currentLesson.coins}</p>
              </div>
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
          {activeView === 'add' ? 'Add Lesson' : 'Edit Lesson'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {activeView === 'add' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson ID</label>
                <input
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., lesson1"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
              <input
                type="text"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Enter lesson topic"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows="3"
                placeholder="Brief description of the lesson"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content (Rich Text Editor)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 font-mono text-sm"
                rows="10"
                placeholder="Enter lesson content (HTML supported)&#10;&#10;Example:&#10;<h2>Introduction</h2>&#10;<p>Welcome to this lesson...</p>&#10;<img src='image-url' alt='description' />&#10;<audio controls><source src='audio-url' type='audio/mpeg'></audio>"
              />
              <p className="text-xs text-gray-500 mt-1">You can use HTML tags for formatting, images, and audio</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
                <input
                  type="number"
                  value={formData.xp}
                  onChange={(e) => setFormData({ ...formData, xp: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coins Reward</label>
                <input
                  type="number"
                  value={formData.coins}
                  onChange={(e) => setFormData({ ...formData, coins: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
              onClick={() => toast.info('Exercise attachment feature coming soon')}
            >
              <FaPlus /> Add Exercise
            </button>
            
            <div className="flex gap-3">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLessons;
