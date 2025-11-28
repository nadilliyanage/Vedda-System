import { useState } from "react";
import { HiTranslate } from "react-icons/hi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsChatDots } from "react-icons/bs";
import LanguageSelector from "./LanguageSelector.jsx";
import TranslationInput from "./TranslationInput.jsx";
import TranslationOutput from "./TranslationOutput.jsx";
import ConversationMode from "./ConversationMode.jsx";
import { useTranslation } from "../../hooks/useTranslation";

const TranslationCard = ({
  inputText,
  setInputText,
  sourceLanguage,
  setSourceLanguage,
  targetLanguage,
  setTargetLanguage,
  onTranslationComplete,
}) => {
  const [outputText, setOutputText] = useState("");
  const [translationMethods, setTranslationMethods] = useState([]);
  const [targetIpaTranscription, setTargetIpaTranscription] = useState("");
  const [sourceIpaTranscription, setSourceIpaTranscription] = useState("");
  const [bridgeTranslation, setBridgeTranslation] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [showConversation, setShowConversation] = useState(false);

  const { translate, loading, error, setError } = useTranslation();

  const handleTranslate = async () => {
    const result = await translate(inputText, sourceLanguage, targetLanguage);

    if (result) {
      setOutputText(result.translatedText);
      setTranslationMethods(result.translationMethods);
      setTargetIpaTranscription(result.targetIpaTranscription);
      setSourceIpaTranscription(result.sourceIpaTranscription);
      setBridgeTranslation(result.bridgeTranslation);
      setConfidence(result.confidence);

      // Handle enhanced response data
      if (result.sinhalaWordsDetected > 0) {
        console.log(`${result.sinhalaWordsDetected} words treated as Sinhala`);
      }
      if (result.note) {
        console.log("Translation note:", result.note);
      }

      onTranslationComplete(); // Refresh history
    }
  };

  const handleSwapLanguages = () => {
    if (sourceLanguage !== targetLanguage) {
      setSourceLanguage(targetLanguage);
      setTargetLanguage(sourceLanguage);
      setInputText(outputText);
      setOutputText("");
      setTargetIpaTranscription("");
      setSourceIpaTranscription("");
    }
  };

  const handleClearInput = () => {
    setInputText("");
    setOutputText("");
    setTargetIpaTranscription("");
    setSourceIpaTranscription("");
    setError("");
  };

  const handleCopyOutput = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
    }
  };

  return (
    <>
      <div className="card min-h-[400px] overflow-hidden">
        {/* Language Selection Bar */}
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onSourceLanguageChange={setSourceLanguage}
          onTargetLanguageChange={setTargetLanguage}
          onSwapLanguages={handleSwapLanguages}
        />

        {/* Translation Interface */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[350px]">
          {/* Input Panel */}
          <div className="md:border-r border-gray-200">
            <TranslationInput
              inputText={inputText}
              sourceLanguage={sourceLanguage}
              sourceIpaTranscription={sourceIpaTranscription}
              onInputChange={setInputText}
              onClear={handleClearInput}
            />
          </div>

          {/* Output Panel */}
          <div>
            <TranslationOutput
              outputText={outputText}
              targetLanguage={targetLanguage}
              loading={loading}
              error={error}
              sourceIpaTranscription={sourceIpaTranscription}
              targetIpaTranscription={targetIpaTranscription}
              bridgeTranslation={bridgeTranslation}
              confidence={confidence}
              translationMethods={translationMethods}
              onCopyOutput={handleCopyOutput}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-gray-200 flex justify-center gap-4">
          <button
            className={`btn-blue min-w-[140px] flex items-center justify-center ${
              loading || !inputText.trim()
                ? "opacity-50 cursor-not-allowed"
                : ""
            }`}
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <>
                <AiOutlineLoading3Quarters className="w-5 h-5 mr-2 animate-spin" />
                Translating...
              </>
            ) : (
              <>
                <HiTranslate className="w-5 h-5 mr-2" />
                Translate
              </>
            )}
          </button>

          <button
            className="btn-secondary min-w-[140px] flex items-center justify-center"
            onClick={() => setShowConversation(true)}
          >
            <BsChatDots className="w-5 h-5 mr-2" />
            Conversation
          </button>
        </div>
      </div>

      {/* Conversation Mode Modal */}
      {showConversation && (
        <ConversationMode
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          onClose={() => setShowConversation(false)}
        />
      )}
    </>
  );
};

export default TranslationCard;
