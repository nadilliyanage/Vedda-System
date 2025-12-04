import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';

const API_BASE = 'http://localhost:5000';

const LessonSelection = ({ onBack, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Color palette for categories
  const colorPalette = [
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-yellow-500 to-yellow-600',
    'from-blue-500 to-blue-600',
    'from-red-500 to-red-600',
    'from-purple-500 to-purple-600',
    'from-pink-500 to-pink-600',
    'from-indigo-500 to-indigo-600',
    'from-teal-500 to-teal-600',
    'from-cyan-500 to-cyan-600'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/api/learn/admin/categories`);
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    onCategorySelect(category);
  };

  const getColorClass = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <FaSpinner className="text-5xl text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
          >
            <FaArrowLeft /> Back to Learning Hub
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Lessons</h1>
            <p className="text-lg text-gray-600">
              Select a category to start learning
            </p>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
              <p className="text-gray-500 text-lg mb-4">No categories available yet</p>
              <p className="text-gray-400">
                Categories will appear here once an admin creates them
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div
                  className={`bg-gradient-to-br ${getColorClass(index)} rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-12 text-white h-48 flex flex-col items-center justify-center text-center`}
                >
                  <h2 className="text-3xl font-bold mb-3">{category.name}</h2>
                  {category.description && (
                    <p className="text-white/90 text-lg">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Start Learning</span>
                    <svg
                      className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              How It Works
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Choose a category above to explore lessons in that topic. Each category 
              contains carefully crafted lessons to help you learn Vedda vocabulary 
              effectively. Track your progress and earn rewards as you complete lessons.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonSelection;
