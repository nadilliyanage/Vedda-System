import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { modelAPI } from '../services/modelAPI';

const ITEMS_PER_PAGE = 14;

const VisualsPage = () => {
  const navigate = useNavigate();

  const [words, setWords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');          // applied search
  const [searchInput, setSearchInput] = useState(''); // typing state

  const fetchWords = useCallback(
    async (pageToFetch = page, searchValue = search) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          limit: ITEMS_PER_PAGE,
          skip: (pageToFetch - 1) * ITEMS_PER_PAGE,
          hasVeddaIpa: true,
        };

        if (searchValue.trim()) {
          params.english_word = searchValue.trim();
        }

        const response = await modelAPI.getWords(params);
        const result = response.data;

        if (!result.success || !result.data) {
          setError(result.error || 'Failed to fetch words');
          setWords([]);
          setTotalCount(0);
          return;
        }

        let normalized = result.data
          .map(item => ({
            id: item._id || item.id,
            word: item.vedda_word || '',
            ipa: (item.vedda_ipa || '').replace(/^\/|\/$/g, ''),
            sinhalaWord: item.sinhala_word || '',
            sinhalaIpa: item.sinhala_ipa || '',
            englishWord: item.english_word || '',
          }))
          .filter(item => item.word && item.ipa);

        // Exact English-word match when searching
        if (searchValue.trim()) {
          const q = searchValue.trim().toLowerCase();
          normalized = normalized.filter(
            item => item.englishWord.toLowerCase() === q
          );
          setTotalCount(normalized.length);
        } else {
          setTotalCount(result.metadata?.total || normalized.length);
        }

        setWords(normalized);
      } catch (err) {
        if (err.code === 'ERR_NETWORK') {
          setError('Unable to connect to the server.');
        } else if (err.response?.status === 404) {
          setError('API endpoint not found.');
        } else {
          setError('Failed to fetch words from database.');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [page, search]
  );

  useEffect(() => {
    fetchWords(page, search);
  }, [page, search, fetchWords]);

  const handleSearchSubmit = e => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const handlePageChange = newPage => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const handleAnimateWord = wordData => {
    navigate(`/3d-visuals/${wordData.id}`, { state: { wordData } });
  };

  return (
    <div className="min-h-screen bg-dark-bg p-20">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black mb-2">Word Library</h1>
            <p className="text-gray-400">
              Select a word to view its lip-sync animation
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by English word..."
              className="px-3 py-2 rounded-lg border border-gray-300 text-black"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-3 py-2 bg-gray-300 rounded-lg"
              disabled={!search && !searchInput}
            >
              Clear
            </button>
          </form>
          <button
            onClick={() => fetchWords(page, search)}
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

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-10 w-10 border-b-2 border-blue-500 rounded-full" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Results */}
        {words.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4 text-gray-400 text-sm">
              {search
                ? `Found ${totalCount} matching "${search}"`
                : `Showing ${words.length} of ${totalCount}`}
              {totalPages > 1 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="px-2 py-1 bg-gray-700 text-white rounded"
                  >
                    Prev
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="px-2 py-1 bg-gray-700 text-white rounded"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {words.map(word => (
                <div
                  key={word.id}
                  className="bg-dark-surface border border-dark-border rounded-xl p-4"
                >
                  <h3 className="text-lg font-semibold text-black">
                    {word.word}
                  </h3>
                  <p className="text-blue-400 font-mono">/{word.ipa}/</p>
                  {word.sinhalaWord && (
                    <p className="text-xs text-gray-500">{word.sinhalaWord}</p>
                  )}
                  {word.englishWord && (
                    <p className="text-xs text-gray-500">{word.englishWord}</p>
                  )}

                  <button
                    onClick={() => handleAnimateWord(word)}
                    className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg"
                  >
                    View Animation
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Empty */}
        {!isLoading && !error && words.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {search
              ? `No words found for "${search}"`
              : 'No words with IPA found.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualsPage;
