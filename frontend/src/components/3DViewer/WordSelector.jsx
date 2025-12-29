import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';

const WordSelector = ({ onWordSelect, onAnimateWord, onSpeakWord, isAnimating }) => {
  const [words, setWords] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setIsLoading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Clean and normalize headers
        return header.trim().toLowerCase();
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn('CSV parsing warnings:', results.errors);
        }

        // Validate CSV structure
        const data = results.data;
        if (data.length === 0) {
          setError('CSV file is empty');
          setIsLoading(false);
          return;
        }

        // Try to find word and IPA columns (flexible matching)
        const firstRow = data[0];
        const headers = Object.keys(firstRow);
        
        const wordCol = headers.find(h => 
          h.toLowerCase().includes('word') || 
          h.toLowerCase() === 'vedda word'
        );
        
        const ipaCol = headers.find(h => 
          h.toLowerCase().includes('ipa') || 
          h.toLowerCase().includes('transcription')
        );

        if (!wordCol) {
          setError('CSV must have a column with "word" in the name');
          setIsLoading(false);
          return;
        }

        if (!ipaCol) {
          setError('CSV must have a column with "ipa" or "transcription" in the name');
          setIsLoading(false);
          return;
        }

        // Normalize data using found columns
        const normalizedData = data.map(row => ({
          word: (row[wordCol] || '').trim(),
          ipa: (row[ipaCol] || '').trim().replace(/^\/|\/$/g, ''), // Remove leading/trailing slashes
        })).filter(item => item.word && item.ipa);

        if (normalizedData.length === 0) {
          setError('No valid word/IPA pairs found in CSV');
          setIsLoading(false);
          return;
        }

        setWords(normalizedData);
        setIsLoading(false);
        setError(null);
      },
      error: (error) => {
        setError('Failed to read file');
        console.error('File reading error:', error);
        setIsLoading(false);
      }
    });
  }, []);

  const handleWordClick = useCallback((wordData) => {
    setSelectedWord(wordData);
    if (onWordSelect) {
      onWordSelect(wordData);
    }
  }, [onWordSelect]);

  const handleAnimate = useCallback(() => {
    if (selectedWord && onAnimateWord) {
      onAnimateWord(selectedWord);
    }
  }, [selectedWord, onAnimateWord]);

  const handleSpeak = useCallback(() => {
    if (selectedWord && onSpeakWord) {
      onSpeakWord(selectedWord);
    }
  }, [selectedWord, onSpeakWord]);

  const loadSampleWords = useCallback(() => {
    // Load sample words from public folder
    setIsLoading(true);
    setError(null);
    
    fetch('/words.csv')
      .then(response => {
        if (!response.ok) {
          throw new Error('Sample file not found');
        }
        return response.text();
      })
      .then(csvText => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => {
            return header.trim().toLowerCase();
          },
          complete: (results) => {
            const data = results.data;
            const firstRow = data[0];
            const headers = Object.keys(firstRow);
            
            const wordCol = headers.find(h => 
              h.toLowerCase().includes('word') || 
              h.toLowerCase() === 'vedda word'
            );
            
            const ipaCol = headers.find(h => 
              h.toLowerCase().includes('ipa') || 
              h.toLowerCase().includes('transcription')
            );

            const normalizedData = data.map(row => ({
              word: (row[wordCol] || '').trim(),
              ipa: (row[ipaCol] || '').trim().replace(/^\/|\/$/g, ''),
            })).filter(item => item.word && item.ipa);

            setWords(normalizedData);
            setIsLoading(false);
          }
        });
      })
      .catch(err => {
        setError('Sample file not available. Please upload your own CSV.');
        console.error('Error loading sample:', err);
        setIsLoading(false);
      });
  }, []);

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
        IPA Word Library
      </h4>
      
      {/* File Upload Section */}
      <div className="space-y-2">
        <label className="block">
          <span className="sr-only">Upload CSV file</span>
          <div className="flex gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700
                file:cursor-pointer cursor-pointer
                file:transition-colors"
            />
          </div>
        </label>
        <button
          onClick={loadSampleWords}
          className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg font-medium transition-colors"
        >
          Load Sample Words
        </button>
        <p className="text-xs text-gray-500">
          CSV format: word, ipa
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Word List */}
      {words.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              {words.length} words loaded
            </span>
            {selectedWord && (
              <div className="flex gap-2">
                <button
                  onClick={handleAnimate}
                  disabled={isAnimating}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  Animate
                </button>
                <button
                  onClick={handleSpeak}
                  disabled={isAnimating}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white text-xs rounded-lg font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 3.5a1.5 1.5 0 013 0V12a1.5 1.5 0 01-3 0V3.5zM5.5 8a1.5 1.5 0 013 0v4a1.5 1.5 0 01-3 0V8zm9 0a1.5 1.5 0 013 0v4a1.5 1.5 0 01-3 0V8z"/>
                  </svg>
                  Speak
                </button>
              </div>
            )}
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-1 pr-2 scrollbar-thin">
            {words.map((wordData, index) => (
              <button
                key={index}
                onClick={() => handleWordClick(wordData)}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-all ${
                  selectedWord?.word === wordData.word && selectedWord?.ipa === wordData.ipa
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-surface hover:bg-dark-border text-gray-300 hover:text-white'
                }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{wordData.word}</span>
                  <span className="text-xs opacity-75 font-mono">
                    /{wordData.ipa}/
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Word Display */}
      {selectedWord && (
        <div className="p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <div className="text-xs text-blue-400 mb-1">Selected Word:</div>
          <div className="text-sm font-medium text-white">{selectedWord.word}</div>
          <div className="text-xs font-mono text-blue-300 mt-1">
            /{selectedWord.ipa}/
          </div>
        </div>
      )}
    </div>
  );
};

export default WordSelector;
