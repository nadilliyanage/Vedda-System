import { useState, useEffect } from 'react';
import { 
  FaArrowLeft, 
  FaTrophy, 
  FaStar, 
  FaLock, 
  FaCheckCircle,
  FaGem,
  FaMedal,
  FaCrown,
  FaBolt
} from 'react-icons/fa';
import { challengesAPI, userStatAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ChallengeModal from './ChallengeModal';
import LoadingScreen from '../../components/ui/LoadingScreen';

const LearningChallenges = ({ onBack }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeStats, setChallengeStats] = useState({
    accuracy: null,
    bestStreak: null,
    totalTimeSpent: null,
  });

  useEffect(() => {
    fetchChallenges();
    fetchChallengeStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await challengesAPI.getAll(user?.id);
      const raw = response.data;

      // Normalize isCompleted to a real boolean regardless of what the backend sends
      const challengesData = raw.map(c => ({
        ...c,
        isCompleted: c.isCompleted === true || c.isCompleted === 'true' || c.isCompleted === 1,
      }));

      // Ensure first challenge is enabled by default if it doesn't have isEnabled set
      if (challengesData.length > 0 && !challengesData[0].isEnabled && !challengesData[0].isCompleted) {
        challengesData[0].isEnabled = true;
      }

      setChallenges(challengesData);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      setChallenges([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChallengeStats = async (delayMs = 0) => {
    try {
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
      const response = await userStatAPI.getChallengeStats(user?.id);
      const { accuracy, bestStreak, totalTimeSpent } = response.data;
      setChallengeStats({ accuracy, bestStreak, totalTimeSpent });
    } catch (error) {
      console.error('Failed to fetch challenge stats:', error);
    }
  };

  // Format seconds into human-readable time
  // < 60s  → "29 s"
  // >= 60s → "1 m 40 s"
  // >= 3600s → "1 h 2 m"
  const formatTimeSpent = (seconds) => {
    if (seconds === null || seconds === undefined) return '—';
    const s = Math.round(seconds);
    if (s < 60) return `${s} s`;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (h > 0) {
      return rem > 0 ? `${h} h ${m} m ${rem} s` : `${h} h ${m} m`;
    }
    return rem > 0 ? `${m} m ${rem} s` : `${m} m`;
  };


  const isChallengeCompleted = (challenge) => {
    return challenge?.isCompleted === true;
  };

  // Derive the unlocked challenge purely from isCompleted values:
  // the challenge immediately after the last completed one is unlocked.
  // If nothing is completed yet, the first challenge (index 0) is unlocked.
  // Also checks explicit isEnabled flag for overrides.
  const getChallengeState = (challenge, index) => {
    if (isChallengeCompleted(challenge)) return 'completed';

    // Check explicit isEnabled flag
    if (challenge?.isEnabled === true) return 'unlocked';

    const lastCompletedIndex = challenges.reduce(
      (acc, c, i) => (c.isCompleted === true ? i : acc),
      -1
    );
    if (index === lastCompletedIndex + 1) return 'unlocked';
    return 'locked';
  };

  const isMilestone = (index) => {
    // Every 5th challenge is a milestone
    return (index + 1) % 5 === 0;
  };

  const handleChallengeClick = (challenge, index) => {
    const state = getChallengeState(challenge, index);
    
    if (state === 'locked') {
      toast.error('Complete previous challenges to unlock this one!');
      return;
    }
    
    setSelectedChallenge(challenge);
    setShowChallengeModal(true);
  };

  const handleChallengeComplete = (challengeId, earnedXP, earnedCoins) => {
    setChallenges(prev => {
      const updated = [...prev];

      // Use string comparison to safely match MongoDB _id or regular id
      const completedIdx = updated.findIndex(c =>
        String(c._id || c.id) === String(challengeId)
      );
      if (completedIdx === -1) return prev;

      // Mark current challenge as completed
      updated[completedIdx] = { ...updated[completedIdx], isCompleted: true };

      // Mark next challenge as enabled (if it exists)
      if (completedIdx + 1 < updated.length) {
        updated[completedIdx + 1] = { ...updated[completedIdx + 1], isEnabled: true };
      }

      return updated;
    });

    // Re-fetch latest stats after a short delay so backend has time to persist
    fetchChallengeStats(1500);

    setShowChallengeModal(false);
    toast.success(`+${earnedXP} XP! +${earnedCoins} coins!`);
  };

  // Calculate earned badges based on completion percentage
  const completedCount = challenges.filter(isChallengeCompleted).length;
  const totalCount = challenges.length;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const allChallengesCompleted = totalCount > 0 && completedCount === totalCount;

  // Each badge unlocks at 20% increments
  const earnedBadgeIds = [];
  if (completionPercentage >= 20) earnedBadgeIds.push('beginner');
  if (completionPercentage >= 40) earnedBadgeIds.push('fast_learner');
  if (completionPercentage >= 60) earnedBadgeIds.push('word_master');
  if (completionPercentage >= 80) earnedBadgeIds.push('champion');
  if (completionPercentage >= 100) earnedBadgeIds.push('legend');

  const badges = [
    { id: 'beginner', icon: FaMedal, color: 'text-gray-400', name: 'Beginner', desc: 'Complete 20% of challenges', threshold: 20 },
    { id: 'fast_learner', icon: FaBolt, color: 'text-yellow-500', name: 'Fast Learner', desc: 'Complete 40% of challenges', threshold: 40 },
    { id: 'word_master', icon: FaCrown, color: 'text-purple-500', name: 'Word Master', desc: 'Complete 60% of challenges', threshold: 60 },
    { id: 'champion', icon: FaTrophy, color: 'text-yellow-600', name: 'Champion', desc: 'Complete 80% of challenges', threshold: 80 },
    { id: 'legend', icon: FaStar, color: 'text-blue-500', name: 'Legend', desc: 'Complete all challenges', threshold: 100 }
  ];

  const ChallengeNode = ({ challenge, index, state }) => {
    const offset = index % 2 === 0 ? 'left' : 'right';

    const stateStyles = {
      completed: 'bg-gradient-to-br from-green-400 to-green-600 shadow-lg scale-100',
      unlocked: 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-xl scale-110 animate-pulse-slow',
      locked: 'bg-gray-300 opacity-60'
    };

    const stateIcons = {
      completed: <FaCheckCircle className="text-2xl" />,
      unlocked: <FaStar className="text-2xl animate-spin-slow" />,
      locked: <FaLock className="text-xl" />
    };

    return (
      <div className={`flex items-center justify-center mb-8 ${offset === 'right' ? 'flex-row-reverse' : ''}`}>
        {/* Challenge Node */}
        <div 
          onClick={() => handleChallengeClick(challenge, index)}
          className={`
            relative w-24 h-24 rounded-full flex items-center justify-center
            text-white cursor-pointer transition-all duration-300
            hover:scale-125 transform
            ${stateStyles[state]}
            ${offset === 'left' ? 'mr-8' : 'ml-8'}
          `}
        >
          {stateIcons[state]}
          
          {/* Challenge Number */}
          <div
            className="absolute -bottom-6 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow"
            style={{ background: 'rgba(255,255,255,0.92)', color: '#5c4a1e', border: '1px solid rgba(200,170,100,0.35)' }}
          >
            {index + 1}
          </div>
        </div>

        {/* Challenge Info Card */}
        <div
          className="rounded-xl p-4 w-64 transition-all duration-300 hover:shadow-xl"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `2px solid ${
              state === 'unlocked' ? 'rgba(154,111,42,0.60)'
              : state === 'completed' ? '#22c55e'
              : 'rgba(200,170,100,0.25)'
            }`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
              style={{
                background:
                  challenge.question?.type === 'multiple_choice' ? 'rgba(59,130,246,0.12)' :
                  challenge.question?.type === 'match_pairs' ? 'rgba(249,115,22,0.12)' :
                  'rgba(34,197,94,0.12)',
                color:
                  challenge.question?.type === 'multiple_choice' ? '#3b82f6' :
                  challenge.question?.type === 'match_pairs' ? '#f97316' :
                  '#16a34a',
                border: '1px solid currentColor',
              }}
            >
              {challenge.question?.type?.replace('_', ' ') || 'challenge'}
            </span>
            <div className="flex gap-2">
              <span className="flex items-center font-bold" style={{ color: '#9a6f2a' }}>
                <FaStar className="mr-1" /> {challenge.question?.xp ?? 0}
              </span>
              <span className="flex items-center font-bold" style={{ color: '#5b8dd9' }}>
                <FaGem className="mr-1" /> {challenge.question?.points ?? 0}
              </span>
            </div>
          </div>
          
          {state === 'locked' && (
            <div className="mt-2 text-xs italic" style={{ color: '#8a7550' }}>
              Complete previous challenge to unlock
            </div>
          )}
        </div>
      </div>
    );
  };

  const MilestoneNode = ({ index, unlocked }) => {

    return (
      <div className="flex items-center justify-center mb-12 relative">
        {/* Milestone Chest */}
        <div className={`
          relative w-32 h-32 rounded-2xl flex flex-col items-center justify-center
          transition-all duration-500 transform
          ${unlocked ? 
            'bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 shadow-2xl scale-110 animate-bounce-slow' : 
            'bg-gray-400 opacity-50'}
        `}>
          <FaTrophy className="text-5xl text-white mb-2" />
          <div className="text-white font-bold text-sm">Milestone {Math.floor((index + 1) / 5)}</div>
          
          {unlocked && (
            <>
              <div className="absolute -bottom-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                +50 XP Bonus!
              </div>
            </>
          )}
          
          {!unlocked && (
            <FaLock className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl text-gray-600" />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingScreen message="Loading challenges..." />;
  }

  return (
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
              <FaTrophy style={{ fontSize: '0.85rem' }} />
              Challenges
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
          paddingBottom: '1rem',
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
          🏆 Challenges
        </span>
        <h1
          style={{
            fontSize: '45px',
            fontWeight: '800',
            color: '#1c1409',
            lineHeight: 1.2,
            margin: '0 auto 0.4rem',
            maxWidth: '720px',
            fontFamily: "'Georgia', serif",
            letterSpacing: '-0.3px',
            textShadow: '0 1px 0 rgba(255,255,255,0.8)',
            padding: '0 1rem',
          }}
        >
          Challenge{' '}
          <span
            style={{
              color: '#9a6f2a',
              textShadow: '0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)',
            }}
          >
            Path
          </span>
        </h1>
        <p
          style={{
            fontSize: 'clamp(0.9rem,1.8vw,1.08rem)',
            color: '#3d2e0f',
            maxWidth: '540px',
            margin: '0 auto 0.8rem',
            lineHeight: 1.75,
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic',
            padding: '0 1rem',
          }}
        >
          Complete challenges to progress and earn rewards!
        </p>

        {/* User Stats Bar */}
        {/* <div className="flex items-center justify-center gap-4 flex-wrap pb-2">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow"
            style={{ background: 'rgba(251,146,60,0.18)', border: '1px solid rgba(251,146,60,0.40)' }}
          >
            <FaFire style={{ color: '#f97316', fontSize: '1.1rem' }} />
            <span className="font-bold" style={{ color: '#c2410c' }}>{userProgress.currentStreak} day streak</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow"
            style={{ background: 'rgba(200,170,100,0.18)', border: '1px solid rgba(200,165,90,0.45)' }}
          >
            <FaStar style={{ color: '#9a6f2a', fontSize: '1.1rem' }} />
            <span className="font-bold" style={{ color: '#9a6f2a' }}>{userProgress.totalXP} XP</span>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full shadow"
            style={{ background: 'rgba(147,197,253,0.18)', border: '1px solid rgba(96,165,250,0.40)' }}
          >
            <FaGem style={{ color: '#3b82f6', fontSize: '1.1rem' }} />
            <span className="font-bold" style={{ color: '#1d4ed8' }}>{userProgress.totalCoins} coins</span>
          </div>
        </div> */}

        <div
          style={{
            width: '52px',
            height: '3px',
            background: 'linear-gradient(90deg, #9a6f2a, #c9943a)',
            margin: '0.8rem auto 0',
            borderRadius: '99px',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Badges */}
          <div className="lg:col-span-1">
            <div
              className="rounded-xl p-6 sticky top-4"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(200,170,100,0.28)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: '#1c1409', fontFamily: "'Georgia', serif" }}
              >
                <FaTrophy style={{ color: '#c9943a' }} />
                Your Badges
              </h3>
              
              <div className="space-y-3">
                {badges.map(badge => {
                  const BadgeIcon = badge.icon;
                  const earned = earnedBadgeIds.includes(badge.id);

                  return (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg transition-all"
                      style={{
                        background: earned ? 'rgba(200,170,100,0.12)' : 'rgba(200,200,200,0.08)',
                        border: earned ? '1px solid rgba(200,165,90,0.30)' : '1px solid rgba(200,200,200,0.20)',
                        opacity: earned ? 1 : 0.5,
                      }}
                    >
                      <BadgeIcon className={`text-3xl ${earned ? badge.color : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div
                          className="font-bold text-sm"
                          style={{ color: earned ? '#1c1409' : '#6b7280' }}
                        >
                          {badge.name}
                        </div>
                        <div className="text-xs" style={{ color: '#8a7550' }}>{badge.desc}</div>
                      </div>
                      {earned && (
                        <FaCheckCircle className="text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center - Challenge Path */}
          <div className="lg:col-span-2">
            {/* Path Container */}
            <div
              className="relative rounded-2xl px-6 py-8"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(180,160,220,0.30)',
                boxShadow: '0 6px 32px rgba(80,60,160,0.10)',
              }}
            >
              {/* Challenges */}
              <div className="relative">
                {/* Challenges only — line lives here, stops before the trophy */}
                <div className="relative">
                  {/* Vertical Path Line — spans only the challenge nodes */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 opacity-70"
                    style={{ top: '3rem', bottom: '3rem' }} />
                  {challenges.map((challenge, index) => (
                    <div key={challenge.id}>
                      <ChallengeNode 
                        challenge={challenge} 
                        index={index}
                        state={getChallengeState(challenge, index)}
                      />
                      
                      {isMilestone(index) && (
                        <MilestoneNode 
                          index={index}
                          unlocked={isChallengeCompleted(challenge)}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* End Trophy */}
                <div className="flex items-center justify-center mt-12">
                  {allChallengesCompleted ? (
                    <div className="relative trophy-glow trophy-pop bg-gradient-to-br from-purple-500 to-pink-500 w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-2xl">
                      <div className="pulse-ring" />
                      <FaCrown className="text-6xl mb-2 animate-bounce-slow" />
                      <div className="font-bold">Complete!</div>
                      <span className="absolute -top-2 -right-1 text-xl">✨</span>
                      <span className="absolute -bottom-1 -left-2 text-lg">🎉</span>
                    </div>
                  ) : (
                    <div
                      className="relative w-40 h-40 rounded-full flex flex-col items-center justify-center text-gray-600 shadow-lg"
                      style={{
                        background: 'linear-gradient(135deg, #d1d5db, #9ca3af)',
                        border: '2px solid rgba(107,114,128,0.35)',
                        opacity: 0.8,
                      }}
                    >
                      <FaCrown className="text-6xl mb-2 text-gray-500" />
                      <div className="font-bold text-sm text-center px-3">Complete all challenges</div>
                      {/*<FaLock className="absolute top-5 right-5 text-lg text-gray-700" />*/}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Leaderboard/Stats */}
          <div className="lg:col-span-1">
            <div
              className="rounded-xl p-6 sticky top-4"
              style={{
                background: 'rgba(255,255,255,0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(200,170,100,0.28)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              }}
            >
              <h3
                className="text-xl font-bold mb-4 flex items-center gap-2"
                style={{ color: '#1c1409', fontFamily: "'Georgia', serif" }}
              >
                <FaMedal style={{ color: '#f97316' }} />
                Achievements
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-semibold mb-1">Progress</div>
                  <div className="text-3xl font-bold text-blue-700">
                    {completedCount}/{challenges.length}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="text-xs text-green-600 font-semibold mb-1">Accuracy Rate</div>
                  <div className="text-3xl font-bold text-green-700">
                    {challengeStats.accuracy !== null
                      ? `${challengeStats.accuracy.toFixed(1)}%`
                      : '—'}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="text-xs text-purple-600 font-semibold mb-1">Best Streak</div>
                  <div className="text-3xl font-bold text-purple-700">
                    {challengeStats.bestStreak !== null
                      ? `${challengeStats.bestStreak} day${challengeStats.bestStreak !== 1 ? 's' : ''}`
                      : '—'}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                  <div className="text-xs text-orange-600 font-semibold mb-1">Time Spent</div>
                  <div className="text-3xl font-bold text-orange-700">
                    {formatTimeSpent(challengeStats.totalTimeSpent)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && selectedChallenge && (
        <ChallengeModal
          challenge={selectedChallenge}
          onClose={() => {
            setShowChallengeModal(false);
            fetchChallengeStats(1500);
          }}
          onComplete={handleChallengeComplete}
        />
      )}

      <style>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes trophy-glow {
          0%, 100% { box-shadow: 0 0 0 rgba(236,72,153,0.0), 0 18px 34px rgba(0,0,0,0.28); }
          50% { box-shadow: 0 0 26px rgba(236,72,153,0.55), 0 18px 34px rgba(0,0,0,0.28); }
        }

        @keyframes trophy-pop {
          0% { transform: scale(0.95); }
          60% { transform: scale(1.06); }
          100% { transform: scale(1); }
        }

        @keyframes pulse-ring {
          0% { transform: scale(0.85); opacity: 0.7; }
          100% { transform: scale(1.25); opacity: 0; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .trophy-glow {
          animation: trophy-glow 2.2s ease-in-out infinite;
        }

        .trophy-pop {
          animation: trophy-pop 450ms ease-out;
        }

        .pulse-ring {
          position: absolute;
          inset: -10px;
          border-radius: 9999px;
          border: 3px solid rgba(236,72,153,0.45);
          animation: pulse-ring 1.7s ease-out infinite;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default LearningChallenges;
