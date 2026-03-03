import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
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
  const [onlyWithIPA, setOnlyWithIPA] = useState(false); // filter toggle

  const fetchWords = useCallback(
    async (pageToFetch = page, searchValue = search, filterIPA = onlyWithIPA) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = {
          limit: ITEMS_PER_PAGE,
          skip: (pageToFetch - 1) * ITEMS_PER_PAGE,
          hasVeddaIpa: filterIPA,
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
          }));

        // Filter out words without vedda_word
        normalized = normalized.filter(item => item.word);

        // Set total count from backend metadata
        setTotalCount(result.metadata?.total || 0);

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
    [page, search, onlyWithIPA]
  );

  useEffect(() => {
    fetchWords(page, search, onlyWithIPA);
  }, [page, search, onlyWithIPA, fetchWords]);

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

  const handleToggleIPA = () => {
    setOnlyWithIPA(!onlyWithIPA);
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
    <div
      className="min-h-screen mt-[60px]"
      style={{
        backgroundImage: `url('/assets/background-images/background-1.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* ── Glassmorphic nav bar ── */}
      <div
        style={{
          background: "rgba(28,20,8,0.55)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(200,170,100,0.18)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.20)",
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: "0.5rem",
                color: "rgba(255,248,230,0.90)",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(200,165,90,0.25)",
                borderRadius: "9px", padding: "0.4rem 0.9rem",
                fontFamily: "system-ui, sans-serif", fontWeight: "600",
                fontSize: "0.88rem", cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(200,165,90,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              <FaArrowLeft style={{ fontSize: "0.8rem" }} />
              Back to Home
            </button>
            <div style={{
              color: "#d4b483", fontFamily: "system-ui, sans-serif",
              fontWeight: "600", fontSize: "0.9rem",
            }}>
              {totalCount} Word{totalCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)",
          paddingTop: "1.5rem",
          paddingBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        <span style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.60)",
          border: "1px solid rgba(100,80,40,0.22)",
          borderRadius: "999px",
          padding: "0.28rem 1rem",
          fontSize: "0.73rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#5c4a1e",
          marginBottom: "0.6rem",
          fontFamily: "system-ui, sans-serif",
        }}>
          🎭 3D Word Animations
        </span>
        <h1 style={{
          fontSize: "clamp(1.8rem,4.5vw,3.2rem)",
          fontWeight: "800",
          color: "#1c1409",
          lineHeight: 1.2,
          margin: "0 auto 0.5rem",
          maxWidth: "720px",
          fontFamily: "'Georgia', serif",
          letterSpacing: "-0.3px",
          textShadow: "0 1px 0 rgba(255,255,255,0.8)",
          padding: "0 1rem",
        }}>
          Vedda{" "}
          <span style={{ color: "#9a6f2a", textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)" }}>
            Word
          </span>{" "}
          Library
        </h1>
        <p style={{
          fontSize: "clamp(0.9rem,1.8vw,1.08rem)",
          color: "#3d2e0f",
          maxWidth: "540px",
          margin: "0 auto 0.5rem",
          lineHeight: 1.75,
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
          padding: "0 1rem",
        }}>
          Explore Vedda words with 3D phoneme animations to learn authentic pronunciation.
        </p>
        <div style={{
          width: "52px", height: "3px",
          background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
          margin: "1rem auto 0",
          borderRadius: "99px",
        }} />
      </div>

      {/* ── Content area ── */}
      <div className="container mx-auto px-4 pb-12">
        {/* Controls — frosted wrapper */}
        <div style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: "14px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
          border: "1px solid rgba(255,255,255,0.60)",
        }}>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
            {/* IPA Filter Toggle */}
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
              <label className="text-sm text-gray-700 font-medium">Only with IPA:</label>
              <button
                onClick={handleToggleIPA}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  onlyWithIPA ? 'bg-blue-600' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    onlyWithIPA ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
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
                  {word.ipa ? (
                    <p className="text-blue-400 font-mono">/{word.ipa}/</p>
                  ) : (
                    <p className="text-red-400 text-xs">No IPA data available</p>
                  )}
                  {word.sinhalaWord && (
                    <p className="text-xs text-gray-500">{word.sinhalaWord}</p>
                  )}
                  {word.englishWord && (
                    <p className="text-xs text-gray-500">{word.englishWord}</p>
                  )}

                  <button
                    onClick={() => handleAnimateWord(word)}
                    disabled={!word.ipa}
                    className={`mt-3 w-full py-2 rounded-lg ${
                      word.ipa 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {word.ipa ? 'View Animation' : 'No Animation Available'}
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
