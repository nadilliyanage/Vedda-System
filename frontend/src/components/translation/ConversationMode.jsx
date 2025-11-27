import { useState, useRef, useEffect } from "react";
import { HiX, HiMicrophone, HiVolumeUp } from "react-icons/hi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { useTranslation } from "../../hooks/useTranslation";
import { generateSpeech } from "../../utils/ttsUtils";

const ConversationMode = ({ 
  sourceLanguage, 
  targetLanguage, 
  onClose 
}) => {
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState(sourceLanguage);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInputLanguage, setManualInputLanguage] = useState(sourceLanguage);
  const messagesEndRef = useRef(null);
  
  const { translate, loading } = useTranslation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSpeak = async (text, language) => {
    if (!text.trim()) return;

    // Cancel any ongoing browser speech
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }

    try {
      await generateSpeech(text, language);
    } catch (error) {
      console.error("TTS failed:", error.message);
    }
  };

  const handleMicrophoneClick = (language) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Map language codes
    const languageMap = {
      'english': 'en-US',
      'sinhala': 'si-LK',
      'tamil': 'ta-IN',
      'vedda': 'si-LK',
      'hindi': 'hi-IN',
      'french': 'fr-FR',
      'german': 'de-DE',
      'spanish': 'es-ES',
      'chinese': 'zh-CN',
      'japanese': 'ja-JP',
      'korean': 'ko-KR',
    };
    
    recognition.lang = languageMap[language] || 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setActiveLanguage(language);
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      
      // Add original message
      const userMessage = {
        id: Date.now(),
        text: transcript,
        language: language,
        type: 'user',
        isSource: language === sourceLanguage
      };
      
      setMessages(prev => [...prev, userMessage]);

      // Translate
      const targetLang = language === sourceLanguage ? targetLanguage : sourceLanguage;
      
      try {
        const result = await translate(transcript, language, targetLang);
        
        if (result && result.translatedText) {
          // Add translated message
          const translatedMessage = {
            id: Date.now() + 1,
            text: result.translatedText,
            language: targetLang,
            type: 'translated',
            isSource: targetLang === sourceLanguage,
            confidence: result.confidence
          };
          
          setMessages(prev => [...prev, translatedMessage]);
          
          // Auto-speak translation after a short delay
          setTimeout(() => {
            handleSpeak(result.translatedText, targetLang);
          }, 300);
        }
      } catch (error) {
        console.error('Translation error:', error);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      } else if (event.error === 'no-speech') {
        // Don't alert for no-speech, just silently fail
        console.log('No speech detected');
      } else if (event.error === 'network') {
        alert('Network error. Speech recognition requires an internet connection. Please check your connection and try again.');
      } else if (event.error === 'audio-capture') {
        alert('No microphone found. Please ensure a microphone is connected.');
      } else if (event.error !== 'aborted') {
        alert(`Speech recognition error: ${event.error}. Please try again.`);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsRecording(false);
      if (error.message.includes('network')) {
        alert('Cannot start speech recognition. Please check your internet connection.');
      } else {
        alert('Failed to start speech recognition. Please try again.');
      }
    }
  };

  const getLanguageLabel = (lang) => {
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const handleManualSubmit = async (language) => {
    if (!manualInput.trim()) return;

    // Add original message
    const userMessage = {
      id: Date.now(),
      text: manualInput,
      language: language,
      type: 'user',
      isSource: language === sourceLanguage
    };
    
    setMessages(prev => [...prev, userMessage]);

    // Translate
    const targetLang = language === sourceLanguage ? targetLanguage : sourceLanguage;
    
    try {
      const result = await translate(manualInput, language, targetLang);
      
      if (result && result.translatedText) {
        // Add translated message
        const translatedMessage = {
          id: Date.now() + 1,
          text: result.translatedText,
          language: targetLang,
          type: 'translated',
          isSource: targetLang === sourceLanguage,
          confidence: result.confidence
        };
        
        setMessages(prev => [...prev, translatedMessage]);
        
        // Auto-speak translation
        setTimeout(() => {
          handleSpeak(result.translatedText, targetLang);
        }, 300);
      }
    } catch (error) {
      console.error('Translation error:', error);
    }

    // Clear input and close modal
    setManualInput('');
    setShowManualInput(false);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex flex-col h-full max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-white shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">Conversation Mode</h2>
            <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
              <span className="px-2 md:px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                {getLanguageLabel(sourceLanguage)}
              </span>
              <span className="hidden sm:inline">↔</span>
              <span className="px-2 md:px-3 py-1 bg-green-100 text-green-700 rounded-full">
                {getLanguageLabel(targetLanguage)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <HiX className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 md:space-y-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <HiMicrophone className="w-12 h-12 md:w-16 md:h-16 mb-4" />
              <p className="text-sm md:text-lg text-center px-4">Tap a microphone to start conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isSource ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] rounded-lg p-3 md:p-4 ${
                    message.isSource
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-green-100 text-green-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold uppercase">
                      {getLanguageLabel(message.language)}
                    </span>
                    <button
                      onClick={() => handleSpeak(message.text, message.language)}
                      className="p-1 hover:bg-white hover:bg-opacity-50 rounded-full transition-colors ml-2"
                    >
                      <HiVolumeUp className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm md:text-base break-words">{message.text}</p>
                  {message.type === 'translated' && message.confidence && (
                    <div className="mt-2 text-xs opacity-70">
                      Confidence: {(message.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Control Panel */}
        <div className="border-t border-gray-200 p-3 md:p-6 bg-white shadow-lg">
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            {/* Source Language Controls */}
            <div className="space-y-2">
              <button
                onClick={() => handleMicrophoneClick(sourceLanguage)}
                disabled={loading || (isRecording && activeLanguage !== sourceLanguage)}
                className={`w-full relative flex flex-col items-center justify-center p-4 md:p-6 rounded-lg transition-all ${
                  isRecording && activeLanguage === sourceLanguage
                    ? 'bg-red-500 text-white scale-105 shadow-lg'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                } ${loading || (isRecording && activeLanguage !== sourceLanguage) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading && activeLanguage === sourceLanguage ? (
                  <AiOutlineLoading3Quarters className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
                ) : (
                  <HiMicrophone className={`w-8 h-8 md:w-12 md:h-12 ${isRecording && activeLanguage === sourceLanguage ? 'animate-pulse' : ''}`} />
                )}
                <span className="mt-1 md:mt-2 font-semibold text-xs md:text-base">
                  {getLanguageLabel(sourceLanguage)}
                </span>
                {isRecording && activeLanguage === sourceLanguage && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setManualInputLanguage(sourceLanguage);
                  setShowManualInput(true);
                }}
                className="w-full px-3 md:px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
              >
                Type instead
              </button>
            </div>

            {/* Target Language Controls */}
            <div className="space-y-2">
              <button
                onClick={() => handleMicrophoneClick(targetLanguage)}
                disabled={loading || (isRecording && activeLanguage !== targetLanguage)}
                className={`w-full relative flex flex-col items-center justify-center p-4 md:p-6 rounded-lg transition-all ${
                  isRecording && activeLanguage === targetLanguage
                    ? 'bg-red-500 text-white scale-105 shadow-lg'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } ${loading || (isRecording && activeLanguage !== targetLanguage) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading && activeLanguage === targetLanguage ? (
                  <AiOutlineLoading3Quarters className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
                ) : (
                  <HiMicrophone className={`w-8 h-8 md:w-12 md:h-12 ${isRecording && activeLanguage === targetLanguage ? 'animate-pulse' : ''}`} />
                )}
                <span className="mt-1 md:mt-2 font-semibold text-xs md:text-base">
                  {getLanguageLabel(targetLanguage)}
                </span>
                {isRecording && activeLanguage === targetLanguage && (
                  <span className="absolute top-2 right-2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                )}
              </button>
              
              <button
                onClick={() => {
                  setManualInputLanguage(targetLanguage);
                  setShowManualInput(true);
                }}
                className="w-full px-3 md:px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs md:text-sm font-medium transition-colors"
              >
                Type instead
              </button>
            </div>
          </div>
          
          {isRecording && (
            <div className="mt-3 md:mt-4 text-center text-xs md:text-sm text-gray-600">
              Listening... Speak now
            </div>
          )}
        </div>
      </div>

      {/* Manual Input Modal */}
      {showManualInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
              Type in {getLanguageLabel(manualInputLanguage)}
            </h3>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={`Type your message in ${getLanguageLabel(manualInputLanguage)}...`}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm md:text-base"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleManualSubmit(manualInputLanguage)}
                disabled={!manualInput.trim() || loading}
                className="flex-1 btn-blue disabled:opacity-50 text-sm md:text-base"
              >
                {loading ? 'Translating...' : 'Send'}
              </button>
              <button
                onClick={() => {
                  setShowManualInput(false);
                  setManualInput('');
                }}
                className="flex-1 btn-secondary text-sm md:text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationMode;
