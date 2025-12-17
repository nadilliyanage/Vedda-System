import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa';

const LessonContentPlayer = ({ lesson, category, allLessons, onBack, onPractice }) => {
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(lesson);

  useEffect(() => {
    // Find the index of the current lesson in the category's lessons
    const index = allLessons.findIndex(l => l.id === lesson.id);
    setCurrentLessonIndex(index);
    setCurrentLesson(lesson);
  }, [lesson, allLessons]);

  const handlePrevious = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = allLessons[currentLessonIndex - 1];
      setCurrentLesson(prevLesson);
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      setCurrentLesson(nextLesson);
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handlePractice = () => {
    onPractice(currentLesson);
  };

  const hasPrevious = currentLessonIndex > 0;
  const hasNext = currentLessonIndex < allLessons.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-4"
          >
            <FaArrowLeft /> Back to Lessons
          </button>
          
          <div className="text-center mb-2">
            <h1 className="text-4xl font-bold text-gray-800">
              {currentLesson.topic}
            </h1>
            <p className="text-lg text-gray-600 mt-2">
              {category.name} - Lesson {currentLessonIndex + 1} of {allLessons.length}
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 min-h-[400px]">
          {/* Description */}
          {currentLesson.description && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <p className="text-lg text-gray-700 leading-relaxed">
                {currentLesson.description}
              </p>
            </div>
          )}

          {/* Rich Text Content */}
          <div 
            className="prose prose-lg max-w-none mb-6 lesson-content"
            dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p class="text-gray-500">No content available for this lesson.</p>' }}
          />

          {/* Image Display */}
          {currentLesson.imageUrl && (
            <div className="my-8">
              <img
                src={currentLesson.imageUrl}
                alt={currentLesson.topic}
                className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Audio Player */}
          {currentLesson.audioUrl && (
            <div className="my-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaPlay className="text-blue-600" /> Audio Pronunciation
              </h3>
              <audio
                controls
                className="w-full"
                style={{ maxWidth: '600px' }}
              >
                <source src={currentLesson.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Rewards Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-6">
              <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg px-6 py-3">
                <div className="text-sm text-yellow-700 font-medium">Rewards</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {currentLesson.xp} XP • {currentLesson.coins} Coins
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation and Actions Footer */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                hasPrevious
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
              }`}
            >
              <FaChevronLeft />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Practice Button */}
            <button
              onClick={handlePractice}
              className="flex-1 max-w-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Start Practice Exercises
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                hasNext
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <FaChevronRight />
            </button>
          </div>

          {/* Lesson Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
              {allLessons.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentLessonIndex
                      ? 'w-8 bg-blue-600'
                      : index < currentLessonIndex
                      ? 'w-2 bg-green-500'
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="mt-6 bg-blue-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-2">
            💡 Ready to test your knowledge?
          </h3>
          <p className="text-blue-700">
            Click the Practice button to begin interactive exercises 
            and reinforce what you have learned in this lesson.
          </p>
        </div>
      </div>

      {/* Custom styles for lesson content */}
      <style>{`
        .lesson-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem auto;
          display: block;
        }
        
        .lesson-content p {
          margin-bottom: 1rem;
          line-height: 1.8;
        }
        
        .lesson-content h1,
        .lesson-content h2,
        .lesson-content h3 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }
        
        .lesson-content ul,
        .lesson-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .lesson-content li {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default LessonContentPlayer;
