import { useState, useEffect } from 'react';
import { FaArrowLeft, FaChartLine, FaTrophy, FaCheckCircle, FaClock } from 'react-icons/fa';
import { userStatAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';


const PerformanceView = ({ onBack }) => {
  const { user } = useAuth();
  // Placeholder data - in a real app, this would come from an API
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

  useEffect(() => {
    const userId = user?.id;
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
    })

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
                <p className="text-3xl font-bold text-gray-800">{stats.totalLessonsCompleted} / {stats.totalLessons}</p>
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
                <p className="text-3xl font-bold text-gray-800">{stats.totalExercisesCompleted} / {stats.totalExercises}</p>
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
                <p className="text-3xl font-bold text-gray-800">{stats.averageScore}%</p>
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
                <p className="text-3xl font-bold text-gray-800">{stats.streak}</p>
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
