import { useState, useEffect } from 'react';
import { FaArrowLeft, FaChartLine, FaTrophy, FaCheckCircle, FaClock } from 'react-icons/fa';
import { userStatAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const PerformanceView = ({ onBack }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLessonsCompleted: undefined,
    totalLessons: undefined,
    totalExercisesCompleted: undefined,
    totalExercises: undefined,
    averageScore: undefined,
    streak: undefined,
    totalTimeSpent: undefined,
    recentActivities: []
  });

  const [errorData, setErrorData] = useState({
    spelling_error: undefined,
    wrong_question_word: undefined,
    wrong_verb_form: undefined,
    missing_word: undefined,
    word_order_error: undefined,
    other: undefined
  });

  useEffect(() => {
    const userId = user?.id;
    setIsLoading(true);
    userStatAPI.userDashboard(userId).then((response) => {
      setStats({
        totalLessonsCompleted: response.data.lessons_completed,
        totalLessons: response.data.total_lessons,
        totalExercisesCompleted: response.data.exercises_completed,
        totalExercises: response.data.total_exercises,
        averageScore: response.data.avg_score,
        streak: response.data.streak,
        totalTimeSpent: 320, // in minutes
        recentActivities: [
          { type: 'lesson', title: 'Basic Greetings', score: 92, date: '2025-12-26' },
          { type: 'exercise', title: 'Family Terms Practice', score: 88, date: '2025-12-25' },
          { type: 'challenge', title: 'Nature Vocabulary Quiz', score: 95, date: '2025-12-24' },
        ]
      });

      setErrorData({
        spelling_error: response.data.error_stats?.spelling_error ?? 0,
        wrong_question_word: response.data.error_stats?.wrong_question_word ?? 0,
        wrong_verb_form: response.data.error_stats?.wrong_verb_form ?? 0,
        missing_word: response.data.error_stats?.missing_word ?? 0,
        word_order_error: response.data.error_stats?.word_order_error ?? 0,
        other: response.data.error_stats?.other ?? 0
      });
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-teal-50 py-8 px-4 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-white/50 rounded-full transition-colors"
          >
            <FaArrowLeft className="text-2xl text-gray-700" />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-800">Performance Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your learning progress and achievements</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Lessons Completed */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <FaCheckCircle className="text-4xl text-blue-500" />
              <div className="text-right">
                <p className="text-sm text-gray-600">Lessons</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.totalLessonsCompleted !== undefined && stats.totalLessons !== undefined ? (
                    `${stats.totalLessonsCompleted} / ${stats.totalLessons}`
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Completed</p>
          </div>

          {/* Exercises Completed */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <FaTrophy className="text-4xl text-orange-500" />
              <div className="text-right">
                <p className="text-sm text-gray-600">Exercises</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.totalExercisesCompleted !== undefined && stats.totalExercises !== undefined ? (
                    `${stats.totalExercisesCompleted} / ${stats.totalExercises}`
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Completed</p>
          </div>

          {/* Average Score */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <FaChartLine className="text-4xl text-purple-500" />
              <div className="text-right">
                <p className="text-sm text-gray-600">Avg Score</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.averageScore !== undefined ? (
                    `${stats.averageScore}%`
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Overall Performance</p>
          </div>

          {/* Current Streak */}
          <div className="bg-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <FaClock className="text-4xl text-teal-500" />
              <div className="text-right">
                <p className="text-sm text-gray-600">Streak</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.streak !== undefined ? (
                    stats.streak
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-500">Days in a row</p>
          </div>
        </div>

        {/* Progress Chart Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Learning Progress</h2>
          <div className="flex items-center justify-center h-64 bg-gradient-to-br from-purple-100 to-teal-100 rounded-lg">
            <p className="text-gray-600 text-lg">
              📊 Progress chart visualization coming soon
            </p>
          </div>
        </div>

        {/* Mistake Types Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Common Mistake Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-gray-800">Spelling Error</p>
                <p className="text-sm text-gray-600">Misspelled words</p>
              </div>
              <div className="text-3xl font-bold text-red-600">
                {errorData.spelling_error !== undefined ? errorData.spelling_error : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-gray-800">Wrong Question Word</p>
                <p className="text-sm text-gray-600">Incorrect question formation</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {errorData.wrong_question_word !== undefined ? errorData.wrong_question_word : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-gray-800">Wrong Verb Form</p>
                <p className="text-sm text-gray-600">Incorrect verb conjugation</p>
              </div>
              <div className="text-3xl font-bold text-purple-600">
                {errorData.wrong_verb_form !== undefined ? errorData.wrong_verb_form : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-gray-800">Missing Word</p>
                <p className="text-sm text-gray-600">Words omitted</p>
              </div>
              <div className="text-3xl font-bold text-yellow-600">
                {errorData.missing_word !== undefined ? errorData.missing_word : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-gray-800">Word Order Error</p>
                <p className="text-sm text-gray-600">Incorrect word sequence</p>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {errorData.word_order_error !== undefined ? errorData.word_order_error : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
              <div>
                <p className="font-semibold text-gray-800">Other</p>
                <p className="text-sm text-gray-600">Miscellaneous errors</p>
              </div>
              <div className="text-3xl font-bold text-gray-600">
                {errorData.other !== undefined ? errorData.other : <LoadingSpinner size="md" />}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Activities</h2>
          <div className="space-y-4">
            {stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                      activity.type === 'lesson' ? 'bg-blue-100' :
                      activity.type === 'exercise' ? 'bg-orange-100' :
                      'bg-green-100'
                    }`}>
                      {activity.type === 'lesson' ? '📚' :
                       activity.type === 'exercise' ? '💪' :
                       '🏆'}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{activity.title}</p>
                      <p className="text-sm text-gray-600">{activity.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-purple-600">{activity.score}%</p>
                    <p className="text-sm text-gray-600">Score</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activities yet. Start learning to see your progress!</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-lg">
              <span className="text-4xl mb-2">🌟</span>
              <p className="text-sm font-semibold text-gray-700">First Lesson</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
              <span className="text-4xl mb-2">🎯</span>
              <p className="text-sm font-semibold text-gray-700">10 Exercises</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
              <span className="text-4xl mb-2">🔥</span>
              <p className="text-sm font-semibold text-gray-700">7 Day Streak</p>
            </div>
            <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
              <span className="text-4xl mb-2">🏆</span>
              <p className="text-sm font-semibold text-gray-700">Top Performer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceView;
