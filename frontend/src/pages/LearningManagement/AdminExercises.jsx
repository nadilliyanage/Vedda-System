import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaEye, FaEdit, FaTrash, FaPlus, FaSave } from 'react-icons/fa';
import { exercisesAPI, lessonsAPI, categoriesAPI } from '../../services/learningAPI';

const AdminExercises = () => {
  const [exercises, setExercises] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('list'); // 'list', 'add', 'edit', 'view'
  const [currentExercise, setCurrentExercise] = useState(null);
  
  // Top-level form data
  const [formData, setFormData] = useState({
    id: '',
    lessonId: '',
    categoryId: '',
    exerciseNumber: '',
    questions: []
  });

  // Question builder state
  const [currentQuestion, setCurrentQuestion] = useState({
    questionNo: '',
    type: 'multiple_choice',
    prompt: '',
    xp: 1,
    points: 1,
    timeLimitSec: 30,
    rest: '',
    options: [
      { id: 'A', text: '', correct: false },
      { id: 'B', text: '', correct: false }
    ],
    answer: '',
    pairs: [
      { left: '', right: '' }
    ]
  });

  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);

  useEffect(() => {
    if (activeView === 'list') {
      fetchExercises();
      fetchLessons();
      fetchCategories();
    }
  }, [activeView]);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const response = await exercisesAPI.getAll();
      setExercises(response.data);
    } catch (error) {
      toast.error('Failed to fetch exercises');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await lessonsAPI.getAll();
      setLessons(response.data);
    } catch (error) {
      console.error('Failed to fetch lessons:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const openAddForm = () => {
    setFormData({
      id: '',
      lessonId: '',
      categoryId: '',
      exerciseNumber: '',
      questions: []
    });
    resetQuestionBuilder();
    setCurrentExercise(null);
    setActiveView('add');
  };

  const openEditForm = (exercise) => {
    setFormData({
      id: exercise.id,
      lessonId: exercise.lessonId || '',
      categoryId: exercise.categoryId || '',
      exerciseNumber: exercise.exerciseNumber || '',
      questions: exercise.questions || []
    });
    resetQuestionBuilder();
    setCurrentExercise(exercise);
    setActiveView('edit');
  };

  const openViewForm = (exercise) => {
    setCurrentExercise(exercise);
    setActiveView('view');
  };

  const resetQuestionBuilder = () => {
    setCurrentQuestion({
      questionNo: '',
      type: 'multiple_choice',
      prompt: '',
      xp: 1,
      points: 1,
      timeLimitSec: 30,
      rest: '',
      options: [
        { id: 'A', text: '', correct: false },
        { id: 'B', text: '', correct: false }
      ],
      answer: '',
      pairs: [
        { left: '', right: '' }
      ]
    });
    setEditingQuestionIndex(null);
  };

  const handleSaveQuestion = () => {
    // Validate question
    if (!currentQuestion.questionNo || !currentQuestion.prompt) {
      toast.error('Question number and prompt are required');
      return;
    }

    // Prepare question data based on type
    const questionData = {
      questionNo: currentQuestion.questionNo,
      type: currentQuestion.type,
      prompt: currentQuestion.prompt,
      xp: parseInt(currentQuestion.xp),
      points: parseInt(currentQuestion.points),
      timeLimitSec: parseInt(currentQuestion.timeLimitSec),
      rest: currentQuestion.rest
    };

    if (currentQuestion.type === 'multiple_choice') {
      questionData.options = currentQuestion.options.filter(o => o.text.trim());
      questionData.correctOptions = currentQuestion.options
        .filter(o => o.correct && o.text.trim())
        .map(o => o.id);
    } else if (currentQuestion.type === 'text_input') {
      questionData.answer = currentQuestion.answer;
    } else if (currentQuestion.type === 'match_pairs') {
      questionData.pairs = currentQuestion.pairs.filter(p => p.left.trim() && p.right.trim());
    }

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...formData.questions];
      updatedQuestions[editingQuestionIndex] = questionData;
      setFormData({ ...formData, questions: updatedQuestions });
      toast.success('Question updated');
    } else {
      // Add new question
      setFormData({ ...formData, questions: [...formData.questions, questionData] });
      toast.success('Question added');
    }

    resetQuestionBuilder();
  };

  const handleEditQuestion = (index) => {
    const question = formData.questions[index];
    setCurrentQuestion({
      questionNo: question.questionNo,
      type: question.type,
      prompt: question.prompt,
      xp: question.xp,
      points: question.points,
      timeLimitSec: question.timeLimitSec,
      rest: question.rest || '',
      options: question.options || [
        { id: 'A', text: '', correct: false },
        { id: 'B', text: '', correct: false }
      ],
      answer: question.answer || '',
      pairs: question.pairs || [{ left: '', right: '' }]
    });
    setEditingQuestionIndex(index);
  };

  const handleDeleteQuestion = (index) => {
    if (!window.confirm('Remove this question?')) return;
    const updatedQuestions = formData.questions.filter((_, i) => i !== index);
    setFormData({ ...formData, questions: updatedQuestions });
    toast.success('Question removed');
  };

  const handleSubmit = async () => {
    if (!formData.lessonId || !formData.exerciseNumber) {
      toast.error('Please select lesson and exercise number');
      return;
    }

    if (formData.questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    try {
      const submitData = {
        ...formData,
        id: formData.id || `${formData.lessonId}_ex${formData.exerciseNumber}`
      };

      if (activeView === 'add') {
        await exercisesAPI.create(submitData);
        toast.success('Exercise created successfully');
      } else if (activeView === 'edit') {
        await exercisesAPI.update(formData.id, submitData);
        toast.success('Exercise updated successfully');
      }

      setActiveView('list');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save exercise');
      console.error(error);
    }
  };

  const handleDelete = async (exerciseId) => {
    if (!window.confirm('Are you sure you want to delete this exercise?')) return;

    try {
      await exercisesAPI.delete(exerciseId);
      toast.success('Exercise deleted successfully');
      fetchExercises();
    } catch (error) {
      toast.error('Failed to delete exercise');
      console.error(error);
    }
  };

  const getLessonName = (lessonId) => {
    const lesson = lessons.find(l => l.id === lessonId);
    return lesson ? lesson.topic : 'N/A';
  };

  const addOption = () => {
    const nextId = String.fromCharCode(65 + currentQuestion.options.length); // A, B, C, D...
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, { id: nextId, text: '', correct: false }]
    });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index][field] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length <= 2) {
      toast.error('At least 2 options required');
      return;
    }
    setCurrentQuestion({
      ...currentQuestion,
      options: currentQuestion.options.filter((_, i) => i !== index)
    });
  };

  const addPair = () => {
    setCurrentQuestion({
      ...currentQuestion,
      pairs: [...currentQuestion.pairs, { left: '', right: '' }]
    });
  };

  const updatePair = (index, field, value) => {
    const newPairs = [...currentQuestion.pairs];
    newPairs[index][field] = value;
    setCurrentQuestion({ ...currentQuestion, pairs: newPairs });
  };

  const removePair = (index) => {
    if (currentQuestion.pairs.length <= 1) {
      toast.error('At least 1 pair required');
      return;
    }
    setCurrentQuestion({
      ...currentQuestion,
      pairs: currentQuestion.pairs.filter((_, i) => i !== index)
    });
  };

  const renderQuestionPreview = (question, index) => {
    return (
      <div key={index} className="border-2 border-gray-200 rounded-lg p-4 mb-3 bg-white">
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="font-semibold text-gray-700">Q{question.questionNo}:</span>
            <span className="ml-2 text-gray-900">{question.prompt}</span>
            <span className="ml-2 text-xs text-gray-500">({question.type.replace('_', ' ')})</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditQuestion(index)}
              className="text-blue-600 hover:text-blue-800"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDeleteQuestion(index)}
              className="text-red-600 hover:text-red-800"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        </div>

        <div className="mt-3 ml-4 text-sm">
          {question.type === 'multiple_choice' && question.options && (
            <div className="space-y-2">
              {question.options.map((option) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={question.correctOptions?.includes(option.id)}
                    disabled
                    className="w-4 h-4"
                  />
                  <span className="font-medium">{option.id}.</span>
                  <span>{option.text}</span>
                </div>
              ))}
            </div>
          )}

          {question.type === 'text_input' && (
            <div className="border rounded px-3 py-2 bg-gray-50 text-gray-600">
              Your answer: <span className="italic">(Text input)</span>
            </div>
          )}

          {question.type === 'match_pairs' && question.pairs && (
            <div className="space-y-2">
              {question.pairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="bg-blue-100 px-3 py-1 rounded">{pair.left}</span>
                  <span>=</span>
                  <span className="bg-green-100 px-3 py-1 rounded">{pair.right}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-gray-500">
          {question.xp} XP • {question.points} Points • {question.timeLimitSec}s
        </div>
      </div>
    );
  };

  // List View
  if (activeView === 'list') {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800"></h1>
            <p className="text-gray-600 mt-2">Create practice exercises with questions</p>
          </div>
          <button
            onClick={openAddForm}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Add New
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading exercises...</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No exercises found</p>
              <p className="text-gray-400 mt-2">Create your first exercise to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rewards</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exercises.map((exercise) => (
                    <tr key={exercise.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{exercise.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                          {getLessonName(exercise.lessonId)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Ex {exercise.exerciseNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exercise.questions?.length || 0} questions
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exercise.questions?.reduce((sum, q) => sum + (q.xp || 0), 0) || 0} XP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openViewForm(exercise)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => openEditForm(exercise)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(exercise.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View Form
  if (activeView === 'view' && currentExercise) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">View Exercise</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson</label>
                <p className="text-gray-900">{getLessonName(currentExercise.lessonId)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <p className="text-gray-900">{currentExercise.categoryId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Number</label>
                <p className="text-gray-900">Ex {currentExercise.exerciseNumber}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Questions ({currentExercise.questions?.length || 0})</h3>
            <div className="space-y-3">
              {currentExercise.questions?.map((question, index) => renderQuestionPreview(question, index))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => setActiveView('list')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Add/Edit Form
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          {activeView === 'add' ? 'Add Exercise' : 'Edit Exercise'}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Top Level Settings */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Exercise Settings</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Lesson</label>
              <select
                value={formData.lessonId}
                onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Choose a lesson...</option>
                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.topic}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">Choose category...</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Number</label>
              <input
                type="text"
                value={formData.exerciseNumber}
                onChange={(e) => setFormData({ ...formData, exerciseNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="e.g., 1"
                required
              />
            </div>
          </div>
        </div>

        {/* Question Builder */}
        <div className="mb-6 pb-6 border-b-2 border-dashed border-gray-300">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingQuestionIndex !== null ? 'Edit Question' : 'Add Question'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question No.</label>
                <input
                  type="text"
                  value={currentQuestion.questionNo}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionNo: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={currentQuestion.type}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="text_input">Text Input</option>
                  <option value="match_pairs">Match Pairs</option>
                </select>
              </div>
            </div>

            

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
                <input
                  type="number"
                  value={currentQuestion.xp}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, xp: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  value={currentQuestion.points}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (sec)</label>
                <input
                  type="number"
                  value={currentQuestion.timeLimitSec}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, timeLimitSec: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
              <textarea
                value={currentQuestion.prompt}
                onChange={(e) => setCurrentQuestion({ ...currentQuestion, prompt: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows="2"
                placeholder="Enter question prompt"
              />
            </div>

            {/* Type-specific fields */}
            {currentQuestion.type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={option.correct}
                      onChange={(e) => updateOption(index, 'correct', e.target.checked)}
                      className="w-5 h-5"
                      title="Mark as correct"
                    />
                    <span className="font-medium">{option.id}.</span>
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => updateOption(index, 'text', e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder={`Option ${option.id}`}
                    />
                    {currentQuestion.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800 px-3"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  + Add Option
                </button>
              </div>
            )}

            {currentQuestion.type === 'text_input' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer</label>
                <input
                  type="text"
                  value={currentQuestion.answer}
                  onChange={(e) => setCurrentQuestion({ ...currentQuestion, answer: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Enter expected answer"
                />
              </div>
            )}

            {currentQuestion.type === 'match_pairs' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pairs</label>
                {currentQuestion.pairs.map((pair, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={pair.left}
                      onChange={(e) => updatePair(index, 'left', e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Left side"
                    />
                    <span className="self-center text-gray-400">=</span>
                    <input
                      type="text"
                      value={pair.right}
                      onChange={(e) => updatePair(index, 'right', e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Right side"
                    />
                    {currentQuestion.pairs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePair(index)}
                        className="text-red-600 hover:text-red-800 px-3"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPair}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  + Add Pair
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveQuestion}
              className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <FaSave /> {editingQuestionIndex !== null ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </div>

        {/* Question Review List */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Questions Added ({formData.questions.length})
          </h3>
          {formData.questions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No questions added yet. Use the builder above to add questions.</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {formData.questions.map((question, index) => renderQuestionPreview(question, index))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => setActiveView('list')}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Close & Save Exercise
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminExercises;
