import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaSpinner, FaChevronDown, FaChevronRight, FaDumbbell, FaMagic, FaStar } from 'react-icons/fa';
import { categoriesAPI, lessonsAPI, exercisesAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <FaSpinner className="text-5xl text-orange-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading exercises...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 pt-16">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
            >
              <FaArrowLeft /> Back
            </button>
          )}
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Practice Exercises
            </h1>
            <p className="text-lg text-gray-600">
              Test your knowledge with interactive exercises
            </p>
          </div>
        </div>

        {/* Personalized Exercises Card - Fixed Section */}
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
                      <FaStar className="text-yellow-300 text-xl animate-pulse" />
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
                  {loadingPersonalized ? (
                    <div className="flex items-center justify-center gap-3">
                      <FaSpinner className="text-2xl text-purple-500 animate-spin" />
                      <span className="text-lg text-gray-700 font-semibold">
                        Generating personalized exercise...
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FaMagic className="text-3xl text-purple-500" />
                          <h3 className="text-2xl font-bold text-gray-800">
                            Start Personalized Practice
                          </h3>
                        </div>
                        <p className="text-gray-600 ml-12">
                          Get an AI-generated exercise tailored to your learning progress and weak areas
                        </p>
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
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exercises Tree */}
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-white rounded-xl shadow-md p-12 max-w-md mx-auto">
              <FaDumbbell className="text-5xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No exercises available yet</p>
              <p className="text-gray-400">
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
                <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                    <div className="p-4 bg-gray-50">
                      {categoryLessons.map((lesson) => {
                        const lessonExercises = getExercisesForLesson(lesson.id);
                        const isLessonExpanded = expandedLessons.has(lesson.id);

                        if (lessonExercises.length === 0) return null;

                        return (
                          <div key={lesson.id} className="mb-3 last:mb-0">
                            {/* Level 2: Lesson Card */}
                            <div
                              onClick={() => toggleLesson(lesson.id)}
                              className="bg-white border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-orange-400 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-lg text-orange-600">
                                    {isLessonExpanded ? <FaChevronDown /> : <FaChevronRight />}
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-gray-800">
                                      {lesson.topic}
                                    </h3>
                                    {lesson.description && (
                                      <p className="text-sm text-gray-600 mt-1">
                                        {lesson.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-semibold">
                                  {lessonExercises.length} Exercise{lessonExercises.length !== 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>

                            {/* Level 3: Exercise Cards */}
                            {isLessonExpanded && (
                              <div className="ml-8 mt-2 space-y-2">
                                {lessonExercises.map((exercise) => {
                                  const totalXP = exercise.question?.xp || 0;
                                  
                                  return (
                                    <div
                                      key={exercise.id}
                                      onClick={() => handleStartExercise(exercise, lesson, category)}
                                      className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg p-4 cursor-pointer shadow-md hover:shadow-xl transition-all transform hover:scale-102"
                                    >
                                      <div className="flex items-center justify-between text-white">
                                        <div>
                                          <h4 className="text-lg font-bold">
                                            Exercise {exercise.exerciseNumber}
                                          </h4>
                                          <p className="text-sm text-blue-100 mt-1">
                                            {exercise.question?.type?.replace('_', ' ') || 'Question'}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <div className="bg-white/20 px-4 py-2 rounded-lg">
                                            <div className="text-sm text-blue-100">Reward</div>
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

        {/* Info Card */}
        {categories.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              How It Works
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Browse exercises organized by category and lesson. Click on any category to 
              see its lessons, then click on a lesson to reveal available exercises. 
              Start an exercise to test your knowledge and earn XP rewards!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeExercises;
