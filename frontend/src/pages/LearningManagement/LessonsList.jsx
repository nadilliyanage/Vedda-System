import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaSpinner, FaBook } from 'react-icons/fa';
import { lessonsAPI } from '../../services/learningAPI';

const LessonsList = ({ category, onBack, onLessonSelect }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Color palette for lessons
  const colorPalette = [
    'from-orange-500 to-orange-600',
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-red-500 to-red-600',
    'from-indigo-500 to-indigo-600',
    'from-pink-500 to-pink-600',
    'from-teal-500 to-teal-600',
    'from-yellow-500 to-yellow-600',
    'from-cyan-500 to-cyan-600'
  ];

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await lessonsAPI.getAll();
      
      // Filter lessons by selected category
      const filteredLessons = response.data.filter(
        lesson => lesson.categoryId === category.id
      );
      
      setLessons(filteredLessons);
    } catch (error) {
      toast.error('Failed to load lessons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      fetchLessons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleLessonClick = (lesson) => {
    onLessonSelect(lesson, lessons);
  };

  const getColorClass = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <FaSpinner className="text-5xl text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading lessons...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
          >
            <FaArrowLeft /> Back to Categories
          </button>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Lessons - {category.name}
            </h1>
            {category.description && (
              <p className="text-lg text-gray-600">
                {category.description}
              </p>
            )}
          </div>
        </div>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
              <FaBook className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">
                No lessons available in this category yet
              </p>
              <p className="text-gray-400">
                Check back soon for new lessons!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-102"
              >
                <div
                  className={`bg-gradient-to-r ${getColorClass(index)} rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-white`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">
                        {lesson.topic}
                      </h2>
                      {lesson.description && (
                        <p className="text-white/90 text-lg">
                          {lesson.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          {lesson.xp} XP
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          {lesson.coins} Coins
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-8 h-8 transform group-hover:translate-x-2 transition-transform"
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
              </div>
            ))}
          </div>
        )}

        {/* Progress Info */}
        {lessons.length > 0 && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Your Progress
                  </h3>
                  <p className="text-gray-600">
                    {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} available in this category
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    0/{lessons.length}
                  </div>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonsList;
