import { useState, useEffect } from 'react';
import { 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaStar,
  FaGem,
  FaClock
} from 'react-icons/fa';

const ChallengeModal = ({ challenge, onClose, onComplete }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [timeLeft, setTimeLeft] = useState(challenge.timeLimitSec || 45);
  const [timerActive, setTimerActive] = useState(true);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          handleSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive, timeLeft]);

  const handleSubmit = (timeOut = false) => {
    if (submitted) return;

    setSubmitted(true);
    setTimerActive(false);

    let correct = false;

    // Check answer based on challenge type
    switch (challenge.type) {
      case 'fill_blank':
        correct = challenge.answers?.some(ans => 
          userAnswer.toLowerCase().trim() === ans.toLowerCase().trim()
        );
        break;

      case 'multiple_choice':
        correct = selectedOptions.length === challenge.correct?.length &&
          selectedOptions.every(opt => challenge.correct?.includes(opt));
        break;

      case 'match_pairs': {
        const allMatched = challenge.pairs?.every(pair => 
          matchedPairs[pair.left] === pair.right
        );
        correct = allMatched && Object.keys(matchedPairs).length === challenge.pairs?.length;
        break;
      }

      case 'true_false':
        correct = selectedOptions[0] === challenge.correct?.[0];
        break;

      default:
        correct = false;
    }

    setIsCorrect(correct);

    // If correct and not timed out, call onComplete with rewards
    if (correct && !timeOut) {
      setTimeout(() => {
        onComplete(challenge.id, challenge.xp, challenge.coins);
      }, 2000);
    }
  };

  const handleOptionToggle = (optionId) => {
    if (submitted) return;

    if (challenge.type === 'multiple_choice') {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handlePairMatch = (left, right) => {
    if (submitted) return;
    
    setMatchedPairs(prev => ({
      ...prev,
      [left]: right
    }));
  };

  const renderChallengeContent = () => {
    switch (challenge.type) {
      case 'fill_blank':
        return (
          <div className="space-y-4">
            <p className="text-lg text-gray-700">{challenge.prompt}</p>
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={submitted}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg disabled:bg-gray-100"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 mb-4">{challenge.prompt}</p>
            <div className="space-y-3">
              {challenge.options?.map((option) => {
                const isSelected = selectedOptions.includes(option.id);
                const showCorrect = submitted && challenge.correct?.includes(option.id);
                const showWrong = submitted && isSelected && !challenge.correct?.includes(option.id);

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionToggle(option.id)}
                    disabled={submitted}
                    className={`
                      w-full p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected && !submitted ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                      ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                      ${showWrong ? 'border-red-500 bg-red-50' : ''}
                      ${!submitted ? 'hover:border-blue-400 cursor-pointer' : 'cursor-default'}
                      disabled:opacity-100
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{option.text}</span>
                      {showCorrect && <FaCheckCircle className="text-green-500 text-2xl" />}
                      {showWrong && <FaTimesCircle className="text-red-500 text-2xl" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'match_pairs':
        return (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 mb-4">{challenge.prompt}</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-3">
                {challenge.pairs?.map((pair, idx) => (
                  <div
                    key={`left-${idx}`}
                    className="p-4 bg-blue-100 border-2 border-blue-300 rounded-lg text-center font-semibold"
                  >
                    {pair.left}
                  </div>
                ))}
              </div>

              {/* Right Column - Shuffled */}
              <div className="space-y-3">
                {challenge.pairs?.map((pair, idx) => {
                  const isMatched = Object.values(matchedPairs).includes(pair.right);
                  const isCorrectMatch = submitted && matchedPairs[pair.left] === pair.right;
                  const isWrongMatch = submitted && matchedPairs[pair.left] && matchedPairs[pair.left] !== pair.right;

                  return (
                    <button
                      key={`right-${idx}`}
                      onClick={() => {
                        const leftKey = challenge.pairs?.[idx]?.left;
                        if (leftKey) handlePairMatch(leftKey, pair.right);
                      }}
                      disabled={submitted || isMatched}
                      className={`
                        w-full p-4 rounded-lg border-2 text-center font-semibold transition-all
                        ${isMatched && !submitted ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300'}
                        ${isCorrectMatch ? 'bg-green-200 border-green-500' : ''}
                        ${isWrongMatch ? 'bg-red-200 border-red-500' : ''}
                        ${!submitted && !isMatched ? 'hover:bg-orange-200 cursor-pointer' : 'cursor-default'}
                        disabled:opacity-70
                      `}
                    >
                      {pair.right}
                      {isCorrectMatch && <FaCheckCircle className="inline ml-2 text-green-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case 'true_false':
        return (
          <div className="space-y-4">
            <p className="text-lg text-gray-700 mb-6">{challenge.prompt}</p>
            <div className="flex gap-4">
              {['true', 'false'].map((option) => {
                const isSelected = selectedOptions.includes(option);
                const showCorrect = submitted && challenge.correct?.[0] === option;
                const showWrong = submitted && isSelected && challenge.correct?.[0] !== option;

                return (
                  <button
                    key={option}
                    onClick={() => handleOptionToggle(option)}
                    disabled={submitted}
                    className={`
                      flex-1 p-6 rounded-lg border-2 text-xl font-bold transition-all
                      ${isSelected && !submitted ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'}
                      ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                      ${showWrong ? 'border-red-500 bg-red-50' : ''}
                      ${!submitted ? 'hover:border-blue-400 cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    {option.toUpperCase()}
                    {showCorrect && <FaCheckCircle className="inline ml-2 text-green-500 text-2xl" />}
                    {showWrong && <FaTimesCircle className="inline ml-2 text-red-500 text-2xl" />}
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return <p>Unknown challenge type</p>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Challenge Time!</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <FaTimes className="text-2xl" />
            </button>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <FaStar className="text-yellow-300" />
                <span className="font-bold">{challenge.xp} XP</span>
              </div>
              <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-full">
                <FaGem className="text-blue-300" />
                <span className="font-bold">{challenge.coins} coins</span>
              </div>
            </div>

            {/* Timer */}
            <div className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-bold
              ${timeLeft <= 10 ? 'bg-red-500 animate-pulse' : 'bg-white bg-opacity-20'}
            `}>
              <FaClock />
              <span>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        {/* Challenge Content */}
        <div className="p-8">
          {renderChallengeContent()}

          {/* Submit Button */}
          {!submitted && (
            <button
              onClick={() => handleSubmit(false)}
              disabled={
                (challenge.type === 'fill_blank' && !userAnswer.trim()) ||
                (challenge.type !== 'fill_blank' && selectedOptions.length === 0 && Object.keys(matchedPairs).length === 0)
              }
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 rounded-lg font-bold text-lg
                hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Submit Answer
            </button>
          )}

          {/* Result Message */}
          {submitted && (
            <div className={`
              mt-6 p-6 rounded-lg text-center
              ${isCorrect ? 'bg-green-100 border-2 border-green-500' : 'bg-red-100 border-2 border-red-500'}
            `}>
              {isCorrect ? (
                <>
                  <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-700 mb-2">Excellent! 🎉</h3>
                  <p className="text-green-600 mb-4">You earned {challenge.xp} XP and {challenge.coins} coins!</p>
                  <div className="flex justify-center gap-4 text-3xl animate-bounce">
                    <FaStar className="text-yellow-500" />
                    <FaStar className="text-yellow-500" />
                    <FaStar className="text-yellow-500" />
                  </div>
                </>
              ) : (
                <>
                  <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-red-700 mb-2">
                    {timeLeft === 0 ? 'Time\'s Up! ⏰' : 'Not Quite Right 😔'}
                  </h3>
                  <p className="text-red-600 mb-4">
                    {timeLeft === 0 
                      ? 'You ran out of time. Try again to earn rewards!'
                      : 'Keep practicing! You\'ll get it next time.'}
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors"
                  >
                    Try Another Challenge
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChallengeModal;
