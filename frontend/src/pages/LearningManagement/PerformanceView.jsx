import { useState, useEffect, useRef } from 'react';
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

  const [leaderboard, setLeaderboard] = useState([]);
  const currentUserRef = useRef(null);

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

    // Fetch leaderboard data
    userStatAPI.getLeaderboard(userId).then((response) => {
      setLeaderboard([...response.data].sort((a, b) => a.rank - b.rank));
    }).catch(() => setLeaderboard([]));
  }, [user?.id]);

  // Auto-scroll to current user within the leaderboard container only
  useEffect(() => {
    if (currentUserRef.current) {
      const element = currentUserRef.current;
      const container = element.closest('.h-80');
      
      if (container) {
        const elementTop = element.offsetTop;
        const containerHeight = container.clientHeight;
        const scrollPosition = elementTop - (containerHeight / 2) + (element.clientHeight / 2);
        
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [leaderboard]);

  return (
    <div className="min-h-screen mt-[60px]" style={{ backgroundImage: "url('/assets/background-images/background-1.png')", backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>

      {/* Glassmorphic nav bar */}
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
              Back to Learning Hub
            </button>
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
              Performance
            </div>
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="py-10 px-6 text-center" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)' }}>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 text-xs font-semibold uppercase tracking-widest" style={{ background: 'rgba(255,255,255,0.60)', border: '1px solid rgba(100,80,40,0.22)', borderRadius: 999, color: '#5c4a1e', letterSpacing: '0.16em' }}>
          <FaChartLine className="text-xs" style={{ color: '#9a6f2a' }} /> Learning Analytics
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Georgia, serif', color: '#1c1409' }}>Performance <span style={{ color: '#9a6f2a' }}>Dashboard</span></h1>
        <p className="text-base" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', color: '#3d2e0f' }}>Track your learning progress and achievements</p>
        <div style={{ width: 52, height: 3, background: 'linear-gradient(90deg,#9a6f2a,#c9943a)', margin: '1rem auto 0', borderRadius: 9 }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Lessons Completed */}
          <div className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,170,100,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
            <div className="flex items-center justify-between mb-4">
              <FaCheckCircle className="text-4xl" style={{ color: '#9a6f2a' }} />
              <div className="text-right">
                <p className="text-sm" style={{ color: '#7a5820' }}>Lessons</p>
                <p className="text-3xl font-bold" style={{ color: '#1c1409' }}>
                  {stats.totalLessonsCompleted !== undefined && stats.totalLessons !== undefined ? (
                    `${stats.totalLessonsCompleted} / ${stats.totalLessons}`
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm" style={{ color: '#7a5820' }}>Completed</p>
          </div>

          {/* Exercises Completed */}
          <div className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,170,100,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
            <div className="flex items-center justify-between mb-4">
              <FaTrophy className="text-4xl" style={{ color: '#c9943a' }} />
              <div className="text-right">
                <p className="text-sm" style={{ color: '#7a5820' }}>Exercises</p>
                <p className="text-3xl font-bold" style={{ color: '#1c1409' }}>
                  {stats.totalExercisesCompleted !== undefined && stats.totalExercises !== undefined ? (
                    `${stats.totalExercisesCompleted} / ${stats.totalExercises}`
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm" style={{ color: '#7a5820' }}>Completed</p>
          </div>

          {/* Average Score */}
          <div className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,170,100,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
            <div className="flex items-center justify-between mb-4">
              <FaChartLine className="text-4xl" style={{ color: '#9a6f2a' }} />
              <div className="text-right">
                <p className="text-sm" style={{ color: '#7a5820' }}>Avg Score</p>
                <p className="text-3xl font-bold" style={{ color: '#1c1409' }}>
                  {stats.averageScore !== undefined ? (
                    `${stats.averageScore}%`
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm" style={{ color: '#7a5820' }}>Overall Performance</p>
          </div>

          {/* Current Streak */}
          <div className="rounded-xl p-6 transform hover:scale-105 transition-all duration-300" style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,170,100,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
            <div className="flex items-center justify-between mb-4">
              <FaClock className="text-4xl" style={{ color: '#c9943a' }} />
              <div className="text-right">
                <p className="text-sm" style={{ color: '#7a5820' }}>Streak</p>
                <p className="text-3xl font-bold" style={{ color: '#1c1409' }}>
                  {stats.streak !== undefined ? (
                    stats.streak
                  ) : (
                    <LoadingSpinner size="lg" />
                  )}
                </p>
              </div>
            </div>
            <p className="text-sm" style={{ color: '#7a5820' }}>Days in a row</p>
          </div>
        </div>

        {/* Progress Chart Section */}
        {/* <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Learning Progress</h2>
          <div className="flex items-center justify-center h-64 bg-gradient-to-br from-purple-100 to-teal-100 rounded-lg">
            <p className="text-gray-600 text-lg">
              📊 Progress chart visualization coming soon
            </p>
          </div>
        </div> */}

        {/* Mistake Types Section */}
        <div className="rounded-xl p-8 mb-8" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,170,100,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1c1409' }}>Common Mistake Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-shadow" style={{ background: 'rgba(254,226,226,0.60)', border: '1px solid rgba(248,113,113,0.30)' }}>
              <div>
                <p className="font-semibold" style={{ color: '#1c1409' }}>Spelling Error</p>
                <p className="text-sm" style={{ color: '#6b4a10' }}>Misspelled words</p>
              </div>
              <div className="text-3xl font-bold text-red-600">
                {errorData.spelling_error !== undefined ? errorData.spelling_error : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-shadow" style={{ background: 'rgba(200,170,100,0.14)', border: '1px solid rgba(200,165,90,0.35)' }}>
              <div>
                <p className="font-semibold" style={{ color: '#1c1409' }}>Missing Word</p>
                <p className="text-sm" style={{ color: '#6b4a10' }}>Words omitted</p>
              </div>
              <div className="text-3xl font-bold" style={{ color: '#9a6f2a' }}>
                {errorData.missing_word !== undefined ? errorData.missing_word : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-shadow" style={{ background: 'rgba(254,215,170,0.45)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <div>
                <p className="font-semibold" style={{ color: '#1c1409' }}>Word Order Error</p>
                <p className="text-sm" style={{ color: '#6b4a10' }}>Incorrect word sequence</p>
              </div>
              <div className="text-3xl font-bold text-orange-600">
                {errorData.word_order_error !== undefined ? errorData.word_order_error : <LoadingSpinner size="md" />}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg hover:shadow-md transition-shadow" style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(200,170,100,0.20)' }}>
              <div>
                <p className="font-semibold" style={{ color: '#1c1409' }}>Other</p>
                <p className="text-sm" style={{ color: '#6b4a10' }}>Miscellaneous errors</p>
              </div>
              <div className="text-3xl font-bold" style={{ color: '#7a5820' }}>
                {errorData.other !== undefined ? errorData.other : <LoadingSpinner size="md" />}
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,170,100,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <h2 className="text-2xl font-bold mb-6 flex items-center" style={{ fontFamily: 'Georgia, serif', color: '#1c1409' }}>
            <FaTrophy className="mr-3" style={{ color: '#c9943a' }} />
            Leaderboard
          </h2>
          <div className="h-80 overflow-y-auto overflow-x-hidden space-y-3 scroll-smooth">
            {leaderboard.length > 0 ? (
              leaderboard.map((player) => {
                const isCurrentUser = player.is_current_user;
                const isTopThree = player.rank <= 3;
                
                return (
                  <div
                    key={player.rank}
                    ref={isCurrentUser ? currentUserRef : null}
                    className="mt-0 mb-2 ml-8 me-8 flex items-center justify-between p-2 rounded-lg transition-all"
                    style={isCurrentUser
                      ? { background: 'rgba(200,170,100,0.18)', border: '2px solid rgba(200,165,90,0.55)', boxShadow: '0 2px 12px rgba(154,111,42,0.18)', transform: 'scale(1.03)' }
                      : { background: 'rgba(255,255,255,0.50)', border: '1px solid rgba(200,170,100,0.18)' }}
                  >
                    <div className="flex items-center flex-1">
                      {/* Rank Badge */}
                      <div className={`w-10 h-12 rounded-full flex items-center justify-center mr-4 font-bold text-lg ${
                        player.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                        player.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                        player.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {isTopThree ? (
                          player.rank === 1 ? '🥇' :
                          player.rank === 2 ? '🥈' :
                          '🥉'
                        ) : (
                          '🙍‍♂️'
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div>
                        <p className="font-semibold" style={isCurrentUser ? { color: '#6b4a10', fontSize: '1.1rem' } : { color: '#1c1409' }}>
                          {player.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs px-2 py-1 rounded-full" style={{ background: 'linear-gradient(135deg,#9a6f2a,#c9943a)', color: '#fff' }}>
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {player.rank === 1 ? '👑 Champion' :
                           player.rank === 2 ? '⭐ Runner Up' :
                           player.rank === 3 ? '🌟 Top Performer' :
                           'Keep learning!'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Rank & Points */}
                    <div className="text-right" style={isCurrentUser ? { fontWeight: 700, color: '#9a6f2a' } : { color: '#5c4a1e' }}>
                      <p className="text-2xl font-bold">#{player.rank}</p>
                      <p className="text-xs">{player.totalPoints} pts</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8" style={{ color: '#9a7840' }}>
                <FaTrophy className="text-6xl mx-auto mb-4" style={{ color: 'rgba(200,170,100,0.45)' }} />
                <p>No leaderboard data available yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mt-8 rounded-xl p-8" style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)', border: '1px solid rgba(200,170,100,0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Georgia, serif', color: '#1c1409' }}>Achievements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col items-center p-4 rounded-lg" style={{ background: 'rgba(200,170,100,0.14)', border: '1px solid rgba(200,165,90,0.30)' }}>
              <span className="text-4xl mb-2">🌟</span>
              <p className="text-sm font-semibold" style={{ color: '#5c4a1e' }}>First Lesson</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg" style={{ background: 'rgba(200,170,100,0.14)', border: '1px solid rgba(200,165,90,0.30)' }}>
              <span className="text-4xl mb-2">🎯</span>
              <p className="text-sm font-semibold" style={{ color: '#5c4a1e' }}>10 Exercises</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg" style={{ background: 'rgba(200,170,100,0.14)', border: '1px solid rgba(200,165,90,0.30)' }}>
              <span className="text-4xl mb-2">🔥</span>
              <p className="text-sm font-semibold" style={{ color: '#5c4a1e' }}>7 Day Streak</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-lg" style={{ background: 'rgba(200,170,100,0.14)', border: '1px solid rgba(200,165,90,0.30)' }}>
              <span className="text-4xl mb-2">🏆</span>
              <p className="text-sm font-semibold" style={{ color: '#5c4a1e' }}>Top Performer</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceView;
