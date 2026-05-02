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

  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [onlyWithIPA, setOnlyWithIPA] = useState(true); // default to true to hide non-IPA words

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

        // Filter out words without vedda_word or without IPA
        normalized = normalized.filter(item => item.word && item.ipa);

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

  useEffect(() => {
    const nextSearch = searchInput.trim();

    const timeoutId = setTimeout(() => {
      if (nextSearch === search) {
        return;
      }

      setPage(1);
      setSearch(nextSearch);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchInput, search]);

  const handleClearSearch = () => {
    setIsSearchFocused(false);
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

  const normalizedSearchInput = searchInput.trim().toLowerCase();
  const suggestions = normalizedSearchInput && search === searchInput.trim()
    ? words
        .filter(word =>
          word.englishWord?.toLowerCase().includes(normalizedSearchInput) ||
          word.word?.toLowerCase().includes(normalizedSearchInput)
        )
        .slice(0, 6)
    : [];

  const handleSuggestionSelect = suggestion => {
    const selectedValue = suggestion.englishWord || suggestion.word;
    setSearchInput(selectedValue);
    setSearch(selectedValue);
    setPage(1);
    setIsSearchFocused(false);
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
          position: "relative",
          zIndex: 40,
        }}>
          <div className="flex flex-col items-center gap-4">
            {/* IPA Filter Toggle */}
            {/* <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
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
            </div> */}

            {/* Search */}
            <div className="flex w-full max-w-5xl flex-col items-center gap-2 sm:flex-row sm:items-start sm:justify-center">
              <div className="relative z-50 flex w-full max-w-4xl flex-col gap-2">
                <div className="relative flex w-full gap-2 justify-center">
                  <div className="relative flex-1">
                    <input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setTimeout(() => setIsSearchFocused(false), 120)}
                      placeholder="Search by English word..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 text-black"
                    />
                    {isSearchFocused && normalizedSearchInput && !isLoading && (
                      <div className="absolute left-0 right-0 top-full z-[60] mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                        {suggestions.length > 0 ? (
                          suggestions.map(suggestion => (
                            <button
                              key={suggestion.id}
                              type="button"
                              onMouseDown={() => handleSuggestionSelect(suggestion)}
                              className="flex w-full items-start justify-between gap-3 border-b border-gray-100 px-3 py-2 text-left last:border-b-0 hover:bg-amber-50"
                            >
                              <span className="font-medium text-gray-900">{suggestion.word}</span>
                              <span className="text-xs text-gray-500">{suggestion.englishWord || 'No English label'}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No matching words found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="shrink-0 px-4 py-3 bg-gray-300 rounded-lg"
                    disabled={!search && !searchInput}
                  >
                    Clear
                  </button>
                </div>
                {/* <span className="text-xs text-gray-500">
                  Results update automatically while you type.
                </span> */}
              </div>
              <button
                onClick={() => fetchWords(page, search)}
                disabled={isLoading}
                className="shrink-0 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center gap-2"
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
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div
              className="animate-spin"
              style={{
                width: "40px", height: "40px",
                border: "3px solid rgba(154,111,42,0.25)",
                borderTopColor: "#9a6f2a",
                borderRadius: "50%",
              }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            border: "1px solid rgba(220,38,38,0.35)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
            color: "#b91c1c",
            fontFamily: "system-ui, sans-serif",
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {words.length > 0 && (
          <>
            {/* Pagination row — frosted */}
            <div style={{
              background: "rgba(255,255,255,0.88)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              borderRadius: "10px",
              padding: "0.6rem 1rem",
              marginBottom: "1rem",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
              border: "1px solid rgba(255,255,255,0.60)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}>
              <span style={{ color: "#4b5563", fontSize: "0.875rem", fontFamily: "system-ui, sans-serif" }}>
                {search
                  ? `Found ${totalCount} matching "${search}"`
                  : `Showing ${words.length} of ${totalCount}`}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    style={{
                      padding: "0.3rem 0.75rem",
                      background: page === 1 ? "#e5e7eb" : "#9a6f2a",
                      color: page === 1 ? "#9ca3af" : "#fff",
                      border: "none", borderRadius: "7px",
                      fontWeight: "600", fontSize: "0.82rem",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    Prev
                  </button>
                  <span style={{ color: "#3d2e0f", fontSize: "0.85rem", fontWeight: "600", fontFamily: "system-ui, sans-serif" }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    style={{
                      padding: "0.3rem 0.75rem",
                      background: page === totalPages ? "#e5e7eb" : "#9a6f2a",
                      color: page === totalPages ? "#9ca3af" : "#fff",
                      border: "none", borderRadius: "7px",
                      fontWeight: "600", fontSize: "0.82rem",
                      cursor: page === totalPages ? "not-allowed" : "pointer",
                      fontFamily: "system-ui, sans-serif",
                    }}
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
                  style={{
                    background: "rgba(255,255,255,0.88)",
                    backdropFilter: "blur(10px)",
                    WebkitBackdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.60)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                  }}
                  className="rounded-xl p-4"
                >
                  <h3 className="text-lg font-semibold" style={{ color: "#1c1409" }}>
                    {word.word}
                  </h3>
                  {word.ipa ? (
                    <p className="font-mono" style={{ color: "#7c3fa8" }}>/{word.ipa}/</p>
                  ) : (
                    <p className="text-xs" style={{ color: "#dc2626" }}>No IPA data available</p>
                  )}
                  {word.sinhalaWord && (
                    <p className="text-xs" style={{ color: "#6b7280" }}>{word.sinhalaWord}</p>
                  )}
                  {word.englishWord && (
                    <p className="text-xs" style={{ color: "#6b7280" }}>{word.englishWord}</p>
                  )}

                  <button
                    onClick={() => handleAnimateWord(word)}
                    disabled={!word.ipa}
                    style={word.ipa ? {
                      marginTop: "0.75rem", width: "100%", padding: "0.5rem",
                      background: "linear-gradient(135deg, #7c3fa8, #4a6fa8)",
                      color: "#fff", border: "none", borderRadius: "8px",
                      fontWeight: "600", fontSize: "0.9rem",
                      fontFamily: "system-ui, sans-serif", cursor: "pointer",
                    } : {
                      marginTop: "0.75rem", width: "100%", padding: "0.5rem",
                      background: "#e5e7eb", color: "#9ca3af",
                      border: "none", borderRadius: "8px",
                      fontWeight: "600", fontSize: "0.9rem",
                      fontFamily: "system-ui, sans-serif", cursor: "not-allowed",
                    }}
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
          <div style={{
            textAlign: "center", padding: "5rem 1rem",
            background: "rgba(255,255,255,0.70)",
            borderRadius: "14px",
            color: "#3d2e0f",
            fontFamily: "system-ui, sans-serif",
            fontSize: "1.05rem",
          }}>
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
