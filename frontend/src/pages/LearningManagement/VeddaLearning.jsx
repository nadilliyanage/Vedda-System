import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBook, FaDumbbell, FaTrophy, FaArrowLeft, FaChartLine } from 'react-icons/fa';
import LessonSelection from './LessonSelection';
import LessonsList from './LessonsList';
import LessonContentPlayer from './LessonContentPlayer';
import PracticeExercises from './PracticeExercises';
import ExerciseQuizRunner from './ExerciseQuizRunner';
import PerformanceView from './PerformanceView';
import LearningChallenges from './LearningChallenges';


const VeddaLearning = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('main'); // 'main', 'learn', 'practice', 'challenges', 'performance', 'quiz'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [allLessons, setAllLessons] = useState([]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setActiveView('lessons');
  };

  const handleLessonSelect = (lesson, lessons) => {
    setSelectedLesson(lesson);
    setAllLessons(lessons);
    setActiveView('content');
  };

  const handlePractice = (lesson) => {
    // Navigate to practice exercises with lesson context
    setSelectedLesson(lesson);
    setActiveView('practice');
  };

  const handleStartExercise = (exercise, lesson, category) => {
    setSelectedExercise(exercise);
    setSelectedLesson(lesson);
    setSelectedCategory(category);
    setActiveView('quiz');
  };

  const handleBackToCategories = () => {
    setActiveView('learn');
    setSelectedCategory(null);
    setSelectedLesson(null);
  };

  const handleBackToMain = () => {
    setActiveView('main');
    setSelectedCategory(null);
    setSelectedLesson(null);
  };

  // Main hub view
  if (activeView === 'main') {
    return (
        <div
          className="min-h-screen mt-[60px]"
          style={{
            backgroundImage: `url('/assets/background-images/background-1.png')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
          }}
        >
          {/* ── Glassmorphic nav bar ── */}
          <div
            style={{
              background: "rgba(28,20,8,0.55)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              borderBottom: "1px solid rgba(200,170,100,0.18)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.20)",
            }}
          >
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate("/")}
                  style={{
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    color: "rgba(255,248,230,0.90)",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(200,165,90,0.25)",
                    borderRadius: "9px", padding: "0.4rem 0.9rem",
                    fontFamily: "system-ui, sans-serif", fontWeight: "600",
                    fontSize: "0.88rem", cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(200,165,90,0.18)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                >
                  <FaArrowLeft style={{ fontSize: "0.8rem" }} />
                  Back to Home
                </button>
                <div style={{
                  color: "#d4b483", fontFamily: "system-ui, sans-serif",
                  fontWeight: "600", fontSize: "0.9rem",
                }}>
                  Vedda Language Learning
                </div>
              </div>
            </div>
          </div>

          {/* ── Hero section ── */}
          <div
            style={{
              background: "linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)",
              paddingTop: "1.5rem",
              paddingBottom: "1.5rem",
              textAlign: "center",
            }}
          >
            <span style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.60)",
              border: "1px solid rgba(100,80,40,0.22)",
              borderRadius: "999px",
              padding: "0.28rem 1rem",
              fontSize: "0.73rem",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#5c4a1e",
              marginBottom: "0.6rem",
              fontFamily: "system-ui, sans-serif",
            }}>
              📚 Language Learning
            </span>
            <h1 style={{
              fontSize: "45px",
              fontWeight: "800",
              color: "#1c1409",
              lineHeight: 1.2,
              margin: "0 auto 0.5rem",
              maxWidth: "720px",
              fontFamily: "'Georgia', serif",
              letterSpacing: "-0.3px",
              textShadow: "0 1px 0 rgba(255,255,255,0.8)",
              padding: "0 1rem",
            }}>
              Vedda{" "}
              <span style={{ color: "#9a6f2a", textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)" }}>
                Vocabulary
              </span>{" "}
              Learning
            </h1>
            <p style={{
              fontSize: "clamp(0.9rem,1.8vw,1.08rem)",
              color: "#3d2e0f",
              maxWidth: "540px",
              margin: "0 auto 0.5rem",
              lineHeight: 1.75,
              fontFamily: "'Georgia', serif",
              fontStyle: "italic",
              padding: "0 1rem",
            }}>
              Choose your learning path to master the ancient Vedda language.
            </p>
            <div style={{
              width: "52px", height: "3px",
              background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
              margin: "1rem auto 0",
              borderRadius: "99px",
            }} />
          </div>

          <div className="container mx-auto px-4 pb-12">
            {/* Three Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
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

              {/* Performance Card */}
              <div
                  onClick={() => setActiveView('performance')}
                  className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div className="bg-gradient-to-br from-purple-500 to-teal-500 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8 text-white h-80 flex flex-col items-center justify-center text-center">
                  <FaChartLine className="text-7xl mb-6 group-hover:scale-110 transition-transform duration-300" />
                  <h2 className="text-3xl font-bold mb-4">Performance</h2>
                  <p className="text-purple-100 text-lg">
                    View your learning progress and performance insights
                  </p>
                  <div className="mt-6 flex items-center text-white font-semibold">
                    <span>View Performance</span>
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

  // Learn view - Category Selection
  if (activeView === 'learn') {
    return (
        <LessonSelection
            onBack={handleBackToMain}
            onCategorySelect={handleCategorySelect}
        />
    );
  }

  // Lessons view - Show lessons for selected category
  if (activeView === 'lessons' && selectedCategory) {
    return (
        <LessonsList
            category={selectedCategory}
            onBack={handleBackToCategories}
            onLessonSelect={handleLessonSelect}
        />
    );
  }

  // Content view - Show lesson content
  if (activeView === 'content' && selectedLesson && selectedCategory) {
    return (
        <LessonContentPlayer
            lesson={selectedLesson}
            category={selectedCategory}
            allLessons={allLessons}
            onBack={() => setActiveView('lessons')}
            onPractice={handlePractice}
        />
    );
  }

  // Practice view
  if (activeView === 'practice') {
    return (
        <PracticeExercises
            initialCategory={selectedCategory}
            initialLesson={selectedLesson}
            onStartExercise={handleStartExercise}
            onBack={() => {
              if (selectedLesson) {
                // If coming from a lesson, go back to content
                setActiveView('content');
              } else {
                // If coming from main hub, go back to main
                setActiveView('main');
              }
            }}
        />
    );
  }

  // Quiz view - Exercise Quiz Runner
  if (activeView === 'quiz' && selectedExercise && selectedLesson && selectedCategory) {
    return (
        <ExerciseQuizRunner
            exercise={selectedExercise}
            lesson={selectedLesson}
            category={selectedCategory}
            onClose={() => setActiveView('practice')}
        />
    );
  }

  // Challenges view
  if (activeView === 'challenges') {
    return (
        <LearningChallenges
            onBack={() => setActiveView('main')}
        />
    );
  }

  // Performance view
  if (activeView === 'performance') {
    return (
        <PerformanceView
            onBack={() => setActiveView('main')}
        />
    );
  }
};

export default VeddaLearning;
