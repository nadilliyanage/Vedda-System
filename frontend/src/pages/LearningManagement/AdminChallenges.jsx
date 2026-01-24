import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaPlus, FaEdit, FaTrash, FaEye } from 'react-icons/fa';
import { challengesAPI } from '../../services/learningAPI';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingScreen from '../../components/ui/LoadingScreen';

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, challengeId: null });
  const [formData, setFormData] = useState({
    id: '',
    type: 'fill_blank',
    prompt: '',
    xp: 20,
    coins: 4,
    timeLimitSec: 45,
    answers: [''],
    options: [
      { id: 'A', text: '' },
      { id: 'B', text: '' },
      { id: 'C', text: '' },
      { id: 'D', text: '' }
    ],
    correct: [],
    pairs: [{ left: '', right: '' }]
  });

  useEffect(() => {
    fetchChallenges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType]);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await challengesAPI.getAll();
      const filteredData = filterType === 'all' 
        ? response.data 
        : response.data.filter(c => c.type === filterType);
      setChallenges(filteredData);
    } catch (error) {
      toast.error('Failed to fetch challenges');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, challenge = null) => {
    setModalMode(mode);
    setCurrentChallenge(challenge);
    
    if (mode === 'create') {
      setFormData({
        id: '',
        type: 'fill_blank',
        prompt: '',
        xp: 20,
        coins: 4,
        timeLimitSec: 45,
        answers: [''],
        options: [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correct: [],
        pairs: [{ left: '', right: '' }]
      });
    } else if (challenge) {
      setFormData({
        id: challenge.id,
        type: challenge.type,
        prompt: challenge.prompt,
        xp: challenge.xp || 20,
        coins: challenge.coins || 4,
        timeLimitSec: challenge.timeLimitSec || 45,
        answers: challenge.answers || [''],
        options: challenge.options || [
          { id: 'A', text: '' },
          { id: 'B', text: '' },
          { id: 'C', text: '' },
          { id: 'D', text: '' }
        ],
        correct: challenge.correct || [],
        pairs: challenge.pairs || [{ left: '', right: '' }]
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentChallenge(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const submitData = {
        id: formData.id,
        type: formData.type,
        prompt: formData.prompt,
        xp: parseInt(formData.xp),
        coins: parseInt(formData.coins),
        timeLimitSec: parseInt(formData.timeLimitSec)
      };

      if (formData.type === 'fill_blank') {
        submitData.answers = formData.answers.filter(a => a.trim());
      } else if (formData.type === 'multiple_choice') {
        submitData.options = formData.options.filter(o => o.text.trim());
        submitData.correct = formData.correct;
      } else if (formData.type === 'match_pairs') {
        submitData.pairs = formData.pairs.filter(p => p.left.trim() && p.right.trim());
      }

      if (modalMode === 'create') {
        await challengesAPI.create(submitData);
        toast.success('Challenge created successfully');
      } else if (modalMode === 'edit') {
        await challengesAPI.update(formData.id, submitData);
        toast.success('Challenge updated successfully');
      }

      closeModal();
      fetchChallenges();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save challenge');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    try {
      await challengesAPI.delete(confirmDialog.challengeId);
      toast.success('Challenge deleted successfully');
      fetchChallenges();
    } catch (error) {
      toast.error('Failed to delete challenge');
      console.error(error);
    }
  };

  const addAnswer = () => {
    setFormData({ ...formData, answers: [...formData.answers, ''] });
  };

  const removeAnswer = (index) => {
    setFormData({ ...formData, answers: formData.answers.filter((_, i) => i !== index) });
  };

  const updateAnswer = (index, value) => {
    const newAnswers = [...formData.answers];
    newAnswers[index] = value;
    setFormData({ ...formData, answers: newAnswers });
  };

  const updateOption = (index, field, value) => {
    const newOptions = [...formData.options];
    newOptions[index][field] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const toggleCorrect = (optionId) => {
    const newCorrect = formData.correct.includes(optionId)
      ? formData.correct.filter(id => id !== optionId)
      : [...formData.correct, optionId];
    setFormData({ ...formData, correct: newCorrect });
  };

  const addPair = () => {
    setFormData({ ...formData, pairs: [...formData.pairs, { left: '', right: '' }] });
  };

  const removePair = (index) => {
    setFormData({ ...formData, pairs: formData.pairs.filter((_, i) => i !== index) });
  };

  const updatePair = (index, field, value) => {
    const newPairs = [...formData.pairs];
    newPairs[index][field] = value;
    setFormData({ ...formData, pairs: newPairs });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'fill_blank': return 'Fill in the Blank';
      case 'multiple_choice': return 'Multiple Choice';
      case 'match_pairs': return 'Match Pairs';
      default: return type;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('fill_blank')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'fill_blank' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Fill Blank
          </button>
          <button
            onClick={() => setFilterType('multiple_choice')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'multiple_choice' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Multiple Choice
          </button>
          <button
            onClick={() => setFilterType('match_pairs')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'match_pairs' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Match Pairs
          </button>
        </div>
        
        <button
          onClick={() => openModal('create')}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Add Challenge
        </button>
      </div>

      {loading ? (
        <LoadingScreen />
      ) : challenges.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No challenges found</p>
          <p className="text-gray-400 mt-2">Create your first challenge to get started</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rewards</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {challenges.map((challenge) => (
                <tr key={challenge.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{challenge.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                      {getTypeLabel(challenge.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">{challenge.prompt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {challenge.xp} XP • {challenge.coins} Coins
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal('view', challenge)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => openModal('edit', challenge)}
                        className="text-green-600 hover:text-green-900"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => setConfirmDialog({ isOpen: true, challengeId: challenge.id })}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? 'Create Challenge' : modalMode === 'edit' ? 'Edit Challenge' : 'View Challenge'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Challenge ID</label>
                    <input
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      disabled={modalMode === 'edit' || modalMode === 'view'}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    >
                      <option value="fill_blank">Fill in the Blank</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="match_pairs">Match Pairs</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                  <textarea
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full border rounded-lg px-3 py-2"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">XP Reward</label>
                    <input
                      type="number"
                      value={formData.xp}
                      onChange={(e) => setFormData({ ...formData, xp: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coins Reward</label>
                    <input
                      type="number"
                      value={formData.coins}
                      onChange={(e) => setFormData({ ...formData, coins: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (sec)</label>
                    <input
                      type="number"
                      value={formData.timeLimitSec}
                      onChange={(e) => setFormData({ ...formData, timeLimitSec: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>

                {/* Type-specific fields */}
                {formData.type === 'fill_blank' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Accepted Answers</label>
                    {formData.answers.map((answer, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => updateAnswer(index, e.target.value)}
                          disabled={modalMode === 'view'}
                          className="flex-1 border rounded-lg px-3 py-2"
                          placeholder={`Answer ${index + 1}`}
                        />
                        {modalMode !== 'view' && formData.answers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAnswer(index)}
                            className="text-red-600 hover:text-red-800 px-3"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    ))}
                    {modalMode !== 'view' && (
                      <button
                        type="button"
                        onClick={addAnswer}
                        className="text-orange-600 hover:text-orange-800 text-sm"
                      >
                        + Add Answer
                      </button>
                    )}
                  </div>
                )}

                {formData.type === 'multiple_choice' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={formData.correct.includes(option.id)}
                          onChange={() => toggleCorrect(option.id)}
                          disabled={modalMode === 'view'}
                          className="w-5 h-5"
                          title="Mark as correct"
                        />
                        <span className="font-medium">{option.id}.</span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) => updateOption(index, 'text', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="flex-1 border rounded-lg px-3 py-2"
                          placeholder={`Option ${option.id}`}
                        />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 mt-2">Check the boxes to mark correct answers</p>
                  </div>
                )}

                {formData.type === 'match_pairs' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pairs</label>
                    {formData.pairs.map((pair, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={pair.left}
                          onChange={(e) => updatePair(index, 'left', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="flex-1 border rounded-lg px-3 py-2"
                          placeholder="Left side"
                        />
                        <span className="self-center text-gray-400">=</span>
                        <input
                          type="text"
                          value={pair.right}
                          onChange={(e) => updatePair(index, 'right', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="flex-1 border rounded-lg px-3 py-2"
                          placeholder="Right side"
                        />
                        {modalMode !== 'view' && formData.pairs.length > 1 && (
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
                    {modalMode !== 'view' && (
                      <button
                        type="button"
                        onClick={addPair}
                        className="text-orange-600 hover:text-orange-800 text-sm"
                      >
                        + Add Pair
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  {modalMode === 'view' ? 'Close' : 'Cancel'}
                </button>
                {modalMode !== 'view' && (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    {modalMode === 'create' ? 'Create' : 'Update'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, challengeId: null })}
        onConfirm={handleDelete}
        title="Delete Challenge"
        message="Are you sure you want to delete this challenge? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default AdminChallenges;
