import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { modelAPI } from '../services/modelAPI';

const VisualsPage = () => {
  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();

  // Fetch words from database API
  const fetchWords = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await modelAPI.getWords({ 
        limit: 100, 
        skip: 0, 
        hasVeddaIpa: true 
      });
      
      const result = response.data;
      
      if (result.success && result.data) {
        // Transform API response to match expected format
        const normalizedData = result.data.map(item => ({
          word: item.vedda_word || '',
          ipa: (item.vedda_ipa || '').replace(/^\/|\/$/g, ''),
          sinhalaWord: item.sinhala_word || '',
          sinhalaIpa: item.sinhala_ipa || '',
          englishWord: item.english_word || '',
          id: item._id || item.id
        })).filter(item => item.word && item.ipa);
        
        setWords(normalizedData);
        setTotalCount(result.metadata?.total || normalizedData.length);
      } else {
        setError(result.error || 'Failed to fetch words');
      }
    } catch (err) {
      console.error('Error fetching words:', err);
      if (err.response?.status === 404) {
        setError('API endpoint not found. Please ensure the 3D Model Service is running.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Unable to connect to the server. Please check if the backend services are running.');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch words from database');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-load words on mount
  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const handleAnimateWord = (wordData) => {
    navigate(`/3d-visuals/${wordData.id}`, { state: { wordData } });
  };

  return (
    <div className="min-h-screen bg-dark-bg p-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">Word Library</h1>
            <p className="text-gray-400">Select a word to view its lip-sync animation</p>
          </div>
          <button
            onClick={fetchWords}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <svg 
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700/30 rounded-lg mb-6">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Word Grid */}
        {words.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-400">
                Showing {words.length} of {totalCount} words with IPA
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {words.map((wordData, index) => (
                <div
                  key={wordData.id || index}
                  className="bg-dark-surface border border-dark-border rounded-xl p-4 hover:border-blue-500/50 transition-all"
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-white">{wordData.word}</h3>
                    <p className="text-sm font-mono text-blue-400">/{wordData.ipa}/</p>
                    {wordData.sinhalaWord && (
                      <p className="text-xs text-gray-500 mt-1">{wordData.sinhalaWord}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAnimateWord(wordData)}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    View Animation
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && words.length === 0 && !error && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500">No words with IPA found in the database.</p>
            <p className="text-gray-600 text-sm mt-2">Add words with vedda_ipa field to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualsPage;
