import { useState } from "react";

// Components
import Header from "./components/layout/Header.jsx";
import TranslationCard from "./components/translation/TranslationCard.jsx";
import TranslationHistory from "./components/translation/TranslationHistory.jsx";
import ExamplePhrases from "./components/ui/ExamplePhrases.jsx";

// Hooks
import { useTranslationHistory } from "./hooks/useTranslationHistory";

function App() {
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

  const handleHistoryClick = () => {
    // Handle history navigation if needed
    console.log("History clicked");
  };

  return (
    <div className="flex-grow min-h-screen bg-gray-50">
      {/* Header */}
      <Header onHistoryClick={handleHistoryClick} />

      <div className="mx-auto px-4 py-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Recent Translations */}
          <div>
            <TranslationHistory
              history={translationHistory}
              onSelectHistoryItem={handleHistoryItemSelect}
            />
          </div>

          {/* Example Phrases */}
          <div>
            <ExamplePhrases onSelectExample={handleExampleSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
