import React, { useState } from "react";
import { Card, Grid, Box, Button, CircularProgress } from "@mui/material";
import { Translate } from "@mui/icons-material";
import LanguageSelector from "./LanguageSelector";
import TranslationInput from "./TranslationInput";
import TranslationOutput from "./TranslationOutput";
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
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        minHeight: "400px",
      }}
    >
      {/* Language Selection Bar */}
      <LanguageSelector
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        onSourceLanguageChange={setSourceLanguage}
        onTargetLanguageChange={setTargetLanguage}
        onSwapLanguages={handleSwapLanguages}
      />

      {/* Translation Interface */}
      <Grid container sx={{ minHeight: "350px" }}>
        {/* Input Panel */}
        <Grid
          item
          xs={12}
          md={6}
          sx={{ borderRight: { md: "1px solid #e0e0e0" } }}
        >
          <TranslationInput
            inputText={inputText}
            sourceLanguage={sourceLanguage}
            sourceIpaTranscription={sourceIpaTranscription}
            onInputChange={setInputText}
            onClear={handleClearInput}
          />
        </Grid>

        {/* Output Panel */}
        <Grid item xs={12} md={6}>
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
        </Grid>
      </Grid>

      {/* Translate Button */}
      <Box
        sx={{
          p: 3,
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Button
          variant="contained"
          size="large"
          onClick={handleTranslate}
          disabled={loading || !inputText.trim()}
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: "none",
            fontSize: "1rem",
          }}
          startIcon={loading ? <CircularProgress size={20} /> : <Translate />}
        >
          {loading ? "Translating..." : "Translate"}
        </Button>
      </Box>
    </Card>
  );
};

export default TranslationCard;
