import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

// Components
import TranslationCard from "../components/translation/TranslationCard.jsx";
import TranslationHistory from "../components/translation/TranslationHistory.jsx";
import ExamplePhrases from "../components/ui/ExamplePhrases.jsx";

// Hooks
import { useTranslationHistory } from "../hooks/useTranslationHistory";

const TranslatorPage = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("vedda");
  const [targetLanguage, setTargetLanguage] = useState("english");

  const { translationHistory, fetchHistory } = useTranslationHistory();

  const handleHistoryItemSelect = (item) => {
    setInputText(item.input_text);
    setSourceLanguage(item.source_language);
    setTargetLanguage(item.target_language);
  };

  const handleExampleSelect = (example) => {
    setInputText(example.vedda);
    setSourceLanguage("vedda");
    setTargetLanguage("english");
  };

  return (
    <div className="min-h-screen bg-gray-50 mt-16">
      {/* Back Button */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="mr-2" />
              <span className="font-medium">Back to Home</span>
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Vedda Language Translator
          </h1>
        </div>

        {/* Main Translation Card */}
        <TranslationCard
          inputText={inputText}
          setInputText={setInputText}
          sourceLanguage={sourceLanguage}
          setSourceLanguage={setSourceLanguage}
          targetLanguage={targetLanguage}
          setTargetLanguage={setTargetLanguage}
          onTranslationComplete={fetchHistory}
        />

        {/* Recent Translations & Examples */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 items-stretch">
          {/* Recent Translations */}
          <div className="h-full">
            <TranslationHistory
              history={translationHistory}
              onSelectHistoryItem={handleHistoryItemSelect}
              onRefresh={fetchHistory}
            />
          </div>

          {/* Example Phrases */}
          <div className="h-full">
            <ExamplePhrases onSelectExample={handleExampleSelect} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslatorPage;
