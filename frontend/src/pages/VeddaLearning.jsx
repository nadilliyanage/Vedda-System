import { useState } from 'react';
import { FaBook, FaDumbbell, FaTrophy, FaArrowLeft } from 'react-icons/fa';
import LessonSelection from './LessonSelection';
// import PracticeExercises from './PracticeExercises';
// import LearningChallenges from './LearningChallenges';

const VeddaLearning = () => {
  const [activeView, setActiveView] = useState('main'); // 'main', 'learn', 'practice', 'challenges'
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    // TODO: Navigate to lessons list for this category
    console.log('Selected category:', category);
  };

  const handleBackToCategories = () => {
    setActiveView('main');
    setSelectedCategory(null);
  };

  // Main hub view
  if (activeView === 'main') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 px-4 pt-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Vedda Vocabulary Learning
            </h1>
            <p className="text-xl text-gray-600">
              Choose your learning path to master the Vedda language
            </p>
          </div>

          {/* Three Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Learn Card */}
            <div
              onClick={() => setActiveView('learn')}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 text-white h-80 flex flex-col items-center justify-center text-center">
                <FaBook className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h2 className="text-3xl font-bold mb-4">Learn</h2>
                <p className="text-green-100 text-lg">
                  Explore structured lessons and build your vocabulary
                </p>
                <div className="mt-6 flex items-center text-white font-semibold">
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

            {/* Practice Card */}
            <div
              onClick={() => setActiveView('practice')}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 text-white h-80 flex flex-col items-center justify-center text-center">
                <FaDumbbell className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h2 className="text-3xl font-bold mb-4">Practice</h2>
                <p className="text-orange-100 text-lg">
                  Reinforce your skills with interactive exercises
                </p>
                <div className="mt-6 flex items-center text-white font-semibold">
                  <span>Start Practicing</span>
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

            {/* Challenges Card */}
            <div
              onClick={() => setActiveView('challenges')}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
            >
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 text-white h-80 flex flex-col items-center justify-center text-center">
                <FaTrophy className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h2 className="text-3xl font-bold mb-4">Challenges</h2>
                <p className="text-green-100 text-lg">
                  Test your knowledge with gamified quizzes
                </p>
                <div className="mt-6 flex items-center text-white font-semibold">
                  <span>Take Challenge</span>
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
          </div>

          {/* Features Info */}
          <div className="mt-16 text-center max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-md p-8">
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Your Learning Journey
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Progress through structured lessons, practice with interactive exercises, 
                and challenge yourself with quizzes. Track your achievements and earn 
                rewards as you master the Vedda language.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Learn view
  if (activeView === 'learn') {
    return (
      <LessonSelection 
        onBack={handleBackToCategories}
        onCategorySelect={handleCategorySelect}
      />
    );
  }

  // Practice view
  if (activeView === 'practice') {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="bg-white shadow-sm border-b border-gray-200 py-4 px-6 mb-6">
          <button
            onClick={() => setActiveView('main')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaArrowLeft /> Back to Learning Hub
          </button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800">Practice Exercises</h2>
          <p className="text-gray-600 mt-2">Coming soon...</p>
        </div>
      </div>
    );
  }

  // Challenges view
  if (activeView === 'challenges') {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="bg-white shadow-sm border-b border-gray-200 py-4 px-6 mb-6">
          <button
            onClick={() => setActiveView('main')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaArrowLeft /> Back to Learning Hub
          </button>
        </div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800">Learning Challenges</h2>
          <p className="text-gray-600 mt-2">Coming soon...</p>
        </div>
      </div>
    );
  }
};

export default VeddaLearning;
