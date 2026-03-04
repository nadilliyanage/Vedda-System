import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaSpinner, FaChevronDown, FaChevronRight, FaDumbbell, FaMagic, FaStar, FaCheckCircle } from 'react-icons/fa';
import { categoriesAPI, lessonsAPI, exercisesAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../../components/ui/LoadingScreen';

const PracticeExercises = ({ initialCategory = null, initialLesson = null, onBack, onStartExercise }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPersonalized, setLoadingPersonalized] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [expandedLessons, setExpandedLessons] = useState(new Set());
  const [expandedPersonalized, setExpandedPersonalized] = useState(true);

  // Color palette for categories
  const categoryColors = [
    'from-green-500 to-green-600',
    'from-orange-500 to-orange-600',
    'from-purple-500 to-purple-600',
    'from-blue-500 to-blue-600',
    'from-red-500 to-red-600',
    'from-indigo-500 to-indigo-600',
    'from-pink-500 to-pink-600',
    'from-teal-500 to-teal-600'
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    // Auto-expand if coming from a specific lesson
    if (initialCategory && initialLesson && categories.length > 0) {
      setExpandedCategories(new Set([initialCategory.id]));
      setExpandedLessons(new Set([initialLesson.id]));
    }
  }, [initialCategory, initialLesson, categories]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, lessonsRes, exercisesRes] = await Promise.all([
        categoriesAPI.getAll(),
        lessonsAPI.getAll(),
        exercisesAPI.getAll()
      ]);

      setCategories(categoriesRes.data);
      setLessons(lessonsRes.data);
      setExercises(exercisesRes.data);
    } catch (error) {
      toast.error('Failed to load practice exercises');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const toggleLesson = (lessonId) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const handleStartExercise = (exercise, lesson, category) => {
    if (onStartExercise) {
      onStartExercise(exercise, lesson, category);
    } else {
      console.log('Starting exercise:', exercise);
      toast.success(`Starting ${exercise.id}!`);
    }
  };

  const getLessonsForCategory = (categoryId) => {
    return lessons.filter(lesson => lesson.categoryId === categoryId);
  };

  const getExercisesForLesson = (lessonId) => {
    return exercises.filter(exercise => exercise.lessonId === lessonId);
  };

  const getCategoryColor = (index) => {
    return categoryColors[index % categoryColors.length];
  };

  const getTotalExercises = (categoryId) => {
    const categoryLessons = getLessonsForCategory(categoryId);
    return categoryLessons.reduce((total, lesson) => {
      return total + getExercisesForLesson(lesson.id).length;
    }, 0);
  };

  const fetchPersonalizedExercise = async () => {
    const userId = user?.id;
    if (!userId) {
      toast.error('Please log in to access personalized exercises');
      return;
    }

    try {
      setLoadingPersonalized(true);
      const response = await exercisesAPI.generatePersonalized(userId);
      const exercise = response.data;
      
      // Format the exercise with title and topics
      const formattedExercise = {
        ...exercise,
        title: `Personalized Practice`,
        difficulty: exercise.difficulty || 'medium',
        topics: exercise.skillTags || ['Personalized Review']
      };
      
      // Directly start the exercise
      handleStartPersonalizedExercise(formattedExercise);
    } catch (error) {
      console.error('Failed to generate personalized exercise:', error);
      toast.error('Failed to generate personalized exercise');
    } finally {
      setLoadingPersonalized(false);
    }
  };

  const handleStartPersonalizedExercise = (exercise) => {
    // Create mock lesson and category for AI-generated exercises
    const aiLesson = {
      id: 'ai-generated',
      topic: 'Personalized Practice',
      description: 'AI-generated personalized practice'
    };
    
    const aiCategory = {
      id: 'ai-personalized',
      name: 'Personalized Practice',
      description: 'AI-generated exercises tailored for you'
    };
    
    // Use the same handler as regular exercises
    if (onStartExercise) {
      onStartExercise(exercise, aiLesson, aiCategory);
    } else {
      console.log('Starting personalized exercise:', exercise);
      toast.success(`Starting personalized exercise!`);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading exercises..." />;
  }

  return (
    <>
    {loadingPersonalized && <LoadingScreen message="Generating personalized exercise..." />}
    <div
      className="min-h-screen mt-[60px]"
      style={{
        backgroundImage: `url('/assets/background-images/background-1.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ── Glassmorphic nav bar ── */}
      <div
        style={{
          background: 'rgba(28,20,8,0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(200,170,100,0.18)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.20)',
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: 'rgba(255,248,230,0.90)',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(200,165,90,0.25)',
                  borderRadius: '9px',
                  padding: '0.4rem 0.9rem',
                  fontFamily: 'system-ui, sans-serif',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'rgba(200,165,90,0.18)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')
                }
              >
                <FaArrowLeft style={{ fontSize: '0.8rem' }} />
                Back
              </button>
            )}
            {!onBack && <div />}
            <div
              style={{
                color: '#d4b483',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FaDumbbell style={{ fontSize: '0.85rem' }} />
              Practice Exercises
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)',
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.60)',
            border: '1px solid rgba(100,80,40,0.22)',
            borderRadius: '999px',
            padding: '0.28rem 1rem',
            fontSize: '0.73rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#5c4a1e',
            marginBottom: '0.6rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          🏋️ Interactive Learning
        </span>
        <h1
          style={{
            fontSize: '45px',
            fontWeight: '800',
            color: '#1c1409',
            lineHeight: 1.2,
            margin: '0 auto 0.5rem',
            maxWidth: '720px',
            fontFamily: "'Georgia', serif",
            letterSpacing: '-0.3px',
            textShadow: '0 1px 0 rgba(255,255,255,0.8)',
            padding: '0 1rem',
          }}
        >
          Practice{' '}
          <span
            style={{
              color: '#9a6f2a',
              textShadow:
                '0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)',
            }}
          >
            Exercises
          </span>
        </h1>
        <p
          style={{
            fontSize: 'clamp(0.9rem,1.8vw,1.08rem)',
            color: '#3d2e0f',
            maxWidth: '540px',
            margin: '0 auto 0.5rem',
            lineHeight: 1.75,
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic',
            padding: '0 1rem',
          }}
        >
          Test your knowledge with interactive exercises.
        </p>
        <div
          style={{
            width: '52px',
            height: '3px',
            background: 'linear-gradient(90deg, #9a6f2a, #c9943a)',
            margin: '1rem auto 0',
            borderRadius: '99px',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Personalized Exercises Card */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div
              onClick={() => setExpandedPersonalized(!expandedPersonalized)}
              className="p-6 cursor-pointer hover:shadow-3xl transition-all"
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl">
                    <FaMagic className="text-3xl" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-2xl font-bold">Your Personalized Practice</h2>
                    </div>
                    <p className="text-white/90 text-sm">
                      AI-generated exercises tailored just for you based on your progress
                    </p>
                  </div>
                </div>
                <div className="text-2xl">
                  {expandedPersonalized ? <FaChevronDown /> : <FaChevronRight />}
                </div>
              </div>
            </div>

            {/* Personalized Exercise Button */}
            {expandedPersonalized && (
              <div className="p-4 bg-white/10 backdrop-blur-sm">
                <div
                  onClick={fetchPersonalizedExercise}
                  className="group bg-white rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all transform hover:scale-102"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-800">
                          Start Personalized Practice
                        </h3>
                      </div>
                    </div>
                    <div className="ml-4">
                      <svg
                        className="w-10 h-10 text-purple-500 transform group-hover:translate-x-2 transition-transform"
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
            )}
          </div>
        </div>

        {/* Exercises Tree */}
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="rounded-xl p-12 max-w-md mx-auto"
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(200,170,100,0.25)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              }}
            >
              <FaDumbbell
                className="text-5xl mx-auto mb-4"
                style={{ color: '#c9943a' }}
              />
              <p
                className="text-lg mb-4"
                style={{ color: '#5c4a1e', fontFamily: "'Georgia', serif" }}
              >
                No exercises available yet
              </p>
              <p style={{ color: '#8a7550', fontFamily: 'system-ui, sans-serif' }}>
                Exercises will appear here once they are created
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category, categoryIndex) => {
              const categoryLessons = getLessonsForCategory(category.id);
              const isCategoryExpanded = expandedCategories.has(category.id);
              const totalExercises = getTotalExercises(category.id);

              if (categoryLessons.length === 0) return null;

              return (
                <div
                  key={category.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(200,170,100,0.20)',
                  }}
                >
                  {/* Level 1: Category Card */}
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className={`bg-gradient-to-r ${getCategoryColor(categoryIndex)} p-6 cursor-pointer hover:shadow-xl transition-all`}
                  >
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">
                          {isCategoryExpanded ? <FaChevronDown /> : <FaChevronRight />}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold">{category.name}</h2>
                          {category.description && (
                            <p className="text-white/90 mt-1">{category.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{totalExercises}</div>
                        <div className="text-sm text-white/90">Exercises</div>
                      </div>
                    </div>
                  </div>

                  {/* Level 2 & 3: Lessons and Exercises */}
                  {isCategoryExpanded && (
                    <div
                      className="p-4"
                      style={{ background: 'rgba(255,252,245,0.92)' }}
                    >
                      {categoryLessons.map((lesson) => {
                        const lessonExercises = getExercisesForLesson(lesson.id);
                        const isLessonExpanded = expandedLessons.has(lesson.id);

                        if (lessonExercises.length === 0) return null;

                        return (
                          <div key={lesson.id} className="mb-3 last:mb-0">
                            {/* Level 2: Lesson Card */}
                            <div
                              onClick={() => toggleLesson(lesson.id)}
                              className="rounded-lg p-4 cursor-pointer transition-all"
                              style={{
                                background: 'rgba(255,255,255,0.90)',
                                border: '2px solid rgba(200,170,100,0.25)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.border = '2px solid rgba(200,165,90,0.60)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.10)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.border = '2px solid rgba(200,170,100,0.25)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div style={{ fontSize: '1.1rem', color: '#9a6f2a' }}>
                                    {isLessonExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                  </div>
                                  <div>
                                    <h3
                                      className="text-lg font-bold"
                                      style={{ color: '#1c1409', fontFamily: "'Georgia', serif" }}
                                    >
                                      {lesson.topic}
                                    </h3>
                                    {lesson.description && (
                                      <p className="text-sm mt-1" style={{ color: '#5c4a1e' }}>
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div
                                  className="px-3 py-1 rounded-full text-sm font-semibold"
                                  style={{
                                    background: 'rgba(200,170,100,0.18)',
                                    color: '#9a6f2a',
                                    border: '1px solid rgba(200,165,90,0.35)',
                                  }}
                                >
                                  {lessonExercises.length} Exercise{lessonExercises.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>

                            {/* Level 3: Exercise Cards */}
                            {isLessonExpanded && (
                              <div className="ml-8 mt-2 space-y-2">
                                {lessonExercises.map((exercise) => {
                                  const totalXP = exercise.question?.xp || 0;
                                  const isCompleted = exercise.completed === true;

                                  return (
                                    <div
                                      key={exercise.id}
                                      onClick={() => handleStartExercise(exercise, lesson, category)}
                                      className="group rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl transition-all transform hover:scale-102"
                                      style={{
                                        background: 'linear-gradient(135deg, #9a6f2a, #c9943a)',
                                      }}
                                    >
                                      <div className="flex items-center justify-between text-white">
                                        <div>
                                          <h4 className="text-lg font-bold">
                                            Exercise {exercise.exerciseNumber}
                                          </h4>
                                          <p className="text-sm mt-1" style={{ color: 'rgba(255,248,220,0.85)' }}>
                                            {exercise.question?.type?.replace('_', ' ') || 'Question'}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          {isCompleted && (
                                            <FaCheckCircle className="text-white text-2xl flex-shrink-0" title="Completed" />
                                          )}
                                          <div className="bg-white/20 px-4 py-2 rounded-lg">
                                            <div className="text-sm" style={{ color: 'rgba(255,248,220,0.85)' }}>Reward</div>
                                            <div className="text-xl font-bold">{totalXP} XP</div>
                                          </div>
                                          <svg
                                            className="w-6 h-6 transform group-hover:translate-x-2 transition-transform"
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
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default PracticeExercises;
