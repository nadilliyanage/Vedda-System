import React, { useState } from "react";
import { Container, Grid, Box } from "@mui/material";

// Components
import Header from "./components/layout/Header";
import TranslationCard from "./components/translation/TranslationCard";
import TranslationHistory from "./components/translation/TranslationHistory";
import ExamplePhrases from "./components/ui/ExamplePhrases";

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
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f8f9fa" }}>
      {/* Header */}
      <Header onHistoryClick={handleHistoryClick} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
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
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Recent Translations */}
          <Grid item xs={12} md={6}>
            <TranslationHistory
              history={translationHistory}
              onSelectHistoryItem={handleHistoryItemSelect}
            />
          </Grid>

          {/* Example Phrases */}
          <Grid item xs={12} md={6}>
            <ExamplePhrases onSelectExample={handleExampleSelect} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
