import { useState, useEffect } from 'react';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

const ExerciseQuizRunner = ({ exercise, lesson, category, onClose }) => {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => {
    // Initialize answers object
    const initialAnswers = {};
    exercise.questions?.forEach(question => {
      if (question.type === 'multiple_choice') {
        initialAnswers[question.questionNo] = [];
      } else if (question.type === 'text_input') {
        initialAnswers[question.questionNo] = '';
      } else if (question.type === 'match_pairs') {
        initialAnswers[question.questionNo] = {};
      }
    });
    setAnswers(initialAnswers);
  }, [exercise]);

  const handleMultipleChoiceChange = (questionNo, optionId, isChecked) => {
    setAnswers(prev => ({
      ...prev,
      [questionNo]: isChecked
        ? [...(prev[questionNo] || []), optionId]
        : (prev[questionNo] || []).filter(id => id !== optionId)
    }));
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
    const questionResults = {};
    let totalScore = 0;
    let earnedScore = 0;

    exercise.questions?.forEach(question => {
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

      questionResults[question.questionNo] = {
        isCorrect,
        userAnswer,
        question
      };

      totalScore += question.xp || 0;
      if (isCorrect) {
        earnedScore += question.xp || 0;
      }
    });

    return { questionResults, totalScore, earnedScore };
  };

  const generateAISummary = (results) => {
    setIsGeneratingSummary(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const { questionResults, earnedScore, totalScore } = results;
      const correctCount = Object.values(questionResults).filter(r => r.isCorrect).length;
      const totalCount = Object.keys(questionResults).length;
      const percentage = Math.round((correctCount / totalCount) * 100);

      let summary = `You answered ${correctCount} out of ${totalCount} questions correctly (${percentage}%).\n\n`;
      
      if (percentage === 100) {
        summary += '🎉 Perfect score! You have mastered this exercise.';
      } else if (percentage >= 70) {
        summary += '👏 Great job! You have a good understanding of this material.';
      } else if (percentage >= 50) {
        summary += '📚 Good effort! Review the lesson content to improve your understanding.';
      } else {
        summary += '💪 Keep practicing! Consider reviewing the lesson before trying again.';
      }

      summary += `\n\nYou earned ${earnedScore} out of ${totalScore} XP.`;

      setAiSummary(summary);
      setIsGeneratingSummary(false);
    }, 1500);
  };

  const handleSubmit = () => {
    // Validate all questions are answered
    const allAnswered = exercise.questions?.every(question => {
      const answer = answers[question.questionNo];
      if (question.type === 'multiple_choice') {
        return answer && answer.length > 0;
      } else if (question.type === 'text_input') {
        return answer && answer.trim() !== '';
      } else if (question.type === 'match_pairs') {
        return answer && Object.keys(answer).length === question.pairs?.length;
      }
      return false;
    });

    if (!allAnswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    const validationResults = validateAnswers();
    setResults(validationResults);
    setSubmitted(true);
    generateAISummary(validationResults);

    toast.success('Exercise submitted!');
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
            Q{index + 1}. {question.prompt}
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
        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
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
                  type="checkbox"
                  checked={userAnswer?.includes(option.id) || false}
                  onChange={(e) =>
                    !submitted &&
                    handleMultipleChoiceChange(question.questionNo, option.id, e.target.checked)
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
        )}

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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-800">{lesson.topic}</h1>
            <span className="text-xl text-gray-600">({category.name})</span>
          </div>
          <h2 className="text-2xl font-semibold text-blue-600">
            Exercise {exercise.exerciseNumber}
          </h2>
        </div>

        {/* Questions */}
        <div className="mb-6">
          {exercise.questions?.map((question, index) => renderQuestion(question, index))}
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
          {!submitted && (
            <button
              onClick={handleSubmit}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              Submit
            </button>
          )}
        </div>

        {/* Progress Info */}
        {!submitted && (
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border-2 border-blue-200">
            <p className="text-blue-700 text-center">
              <strong>{exercise.questions?.length || 0}</strong> questions • 
              Total <strong>{exercise.questions?.reduce((sum, q) => sum + (q.xp || 0), 0)} XP</strong> available
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseQuizRunner;
