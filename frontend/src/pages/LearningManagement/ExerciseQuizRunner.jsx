import { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaSpinner, FaRedo } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { exercisesAPI } from '../../services/learningAPI';
import { useAuth } from '../../contexts/AuthContext';

const ExerciseQuizRunner = ({ exercise, lesson, category, onClose }) => {
  const { user } = useAuth();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    // Initialize answer based on question type
    if (exercise.question?.type === 'multiple_choice') {
      setAnswers({ [exercise.question.questionNo]: [] });
    } else if (exercise.question?.type === 'text_input') {
      setAnswers({ [exercise.question.questionNo]: '' });
    } else if (exercise.question?.type === 'match_pairs') {
      setAnswers({ [exercise.question.questionNo]: {} });
    }
  }, [exercise]);

  const handleMultipleChoiceChange = (questionNo, optionId, isChecked, isSingleAnswer = false) => {
    setAnswers(prev => {
      if (isSingleAnswer) {
        // For single answer questions (radio buttons), replace the entire selection
        return {
          ...prev,
          [questionNo]: [optionId]
        };
      } else {
        // For multiple answer questions (checkboxes), add/remove from array
        return {
          ...prev,
          [questionNo]: isChecked
            ? [...(prev[questionNo] || []), optionId]
            : (prev[questionNo] || []).filter(id => id !== optionId)
        };
      }
    });
  };

  const handleTextInputChange = (questionNo, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionNo]: value
    }));
  };

  const handleMatchPairChange = (questionNo, left, right) => {
    setAnswers(prev => ({
      ...prev,
      [questionNo]: {
        ...(prev[questionNo] || {}),
        [left]: right
      }
    }));
  };

  const validateAnswers = () => {
    const question = exercise.question;
    if (!question) return { questionResults: {}, totalScore: 0, earnedScore: 0 };

    const userAnswer = answers[question.questionNo];
    let isCorrect = false;

    if (question.type === 'multiple_choice') {
      const correctOptions = question.correctOptions || [];
      const userOptions = userAnswer || [];
      isCorrect = 
        correctOptions.length === userOptions.length &&
        correctOptions.every(opt => userOptions.includes(opt));
    } else if (question.type === 'text_input') {
      const expectedAnswer = (question.answer || '').toLowerCase().trim();
      const userText = (userAnswer || '').toLowerCase().trim();
      isCorrect = userText === expectedAnswer;
    } else if (question.type === 'match_pairs') {
      const correctPairs = question.pairs || [];
      const userPairs = userAnswer || {};
      isCorrect = correctPairs.every(pair => 
        userPairs[pair.left]?.toLowerCase().trim() === pair.right.toLowerCase().trim()
      );
    }

    const questionResults = {
      [question.questionNo]: {
        isCorrect,
        userAnswer,
        question
      }
    };

    const totalScore = question.xp || 0;
    const earnedScore = isCorrect ? (question.xp || 0) : 0;

    return { questionResults, totalScore, earnedScore };
  };

  const generateAISummary = async (results) => {
    setIsGeneratingSummary(true);
    
    try {
      const { questionResults } = results;
      const question = exercise.question;
      const userAnswer = questionResults[question.questionNo]?.userAnswer;
      
      // Get user answer as string
      let userAnswerStr = '';
      if (question.type === 'multiple_choice') {
        const optionTextById = new Map((question.options || []).map(option => [option.id, option.text]));
        userAnswerStr = Array.isArray(userAnswer)
          ? userAnswer.map(optionId => optionTextById.get(optionId) ?? optionId).join(', ')
          : '';
      } else if (question.type === 'text_input') {
        userAnswerStr = userAnswer || '';
      } else if (question.type === 'match_pairs') {
        userAnswerStr = JSON.stringify(userAnswer || {});
      }

      // Get user ID from localStorage or use default
      const userId = user?.id;
      if (!userId) {
        toast.error('User not authenticated. Please log in again.');
        return;
      }


      // Call the AI API
      const response = await exercisesAPI.submitAnswer({
        user_id: userId,
        exercise_id: exercise._id || exercise.id,
        user_answer: userAnswerStr
      });

      // Format the AI feedback response
      const feedback = response.data.feedback;
      let summary = '';
      
      if (feedback.is_correct) {
        summary = '🎉 Perfect! You answered correctly.\n\n';
      } else {
        summary = '❌ Not quite right.\n\n';
      }

      summary += `${feedback.short_summary}\n\n`;
      summary += `📝 Explanation: ${feedback.explanation}\n\n`;
      
      if (feedback.corrected_answer) {
        summary += `✅ Correct Answer: ${feedback.corrected_answer}\n\n`;
      }

      if (feedback.error_type) {
        summary += `⚠️ Error Type: ${feedback.error_type}`;
      }

      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating AI summary:', error);
      
      // Fallback to basic summary if API fails
      const { questionResults, earnedScore, totalScore } = results;
      const isCorrect = Object.values(questionResults)[0]?.isCorrect || false;

      let summary = '';
      
      if (isCorrect) {
        summary = '🎉 Perfect! You answered correctly.\n\n';
      } else {
        summary = '❌ Not quite right. Review the material and try again.\n\n';
      }

      summary += `You earned ${earnedScore} out of ${totalScore} XP.`;
      setAiSummary(summary);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSubmit = () => {
    // Validate question is answered
    const question = exercise.question;
    if (!question) {
      toast.error('No question found');
      return;
    }

    const answer = answers[question.questionNo];
    let isAnswered = false;

    if (question.type === 'multiple_choice') {
      isAnswered = answer && answer.length > 0;
    } else if (question.type === 'text_input') {
      isAnswered = answer && answer.trim() !== '';
    } else if (question.type === 'match_pairs') {
      isAnswered = answer && Object.keys(answer).length === question.pairs?.length;
    }

    if (!isAnswered) {
      toast.error('Please answer the question before submitting');
      return;
    }

    const validationResults = validateAnswers();
    setResults(validationResults);
    setSubmitted(true);
    generateAISummary(validationResults);

    toast.success('Exercise submitted!');
  };

  const handleRefresh = () => {
    // Reset all state to initial values
    const question = exercise.question;
    if (question?.type === 'multiple_choice') {
      setAnswers({ [question.questionNo]: [] });
    } else if (question?.type === 'text_input') {
      setAnswers({ [question.questionNo]: '' });
    } else if (question?.type === 'match_pairs') {
      setAnswers({ [question.questionNo]: {} });
    }
    
    setSubmitted(false);
    setResults(null);
    setAiSummary('');
    setIsGeneratingSummary(false);
    
    toast.success('Exercise reset! Try again.');
  };

  const renderQuestion = (question, index) => {
    const userAnswer = answers[question.questionNo];
    const result = results?.questionResults[question.questionNo];

    return (
      <div
        key={question.questionNo}
        className="rounded-xl p-6 mb-4"
        style={{
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: submitted
            ? result?.isCorrect
              ? '2px solid #22c55e'
              : '2px solid #ef4444'
            : '1px solid rgba(200,170,100,0.30)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
        }}
      >
        {/* Question Header */}
        <div className="flex items-start justify-between mb-4">
          <h3
            className="text-lg font-bold"
            style={{ color: '#1c1409', fontFamily: "'Georgia', serif" }}
          >
            {question.prompt}
          </h3>
          {submitted && (
            <div className="ml-4">
              {result?.isCorrect ? (
                <FaCheckCircle className="text-3xl text-green-500" />
              ) : (
                <FaTimesCircle className="text-3xl text-red-500" />
              )}
            </div>
          )}
        </div>

        {/* Question Type Specific Rendering */}
        {question.type === 'multiple_choice' && (() => {
          const isSingleAnswer = (question.correctOptions?.length || 0) === 1;
          const inputType = isSingleAnswer ? 'radio' : 'checkbox';
          const inputName = `question_${question.questionNo}`;
          
          return (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-2">
                {isSingleAnswer ? '(Select one answer)' : '(Select all correct answers)'}
              </p>
              {question.options?.map(option => (
                <label
                  key={option.id}
                  className="flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all"
                  style={{
                    borderColor: submitted
                      ? question.correctOptions?.includes(option.id)
                        ? '#22c55e'
                        : userAnswer?.includes(option.id)
                        ? '#ef4444'
                        : 'rgba(200,170,100,0.25)'
                      : userAnswer?.includes(option.id)
                      ? '#9a6f2a'
                      : 'rgba(200,170,100,0.25)',
                    background: submitted
                      ? question.correctOptions?.includes(option.id)
                        ? 'rgba(34,197,94,0.08)'
                        : userAnswer?.includes(option.id)
                        ? 'rgba(239,68,68,0.08)'
                        : 'transparent'
                      : userAnswer?.includes(option.id)
                      ? 'rgba(200,170,100,0.12)'
                      : 'transparent',
                  }}
                >
                  <input
                    type={inputType}
                    name={isSingleAnswer ? inputName : undefined}
                    checked={userAnswer?.includes(option.id) || false}
                    onChange={(e) =>
                      !submitted &&
                      handleMultipleChoiceChange(question.questionNo, option.id, e.target.checked, isSingleAnswer)
                    }
                    disabled={submitted}
                    className="w-5 h-5 mr-3"
                    style={{ accentColor: '#9a6f2a' }}
                  />
                  <span style={{ color: '#3d2e0f' }}>{option.text}</span>
                  {submitted && question.correctOptions?.includes(option.id) && (
                    <span className="ml-auto text-green-600 font-semibold text-sm">
                      ✓ Correct
                    </span>
                  )}
                </label>
              ))}
            </div>
          );
        })()}

        {question.type === 'text_input' && (
          <div>
            <p className="mb-3" style={{ color: '#5c4a1e', fontStyle: 'italic' }}>Fill in the blank...</p>
            <input
              type="text"
              value={userAnswer || ''}
              onChange={(e) => !submitted && handleTextInputChange(question.questionNo, e.target.value)}
              disabled={submitted}
              placeholder="Your answer"
              className="w-full rounded-lg px-4 py-3 text-lg focus:outline-none"
              style={{
                border: submitted
                  ? result?.isCorrect
                    ? '2px solid #22c55e'
                    : '2px solid #ef4444'
                  : '2px solid rgba(200,170,100,0.40)',
                background: submitted
                  ? result?.isCorrect
                    ? 'rgba(34,197,94,0.08)'
                    : 'rgba(239,68,68,0.08)'
                  : 'rgba(255,255,255,0.80)',
                color: '#1c1409',
              }}
            />
            {submitted && !result?.isCorrect && (
              <p className="mt-2 text-sm" style={{ color: '#5c4a1e' }}>
                <span className="font-semibold">Expected answer:</span> {question.answer}
              </p>
            )}
          </div>
        )}

        {question.type === 'match_pairs' && (
          <div className="space-y-3">
            <p className="mb-3" style={{ color: '#5c4a1e', fontStyle: 'italic' }}>Match the pairs:</p>
            {question.pairs?.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div
                  className="flex-1 rounded-lg px-4 py-3 font-semibold"
                  style={{ background: 'rgba(200,170,100,0.15)', color: '#3d2e0f' }}
                >
                  {pair.left}
                </div>
                <span style={{ color: '#9a6f2a', fontSize: '1.25rem' }}>=</span>
                <select
                  value={userAnswer?.[pair.left] || ''}
                  onChange={(e) =>
                    !submitted && handleMatchPairChange(question.questionNo, pair.left, e.target.value)
                  }
                  disabled={submitted}
                  className="flex-1 rounded-lg px-4 py-3 focus:outline-none"
                  style={{
                    border: submitted
                      ? userAnswer?.[pair.left]?.toLowerCase().trim() === pair.right.toLowerCase().trim()
                        ? '2px solid #22c55e'
                        : '2px solid #ef4444'
                      : '2px solid rgba(200,170,100,0.40)',
                    background: submitted
                      ? userAnswer?.[pair.left]?.toLowerCase().trim() === pair.right.toLowerCase().trim()
                        ? 'rgba(34,197,94,0.08)'
                        : 'rgba(239,68,68,0.08)'
                      : 'rgba(255,255,255,0.80)',
                    color: '#1c1409',
                  }}
                >
                  <option value="">Select</option>
                  {question.pairs?.map((p, i) => (
                    <option key={i} value={p.right}>
                      {p.right}
                    </option>
                  ))}
                </select>
                {submitted && userAnswer?.[pair.left]?.toLowerCase().trim() !== pair.right.toLowerCase().trim() && (
                  <span className="text-sm" style={{ color: '#5c4a1e' }}>
                    (Expected: {pair.right})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Question Metadata */}
        <div
          className="mt-4 pt-4 flex items-center gap-4 text-sm"
          style={{ borderTop: '1px solid rgba(200,170,100,0.30)' }}
        >
          <span
            className="px-3 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(200,170,100,0.18)', color: '#9a6f2a', border: '1px solid rgba(200,165,90,0.35)' }}
          >
            {question.xp} XP
          </span>
          <span
            className="px-3 py-1 rounded-full"
            style={{ background: 'rgba(200,170,100,0.10)', color: '#5c4a1e', border: '1px solid rgba(200,170,100,0.25)' }}
          >
            {question.points} Points
          </span>
        </div>
      </div>
    );
  };

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
              onClick={onClose}
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
              <FaTimes style={{ fontSize: '0.8rem' }} />
              Close
            </button>
            <div
              style={{
                color: '#d4b483',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: '600',
                fontSize: '0.9rem',
              }}
            >
              {category?.name || 'Exercise'}
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
          ✏️ Exercise
        </span>
        <h1
          style={{
            fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
            fontWeight: '800',
            color: '#1c1409',
            lineHeight: 1.2,
            margin: '0 auto 0.4rem',
            maxWidth: '800px',
            fontFamily: "'Georgia', serif",
            letterSpacing: '-0.3px',
            textShadow: '0 1px 0 rgba(255,255,255,0.8)',
            padding: '0 1rem',
          }}
        >
          {lesson.topic}
        </h1>
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

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Questions */}
        <div className="mb-6">
          {exercise.question ? renderQuestion(exercise.question, 0) : (
            <div
              className="text-center py-12 rounded-xl"
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(200,170,100,0.25)',
              }}
            >
              <p className="text-lg" style={{ color: '#5c4a1e' }}>No question available</p>
            </div>
          )}
        </div>

        {/* AI Summary (After Submission) */}
        {submitted && (
          <div
            className="rounded-xl p-6 mb-6"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '2px dashed rgba(200,165,90,0.55)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <h3
              className="text-xl font-bold mb-4 flex items-center gap-2"
              style={{ color: '#1c1409', fontFamily: "'Georgia', serif" }}
            >
              <span></span> AI Summary
            </h3>
            {isGeneratingSummary ? (
              <div className="flex items-center gap-3" style={{ color: '#5c4a1e' }}>
                <FaSpinner className="animate-spin" style={{ color: '#9a6f2a' }} />
                <span>Generating feedback...</span>
              </div>
            ) : (
              <div
                className="leading-relaxed whitespace-pre-line"
                style={{ color: '#3d2e0f' }}
              >
                {aiSummary}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 text-white rounded-lg font-bold transition-all transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #7a4f10, #b8751e)',
                border: '2px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.25)',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-lg font-bold transition-all transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #7a4f10, #b8751e)',
                border: '2px solid rgba(255,255,255,0.75)',
                boxShadow: '0 4px 18px rgba(0,0,0,0.55), 0 0 0 1px rgba(0,0,0,0.25)',
                textShadow: '0 1px 3px rgba(0,0,0,0.6)',
              }}
            >
              <FaRedo /> Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseQuizRunner;
