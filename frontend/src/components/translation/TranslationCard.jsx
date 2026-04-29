import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiTranslate } from "react-icons/hi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BsChatDots } from "react-icons/bs";
import { FaPlay } from "react-icons/fa";
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
  const [targetSinglish, setTargetSinglish] = useState("");
  const [sourceSinglish, setSourceSinglish] = useState("");
  const [bridgeTranslation, setBridgeTranslation] = useState("");
  const [confidence, setConfidence] = useState(null);
  const [showConversation, setShowConversation] = useState(false);

  const navigate = useNavigate();

  const { translate, loading, error, setError } = useTranslation();

  const handleTranslate = async () => {
    const result = await translate(inputText, sourceLanguage, targetLanguage);

    if (result) {
      setOutputText(result.translatedText);
      setTranslationMethods(result.translationMethods);
      setTargetIpaTranscription(result.targetIpaTranscription);
      setSourceIpaTranscription(result.sourceIpaTranscription);
      setTargetSinglish(result.targetSinglish);
      setSourceSinglish(result.sourceSinglish);
      setBridgeTranslation(result.bridgeTranslation);
      setConfidence(result.confidence);

      // Handle enhanced response data
      if (result.sinhalaWordsDetected > 0) {
        console.log(`${result.sinhalaWordsDetected} words treated as Sinhala`);
      }
      if (result.note) {
        console.log("Translation note:", result.note);
      }

      onTranslationComplete({
        input_text: inputText,
        output_text: result.translatedText,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      });
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
      setTargetSinglish("");
      setSourceSinglish("");
    }
  };

  const handleClearInput = () => {
    setInputText("");
    setOutputText("");
    setTargetIpaTranscription("");
    setSourceIpaTranscription("");
    setTargetSinglish("");
    setSourceSinglish("");
    setError("");
  };

  const handleCopyOutput = () => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
    }
  };

  const canShowVeddaAnimation =
    targetLanguage === "vedda" &&
    outputText.trim() &&
    targetIpaTranscription &&
    targetIpaTranscription.trim();

  const handleShowAnimation = () => {
    if (!canShowVeddaAnimation) return;

    navigate("/3d-visuals/translation", {
      state: {
        wordData: {
          word: outputText,
          ipa: targetIpaTranscription,
        },
        backTo: "/translator",
        backLabel: "Back to Translator",
        title: "Translation Animation",
        autoPlay: true,
      },
    });
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
          <div
            className="md:border-r"
            style={{ borderColor: "rgba(200, 165, 90, 0.22)" }}
          >
            <TranslationInput
              inputText={inputText}
              sourceLanguage={sourceLanguage}
              sourceIpaTranscription={sourceIpaTranscription}
              sourceSinglish={sourceSinglish}
              onInputChange={setInputText}
              onClear={handleClearInput}
            />
          </div>

          {/* Output Panel */}
          <div>
            <TranslationOutput
              outputText={outputText}
              sourceLanguage={sourceLanguage}
              targetLanguage={targetLanguage}
              loading={loading}
              error={error}
              sourceIpaTranscription={sourceIpaTranscription}
              targetIpaTranscription={targetIpaTranscription}
              sourceSinglish={sourceSinglish}
              targetSinglish={targetSinglish}
              bridgeTranslation={bridgeTranslation}
              confidence={confidence}
              translationMethods={translationMethods}
              onCopyOutput={handleCopyOutput}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className="p-6 flex justify-center gap-4"
          style={{ borderTop: "1px solid rgba(200, 165, 90, 0.22)" }}
        >
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

          {targetLanguage === "vedda" && (
            <button
              className={`btn-secondary min-w-[160px] flex items-center justify-center ${
                canShowVeddaAnimation ? "" : "opacity-50 cursor-not-allowed"
              }`}
              onClick={handleShowAnimation}
              disabled={!canShowVeddaAnimation}
              title={
                canShowVeddaAnimation
                  ? "Show 3D mouth animation for the translated Vedda text"
                  : "Translate to Vedda to enable animation"
              }
            >
              <FaPlay className="w-4 h-4 mr-2" />
              Show Animation
            </button>
          )}
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
