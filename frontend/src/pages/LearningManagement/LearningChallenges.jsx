import { useState, useEffect } from 'react';
import { 
  FaArrowLeft, 
  FaTrophy, 
  FaStar, 
  FaLock, 
  FaCheckCircle,
  FaFire,
  FaGem,
  FaMedal,
  FaCrown,
  FaBolt
} from 'react-icons/fa';
import { challengesAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import ChallengeModal from './ChallengeModal';

const LearningChallenges = ({ onBack }) => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({
    currentStreak: 5,
    totalXP: 2878,
    totalCoins: 5653,
    badges: ['beginner', 'fast_learner', 'word_master']
  });
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);

  useEffect(() => {
    fetchChallenges();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await challengesAPI.getAll(user?.id);
      setChallenges(response.data);
    } catch (error) {
      console.error('Failed to fetch challenges:', error);
      // Use mock data if API fails
      setChallenges(generateMockChallenges());
    } finally {
      setLoading(false);
    }
  };

  const generateMockChallenges = () => {
    const types = ['multiple_choice', 'text_input', 'match_pairs'];
    const mockChallenges = [];
    
    for (let i = 1; i <= 30; i++) {
      const type = types[i % types.length];
      mockChallenges.push({
        id: `challenge_${i}`,
        challengeNumber: i,
        question: {
          questionNo: String(i),
          type,
          prompt: `Challenge ${i}: Complete this Sinhala language task`,
          xp: 20 + (i % 3) * 10,
          points: 4 + (i % 2) * 2,
          timeLimitSec: 30,
          options: [
            { id: 'A', text: 'Option A', correct: true },
            { id: 'B', text: 'Option B', correct: false },
            { id: 'C', text: 'Option C', correct: false },
          ],
          correctOptions: ['A'],
          answer: 'sample answer',
          pairs: [{ left: 'Left 1', right: 'Right 1' }, { left: 'Left 2', right: 'Right 2' }],
        }
      });
    }
    
    return mockChallenges;
  };

  const isChallengeCompleted = (challenge) => {
    return challenge?.isCompleted === true;
  };

  // Derive the unlocked challenge purely from isCompleted values:
  // the challenge immediately after the last completed one is unlocked.
  // If nothing is completed yet, the first challenge (index 0) is unlocked.
  const getChallengeState = (challenge, index) => {
    if (isChallengeCompleted(challenge)) return 'completed';
    const lastCompletedIndex = challenges.reduce(
      (acc, c, i) => (c.isCompleted ? i : acc),
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
    // Mark the challenge as completed — getChallengeState will automatically
    // derive the new unlock position from the updated isCompleted values.
    setChallenges(prev => {
      const idx = prev.findIndex(c => (c._id || c.id) === challengeId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], isCompleted: true };
      return updated;
    });
    setUserProgress(prev => ({
      ...prev,
      totalXP: prev.totalXP + earnedXP,
      totalCoins: prev.totalCoins + earnedCoins,
      currentStreak: prev.currentStreak + 1
    }));
    
    setShowChallengeModal(false);
    toast.success(`+${earnedXP} XP! +${earnedCoins} coins!`);
  };

  const badges = [
    { id: 'beginner', icon: FaMedal, color: 'text-gray-400', name: 'Beginner', desc: 'Complete 1 challenge' },
    { id: 'fast_learner', icon: FaBolt, color: 'text-yellow-500', name: 'Fast Learner', desc: 'Complete 5 in a row' },
    { id: 'word_master', icon: FaCrown, color: 'text-purple-500', name: 'Word Master', desc: 'Complete 10 challenges' },
    { id: 'champion', icon: FaTrophy, color: 'text-yellow-600', name: 'Champion', desc: 'Complete 20 challenges' },
    { id: 'legend', icon: FaStar, color: 'text-blue-500', name: 'Legend', desc: 'Complete all challenges' }
  ];

  const ChallengeNode = ({ challenge, index, state }) => {
    const isEven = index % 2 === 0;
    const offset = isEven ? 'left' : 'right';
    
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
          <div className="absolute -bottom-6 bg-white text-gray-700 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm shadow">
            {index + 1}
          </div>
        </div>

        {/* Challenge Info Card */}
        <div className={`
          bg-white rounded-xl shadow-lg p-4 w-64 transition-all duration-300
          hover:shadow-xl border-2
          ${state === 'unlocked' ? 'border-blue-400' : state === 'completed' ? 'border-green-400' : 'border-gray-300'}
        `}>
          <div className="flex items-center justify-between mb-2">
            <span className={`
              px-3 py-1 rounded-full text-xs font-semibold capitalize
              ${challenge.question?.type === 'multiple_choice' ? 'bg-blue-100 text-blue-600' :
                challenge.question?.type === 'match_pairs' ? 'bg-orange-100 text-orange-600' :
                'bg-green-100 text-green-600'}
            `}>
              {challenge.question?.type?.replace('_', ' ') || 'challenge'}
            </span>
            <div className="flex gap-2">
              <span className="flex items-center text-yellow-600 font-bold">
                <FaStar className="mr-1" /> {challenge.question?.xp ?? 0}
              </span>
              <span className="flex items-center text-blue-600 font-bold">
                <FaGem className="mr-1" /> {challenge.question?.points ?? 0}
              </span>
            </div>
          </div>
          
          <p className="text-gray-700 text-sm line-clamp-2">
            {challenge.question?.prompt}
          </p>
          
          {state === 'locked' && (
            <div className="mt-2 text-xs text-gray-500 italic">
              Complete previous challenge to unlock
            </div>
          )}
        </div>
      </div>
    );
  };

  const MilestoneNode = ({ index, unlocked }) => {
    const isEven = index % 2 === 0;
    
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
              <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center animate-ping">
                !
              </div>
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-2xl font-bold text-gray-600">Loading challenges...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 pt-16">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-6"
          >
            <FaArrowLeft /> Back to Learning Hub
          </button>

          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Learning Path
            </h1>
            <p className="text-gray-600">
              Complete challenges to progress and earn rewards!
            </p>
          </div>

          {/* User Stats Bar */}
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-full shadow">
              <FaFire className="text-orange-500 text-xl" />
              <span className="font-bold text-orange-700">{userProgress.currentStreak} day streak</span>
            </div>
            
            <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-full shadow">
              <FaStar className="text-yellow-500 text-xl" />
              <span className="font-bold text-yellow-700">{userProgress.totalXP} XP</span>
            </div>
            
            <div className="flex items-center gap-2 bg-blue-100 px-4 py-2 rounded-full shadow">
              <FaGem className="text-blue-500 text-xl" />
              <span className="font-bold text-blue-700">{userProgress.totalCoins} coins</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Badges */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaTrophy className="text-yellow-500" />
                Your Badges
              </h3>
              
              <div className="space-y-3">
                {badges.map(badge => {
                  const BadgeIcon = badge.icon;
                  const earned = userProgress.badges.includes(badge.id);
                  
                  return (
                    <div 
                      key={badge.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg transition-all
                        ${earned ? 'bg-gradient-to-r from-yellow-50 to-orange-50 shadow' : 'bg-gray-50 opacity-50'}
                      `}
                    >
                      <BadgeIcon className={`text-3xl ${earned ? badge.color : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className={`font-bold text-sm ${earned ? 'text-gray-800' : 'text-gray-500'}`}>
                          {badge.name}
                        </div>
                        <div className="text-xs text-gray-500">{badge.desc}</div>
                      </div>
                      {earned && (
                        <FaCheckCircle className="text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm font-semibold text-gray-700 mb-2">
                  Progress: {challenges.filter(c => c.isCompleted).length}/{challenges.length}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${challenges.length > 0 ? (challenges.filter(c => c.isCompleted).length / challenges.length) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Center - Challenge Path */}
          <div className="lg:col-span-2">
            {/* Path Container */}
            <div className="relative">
              {/* Vertical Path Line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-300 via-purple-300 to-green-300 opacity-30" />

              {/* Challenges */}
              <div className="relative">
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
                        unlocked={challenge.isCompleted === true}
                      />
                    )}
                  </div>
                ))}

                {/* End Trophy */}
                <div className="flex items-center justify-center mt-12">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-2xl">
                    <FaCrown className="text-6xl mb-2" />
                    <div className="font-bold">Complete!</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Leaderboard/Stats */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FaMedal className="text-orange-500" />
                Achievements
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
                  <div className="text-xs text-blue-600 font-semibold mb-1">Total Challenges</div>
                  <div className="text-3xl font-bold text-blue-700">
                    {challenges.filter(c => c.isCompleted).length}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="text-xs text-green-600 font-semibold mb-1">Accuracy Rate</div>
                  <div className="text-3xl font-bold text-green-700">
                    94%
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
                  <div className="text-xs text-purple-600 font-semibold mb-1">Best Streak</div>
                  <div className="text-3xl font-bold text-purple-700">
                    {userProgress.currentStreak} days
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
                  <div className="text-xs text-orange-600 font-semibold mb-1">Time Spent</div>
                  <div className="text-3xl font-bold text-orange-700">
                    4.5h
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
          onClose={() => setShowChallengeModal(false)}
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
        
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LearningChallenges;
