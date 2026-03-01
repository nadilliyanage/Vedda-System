import { useState, useEffect, useCallback } from 'react';
import { 
  FaTimes, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaStar,
  FaGem,
  FaClock,
  FaRedo,
  FaSpinner
} from 'react-icons/fa';
import { exercisesAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * ChallengeModal
 * Renders a challenge from the backend `challenges` collection.
 * Each challenge has a nested `question` object identical in shape
 * to the exercise question used by ExerciseQuizRunner.
 *
 * challenge shape:
 *   { id, lessonId, categoryId, challengeNumber, skillTags,
 *     question: { questionNo, type, prompt, xp, points, timeLimitSec,
 *                 options[{id,text,correct}], correctOptions[], answer, pairs[{left,right}] }
 *   }
 */
const ChallengeModal = ({ challenge, onClose, onComplete }) => {
  const { user } = useAuth();
  const question = challenge?.question;

  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [timeLeft, setTimeLeft] = useState(question?.timeLimitSec || 45);
  const [timerActive, setTimerActive] = useState(true);

  // ---------- initialise answer state ----------
  useEffect(() => {
    if (!question) return;
    if (question.type === 'multiple_choice') {
      setAnswers({ [question.questionNo]: [] });
    } else if (question.type === 'text_input') {
      setAnswers({ [question.questionNo]: '' });
    } else if (question.type === 'match_pairs') {
      setAnswers({ [question.questionNo]: {} });
    }
  }, [question]);

  // ---------- validation (same logic as ExerciseQuizRunner) ----------
  const validateAnswer = useCallback(() => {
    if (!question) return false;
    const userAnswer = answers[question.questionNo];

    if (question.type === 'multiple_choice') {
      const correctOptions = question.correctOptions || [];
      const userOptions = userAnswer || [];
      return (
        correctOptions.length === userOptions.length &&
        correctOptions.every(opt => userOptions.includes(opt))
      );
    } else if (question.type === 'text_input') {
      return (
        (userAnswer || '').toLowerCase().trim() ===
        (question.answer || '').toLowerCase().trim()
      );
    } else if (question.type === 'match_pairs') {
      return (question.pairs || []).every(pair =>
        (userAnswer?.[pair.left] || '').toLowerCase().trim() ===
        pair.right.toLowerCase().trim()
      );
    }
    return false;
  }, [question, answers]);

  // ---------- submit handler ----------
  const handleSubmit = useCallback((timedOut = false) => {
    if (submitted) return;
    // Don't allow submit if time ran out
    if (!timerActive && timeLeft === 0) return;

    setSubmitted(true);
    setTimerActive(false);

    const correct = validateAnswer();
    setIsCorrect(correct);

    // Generate AI summary
    generateAISummary(correct);
    
    // Don't call onComplete here - let user see the result first
    // onComplete will be called when user clicks "Next Challenge"
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, validateAnswer, question, challenge, timerActive, timeLeft]);

  // ---------- timer countdown ----------
  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerActive(false);
          toast.error('Time is up! You cannot submit answers now.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerActive]);

  // ---------- AI summary ----------
  const generateAISummary = async (correct) => {
    setIsGeneratingSummary(true);
    try {
      const userAnswer = answers[question?.questionNo];
      let userAnswerStr = '';
      if (question?.type === 'multiple_choice') {
        const optionMap = new Map((question.options || []).map(o => [o.id, o.text]));
        userAnswerStr = (Array.isArray(userAnswer) ? userAnswer : [])
          .map(id => optionMap.get(id) ?? id).join(', ');
      } else if (question?.type === 'text_input') {
        userAnswerStr = userAnswer || '';
      } else if (question?.type === 'match_pairs') {
        userAnswerStr = JSON.stringify(userAnswer || {});
      }

      const userId = user?.id;
      if (!userId) {
        setAiSummary(correct ? '🎉 You answered correctly!' : '❌ Not quite right. Review and try again.');
        return;
      }

      const response = await exercisesAPI.submitAnswer({
        user_id: userId,
        exercise_id: challenge._id || challenge.id,
        user_answer: userAnswerStr,
        is_challenge: true
      });
      const f = response.data.feedback;
      let s = f.is_correct ? '🎉 Perfect!\n\n' : '❌ Not quite right.\n\n';
      s += `${f.short_summary}\n\n📝 ${f.explanation}`;
      if (f.corrected_answer) s += `\n\n✅ Correct Answer: ${f.corrected_answer}`;
      if (f.error_type) s += `\n⚠️ Error Type: ${f.error_type}`;
      setAiSummary(s);
    } catch {
      setAiSummary(correct
        ? `🎉 Perfect! You earned ${question?.xp || 0} XP.`
        : `❌ Not quite right. Review the material and try again.`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // ---------- answer change handlers ----------
  const handleMultipleChoiceChange = (optionId, isSingle) => {
    if (submitted || (!timerActive && timeLeft === 0)) return;
    setAnswers(prev => ({
      ...prev,
      [question.questionNo]: isSingle
        ? [optionId]
        : prev[question.questionNo]?.includes(optionId)
          ? prev[question.questionNo].filter(id => id !== optionId)
          : [...(prev[question.questionNo] || []), optionId]
    }));
  };

  const handleTextChange = (value) => {
    if (submitted || (!timerActive && timeLeft === 0)) return;
    setAnswers(prev => ({ ...prev, [question.questionNo]: value }));
  };

  const handlePairChange = (left, right) => {
    if (submitted || (!timerActive && timeLeft === 0)) return;
    setAnswers(prev => ({
      ...prev,
      [question.questionNo]: { ...(prev[question.questionNo] || {}), [left]: right }
    }));
  };

  const handleReset = () => {
    if (!question) return;
    if (question.type === 'multiple_choice') setAnswers({ [question.questionNo]: [] });
    else if (question.type === 'text_input') setAnswers({ [question.questionNo]: '' });
    else if (question.type === 'match_pairs') setAnswers({ [question.questionNo]: {} });
    setSubmitted(false);
    setIsCorrect(false);
    setAiSummary('');
    setTimeLeft(question.timeLimitSec || 45);
    setTimerActive(true);
  };

  const canSubmit = () => {
    if (!question) return false;
    const a = answers[question.questionNo];
    if (question.type === 'multiple_choice') return a && a.length > 0;
    if (question.type === 'text_input') return a && a.trim() !== '';
    if (question.type === 'match_pairs') return a && Object.keys(a).length === question.pairs?.length;
    return false;
  };

  // ---------- render question body (mirrors ExerciseQuizRunner) ----------
  const renderQuestion = () => {
    if (!question) return <p className="text-gray-500">No question available.</p>;
    const userAnswer = answers[question.questionNo];

    return (
      <div>
        {/* Prompt */}
        <div className="flex items-start justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 leading-snug">{question.prompt}</h3>
          {submitted && (
            <div className="ml-4 flex-shrink-0">
              {isCorrect
                ? <FaCheckCircle className="text-4xl text-green-500" />
                : <FaTimesCircle className="text-4xl text-red-500" />}
            </div>
          )}
        </div>

        {/* ── Multiple Choice ── */}
        {question.type === 'multiple_choice' && (() => {
          const isSingle = (question.correctOptions?.length || 0) === 1;
          return (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-1">
                {isSingle ? 'Select one answer' : 'Select all correct answers'}
              </p>
              {question.options?.map(option => {
                const sel = userAnswer?.includes(option.id);
                const correct = question.correctOptions?.includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`
                      flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all select-none
                      ${submitted
                        ? correct
                          ? 'border-green-500 bg-green-50'
                          : sel ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'
                        : sel ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}
                    `}
                  >
                    <input
                      type={isSingle ? 'radio' : 'checkbox'}
                      checked={sel || false}
                      onChange={() => !submitted && handleMultipleChoiceChange(option.id, isSingle)}
                      disabled={submitted || (!timerActive && timeLeft === 0)}
                      className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0"
                    />
                    <span className="text-gray-800 flex-1">{option.text}</span>
                    {submitted && correct && (
                      <span className="ml-auto text-green-600 font-semibold text-sm">✓ Correct</span>
                    )}
                  </label>
                );
              })}
            </div>
          );
        })()}

        {/* ── Text Input ── */}
        {question.type === 'text_input' && (
          <div>
            <p className="text-gray-500 mb-3 text-sm">Fill in the blank...</p>
            <input
              type="text"
              value={userAnswer || ''}
              onChange={e => handleTextChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && canSubmit() && !submitted && handleSubmit()}
              disabled={submitted || (!timerActive && timeLeft === 0)}
              placeholder="Type your answer here..."
              className={`
                w-full border-2 rounded-xl px-4 py-3 text-lg outline-none transition-all
                ${submitted
                  ? isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500'}
              `}
            />
            {submitted && !isCorrect && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">Expected:</span> {question.answer}
              </p>
            )}
          </div>
        )}

        {/* ── Match Pairs ── */}
        {question.type === 'match_pairs' && (
          <div className="space-y-3">
            <p className="text-gray-500 mb-3 text-sm">Match the pairs:</p>
            {question.pairs?.map((pair, idx) => {
              const selected = userAnswer?.[pair.left] || '';
              const correct = selected.toLowerCase().trim() === pair.right.toLowerCase().trim();
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex-1 bg-blue-50 border-2 border-blue-200 rounded-xl px-4 py-3 font-semibold text-blue-800">
                    {pair.left}
                  </div>
                  <span className="text-gray-400 text-xl font-bold">=</span>
                  <select
                    value={selected}
                    onChange={e => handlePairChange(pair.left, e.target.value)}
                    disabled={submitted || (!timerActive && timeLeft === 0)}
                    className={`
                      flex-1 border-2 rounded-xl px-4 py-3 outline-none transition-all
                      ${submitted
                        ? correct ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500'}
                    `}
                  >
                    <option value="">Select...</option>
                    {question.pairs?.map((p, i) => (
                      <option key={i} value={p.right}>{p.right}</option>
                    ))}
                  </select>
                  {submitted && !correct && (
                    <span className="text-xs text-gray-500 shrink-0">(→ {pair.right})</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Metadata */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-2 text-sm">
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-semibold">
            ⭐ {question.xp} XP
          </span>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            🏅 {question.points} pts
          </span>
          {question.timeLimitSec && (
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
              ⏱ {question.timeLimitSec}s
            </span>
          )}
        </div>
      </div>
    );
  };

  // ---------- render ----------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Challenge #{challenge.challengeNumber}</h2>
              {challenge.categoryId && (
                <p className="text-blue-100 text-sm mt-0.5">{challenge.categoryId}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="flex items-center gap-1.5 bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-sm font-bold">
                <FaStar className="text-yellow-300" /> {question?.xp ?? 0} XP
              </div>
              <div className="flex items-center gap-1.5 bg-white bg-opacity-20 px-3 py-1.5 rounded-full text-sm font-bold">
                <FaGem className="text-blue-200" /> {question?.points ?? 0} pts
              </div>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm
              ${timeLeft <= 10 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-400 text-white'}`}>
              <FaClock />
              <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Timer progress bar */}
          <div className="mt-3 bg-white bg-opacity-20 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-1000 ${timeLeft <= 10 ? 'bg-red-400' : 'bg-blue-300'}`}
              style={{ width: `${(timeLeft / (question?.timeLimitSec || 45)) * 100}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex-1">
          {renderQuestion()}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-3">
            {!submitted && !(!timerActive && timeLeft === 0) ? (
              <button
                onClick={() => handleSubmit(false)}
                disabled={!canSubmit()}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600
                  text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                Submit Answer
              </button>
            ) : (
              <>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  <FaRedo /> Try Again
                </button>
                {submitted && (
                  <button
                    onClick={() => {
                      // Call onComplete if answer was correct to update parent state
                      if (isCorrect) {
                        const earnedXP = question?.xp || 0;
                        const earnedCoins = question?.points || 0;
                        onComplete(challenge._id || challenge.id, earnedXP, earnedCoins);
                      } else {
                        // If incorrect, just close the modal
                        onClose();
                      }
                    }}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition-all"
                  >
                    {isCorrect ? 'Continue' : 'Try Again'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Result Banner */}
        {submitted && (
          <div className={`mx-6 mb-4 p-5 rounded-xl border-2 text-center
            ${isCorrect ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
            {isCorrect ? (
              <>
                <FaCheckCircle className="text-green-500 text-4xl mx-auto mb-2" />
                <p className="text-xl font-bold text-green-700">Excellent! 🎉</p>
                <p className="text-green-600 text-sm mt-1">
                  You earned <strong>{question?.xp} XP</strong> and <strong>{question?.points} points</strong>!
                </p>
                <div className="flex justify-center gap-3 text-2xl mt-2">
                  <FaStar className="text-yellow-500" />
                  <FaStar className="text-yellow-500" />
                  <FaStar className="text-yellow-500" />
                </div>
              </>
            ) : (
              <>
                <FaTimesCircle className="text-red-500 text-4xl mx-auto mb-2" />
                <p className="text-xl font-bold text-red-700">
                  {timeLeft === 0 ? "Time's up! ⏰" : 'Not quite right 😔'}
                </p>
                <p className="text-red-600 text-sm mt-1">Keep practicing — you&apos;ll get it next time!</p>
              </>
            )}
          </div>
        )}

        {/* AI Summary */}
        {submitted && (
          <div className="mx-6 mb-6 p-5 bg-white border-2 border-dashed border-blue-300 rounded-xl">
            <h4 className="text-base font-bold text-gray-800 mb-3">🤖 AI Feedback</h4>
            {isGeneratingSummary ? (
              <div className="flex items-center gap-2 text-gray-500">
                <FaSpinner className="animate-spin text-blue-500" />
                <span>Generating feedback...</span>
              </div>
            ) : (
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">{aiSummary}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeModal;