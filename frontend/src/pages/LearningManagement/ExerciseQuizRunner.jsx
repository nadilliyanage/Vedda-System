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
        className={`bg-white rounded-xl shadow-md p-6 mb-4 ${
          submitted
            ? result?.isCorrect
              ? 'border-2 border-green-500'
              : 'border-2 border-red-500'
            : ''
        }`}
      >
        {/* Question Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">
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
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    submitted
                      ? question.correctOptions?.includes(option.id)
                        ? 'border-green-500 bg-green-50'
                        : userAnswer?.includes(option.id)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                      : userAnswer?.includes(option.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
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
                    className="w-5 h-5 text-blue-600 mr-3"
                  />
                  <span className="text-gray-800">{option.text}</span>
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
            <p className="text-gray-600 mb-3">Fill in the blank...</p>
            <input
              type="text"
              value={userAnswer || ''}
              onChange={(e) => !submitted && handleTextInputChange(question.questionNo, e.target.value)}
              disabled={submitted}
              placeholder="Your answer"
              className={`w-full border-2 rounded-lg px-4 py-3 text-lg ${
                submitted
                  ? result?.isCorrect
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                  : 'border-gray-300 focus:border-blue-500 focus:outline-none'
              }`}
            />
            {submitted && !result?.isCorrect && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">Expected answer:</span> {question.answer}
              </p>
            )}
          </div>
        )}

        {question.type === 'match_pairs' && (
          <div className="space-y-3">
            <p className="text-gray-600 mb-3">Match the pairs:</p>
            {question.pairs?.map((pair, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-semibold">
                  {pair.left}
                </div>
                <span className="text-gray-400 text-xl">=</span>
                <select
                  value={userAnswer?.[pair.left] || ''}
                  onChange={(e) =>
                    !submitted && handleMatchPairChange(question.questionNo, pair.left, e.target.value)
                  }
                  disabled={submitted}
                  className={`flex-1 border-2 rounded-lg px-4 py-3 ${
                    submitted
                      ? userAnswer?.[pair.left]?.toLowerCase().trim() === pair.right.toLowerCase().trim()
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500 focus:outline-none'
                  }`}
                >
                  <option value="">Select</option>
                  {question.pairs?.map((p, i) => (
                    <option key={i} value={p.right}>
                      {p.right}
                    </option>
                  ))}
                </select>
                {submitted && userAnswer?.[pair.left]?.toLowerCase().trim() !== pair.right.toLowerCase().trim() && (
                  <span className="text-sm text-gray-600">
                    (Expected: {pair.right})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Question Metadata */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-4 text-sm text-gray-600">
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
            {question.xp} XP
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
            {question.points} Points
          </span>
          {question.timeLimitSec && (
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
              ⏱ {question.timeLimitSec}s
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 pt-16">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{lesson.topic}</h1>
        </div>

        {/* Questions */}
        <div className="mb-6">
          {exercise.question ? renderQuestion(exercise.question, 0) : (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500 text-lg">No question available</p>
            </div>
          )}
        </div>

        {/* AI Summary (After Submission) */}
        {submitted && (
          <div className="bg-white border-2 border-dashed border-blue-400 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🤖</span> AI Summary
            </h3>
            {isGeneratingSummary ? (
              <div className="flex items-center gap-3 text-gray-600">
                <FaSpinner className="animate-spin text-blue-600" />
                <span>Generating feedback...</span>
              </div>
            ) : (
              <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                {aiSummary}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
          >
            <FaTimes /> Close
          </button>
          {!submitted ? (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Submit
            </button>
          ) : (
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              <FaRedo /> Try Again
            </button>
          )}
        </div>

        {/* Progress Info */}
        {!submitted && (
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <p className="text-blue-700 text-center">
              <strong>{exercise.question?.xp || 0} XP</strong> available for correct answer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseQuizRunner;
