import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Toolbar,
  AppBar,
  InputAdornment,
  Fade,
  Skeleton,
} from "@mui/material";
import {
  Translate,
  SwapHoriz,
  History,
  BookmarkAdd,
  VolumeUp,
  Clear,
  ContentCopy,
  Share,
  Mic,
  PhotoCamera,
  Menu,
  ArrowDropDown,
} from "@mui/icons-material";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("vedda");
  const [targetLanguage, setTargetLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [translationHistory, setTranslationHistory] = useState([]);
  const [translationMethods, setTranslationMethods] = useState([]);
  const [targetIpaTranscription, setTargetIpaTranscription] = useState("");
  const [sourceIpaTranscription, setSourceIpaTranscription] = useState("");
  const [showIPA, setShowIPA] = useState(false);
  const [bridgeTranslation, setBridgeTranslation] = useState("");
  const [confidence, setConfidence] = useState(null);

  const languages = [
    { code: "vedda", name: "Vedda", native: "වැද්දා", flag: "🏝️" },
    { code: "sinhala", name: "Sinhala", native: "සිංහල", flag: "🇱🇰" },
    { code: "english", name: "English", native: "English", flag: "🇺🇸" },
    { code: "tamil", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
    { code: "hindi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    { code: "chinese", name: "Chinese", native: "中文", flag: "🇨🇳" },
    { code: "japanese", name: "Japanese", native: "日本語", flag: "🇯🇵" },
    { code: "korean", name: "Korean", native: "한국어", flag: "🇰🇷" },
    { code: "french", name: "French", native: "Français", flag: "🇫🇷" },
    { code: "german", name: "German", native: "Deutsch", flag: "🇩🇪" },
    { code: "spanish", name: "Spanish", native: "Español", flag: "🇪🇸" },
    { code: "italian", name: "Italian", native: "Italiano", flag: "🇮🇹" },
    { code: "portuguese", name: "Portuguese", native: "Português", flag: "🇵🇹" },
    { code: "russian", name: "Russian", native: "Русский", flag: "🇷🇺" },
    { code: "arabic", name: "Arabic", native: "العربية", flag: "🇸🇦" },
    { code: "dutch", name: "Dutch", native: "Nederlands", flag: "🇳🇱" },
    { code: "thai", name: "Thai", native: "ไทย", flag: "🇹🇭" },
    {
      code: "vietnamese",
      name: "Vietnamese",
      native: "Tiếng Việt",
      flag: "🇻🇳",
    },
    { code: "turkish", name: "Turkish", native: "Türkçe", flag: "🇹🇷" },
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/history`);
      setTranslationHistory(response.data.history.slice(0, 5)); // Show last 5
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError("Please enter text to translate");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/translate`, {
        text: inputText,
        source_language: sourceLanguage,
        target_language: targetLanguage,
        include_ipa: true,
      });

      setOutputText(response.data.translated_text);
      setTranslationMethods(response.data.translation_methods);
      setTargetIpaTranscription(response.data.target_ipa_transcription || response.data.ipa_transcription || "");
      setSourceIpaTranscription(response.data.source_ipa_transcription || "");
      setBridgeTranslation(response.data.bridge_translation || "");
      setConfidence(response.data.confidence || null);

      // Handle enhanced response data
      if (response.data.sinhala_words_detected > 0) {
        console.log(
          `${response.data.sinhala_words_detected} words treated as Sinhala`
        );
      }
      if (response.data.note) {
        console.log("Translation note:", response.data.note);
      }

      fetchHistory(); // Refresh history
    } catch (err) {
      setError("Translation failed. Please try again.");
      console.error("Translation error:", err);
    } finally {
      setLoading(false);
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

  const getLanguageName = (code) => {
    const lang = languages.find((l) => l.code === code);
    return lang ? lang.name : code;
  };

  const getLanguageNative = (code) => {
    const lang = languages.find((l) => l.code === code);
    return lang ? lang.native : code;
  };

  const getMethodColor = (method) => {
    switch (method) {
      case "dictionary":
        return "success";
      case "english_to_vedda_direct":
        return "success";
      case "english_to_sinhala_fallback":
        return "warning";
      case "english_to_sinhala_google":
        return "info";
      case "bridge_via_english":
        return "warning";
      case "google_translate":
        return "primary";
      case "sinhala_word":
        return "secondary";
      case "sinhala_to_target":
        return "info";
      case "vedda_as_sinhala_batch":
        return "secondary";
      case "unknown":
        return "error";
      // Legacy methods
      case "vedda_direct":
        return "success";
      case "vedda_fallback":
        return "warning";
      case "sinhala_passthrough":
        return "info";
      case "vedda_to_english_to_target":
        return "secondary";
      case "source_to_english_to_vedda":
        return "secondary";
      default:
        return "default";
    }
  };

  const getMethodLabel = (method) => {
    switch (method) {
      case "dictionary":
        return "Vedda Dictionary";
      case "english_to_vedda_direct":
        return "English → Vedda Direct";
      case "english_to_sinhala_fallback":
        return "English → Sinhala (Fallback)";
      case "english_to_sinhala_google":
        return "English → Sinhala (Google)";
      case "bridge_via_english":
        return "Via English Bridge";
      case "google_translate":
        return "Google Translate";
      case "sinhala_word":
        return "Sinhala Dictionary";
      case "sinhala_to_target":
        return "Sinhala → Target";
      case "vedda_as_sinhala_batch":
        return "Vedda as Sinhala (Batch)";
      case "unknown":
        return "Unknown Word";
      // Legacy methods
      case "vedda_direct":
        return "Vedda Dictionary";
      case "vedda_fallback":
        return "Sinhala Fallback";
      case "sinhala_passthrough":
        return "Sinhala Word";
      case "vedda_to_english_to_target":
        return "Via English Bridge";
      case "source_to_english_to_vedda":
        return "Via English Bridge";
      default:
        return "Unknown";
    }
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: "100vh", bgcolor: "#f8f9fa" }}>
      {/* Header - Google Translate Style */}
      <AppBar
        position="static"
        elevation={0}
        sx={{ bgcolor: "#1976d2", color: "white" }}
      >
        <Toolbar>
          <IconButton edge="start" color="inherit" sx={{ mr: 2 }}>
            <Menu />
          </IconButton>
          <Translate sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Vedda Translate
          </Typography>
          <IconButton color="inherit">
            <History />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Main Translation Card */}
        <Card
          elevation={2}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            minHeight: "400px",
          }}
        >
          {/* Language Selection Bar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid #e0e0e0",
              p: 2,
            }}
          >
            {/* Source Language */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <Select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                displayEmpty
                sx={{
                  border: "none",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                }}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Swap Button */}
            <IconButton
              onClick={handleSwapLanguages}
              sx={{
                mx: 2,
                bgcolor: "#f5f5f5",
                "&:hover": { bgcolor: "#e0e0e0" },
              }}
              disabled={sourceLanguage === targetLanguage}
            >
              <SwapHoriz />
            </IconButton>

            {/* Target Language */}
            <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
              <Select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                displayEmpty
                sx={{
                  border: "none",
                  "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  },
                }}
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Translation Interface */}
          <Grid container sx={{ minHeight: "350px" }}>
            {/* Input Panel */}
            <Grid
              item
              xs={12}
              md={6}
              sx={{ borderRight: { md: "1px solid #e0e0e0" } }}
            >
              <Box
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Input Language Label */}
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {getLanguageNative(sourceLanguage)}
                </Typography>

                {/* Input Text Area */}
                <TextField
                  multiline
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Type in ${getLanguageName(sourceLanguage)}`}
                  variant="outlined"
                  fullWidth
                  sx={{
                    flexGrow: 1,
                    "& .MuiOutlinedInput-root": {
                      border: "none",
                      "& fieldset": { border: "none" },
                      "&:hover fieldset": { border: "none" },
                      "&.Mui-focused fieldset": { border: "none" },
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "1.1rem",
                      lineHeight: 1.5,
                    },
                  }}
                  InputProps={{
                    endAdornment: inputText && (
                      <InputAdornment position="end">
                        <IconButton onClick={handleClearInput} size="small">
                          <Clear />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Source Language IPA Display */}
                {sourceIpaTranscription && inputText && (
                  <Box
                    sx={{
                      bgcolor: "#f8f9fa",
                      p: 2,
                      borderRadius: 2,
                      mt: 2,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ 
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        mb: 1
                      }}
                    >
                      {languages.find(l => l.code === sourceLanguage)?.name || sourceLanguage} pronunciation
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily: '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
                        fontSize: "1.2rem",
                        color: "#1a73e8",
                        fontWeight: 400,
                        letterSpacing: "1px",
                        lineHeight: 1.4,
                        wordBreak: "break-word",
                      }}
                    >
                      /{sourceIpaTranscription}/
                    </Typography>
                  </Box>
                )}

                {/* Input Actions */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                  }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton size="small" disabled>
                      <VolumeUp />
                    </IconButton>
                    <IconButton size="small" disabled>
                      <Mic />
                    </IconButton>
                    <IconButton size="small" disabled>
                      <PhotoCamera />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="textSecondary">
                    {inputText.length}/5000
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Output Panel */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  p: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Output Language Label */}
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {getLanguageNative(targetLanguage)}
                </Typography>

                {/* Loading State */}
                {loading && (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Skeleton variant="text" width="80%" height={30} />
                    <Skeleton variant="text" width="60%" height={30} />
                    <Skeleton variant="text" width="90%" height={30} />
                  </Box>
                )}

                {/* Error State */}
                {error && !loading && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Translation Output */}
                {outputText && !loading && (
                  <Fade in={!!outputText}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="body1"
                        sx={{
                          fontSize: "1.1rem",
                          lineHeight: 1.5,
                          mb: 2,
                          minHeight: "100px",
                        }}
                      >
                        {outputText}
                      </Typography>

                      {/* IPA Transcriptions */}
                      {(sourceIpaTranscription || targetIpaTranscription) && (
                        <Box
                          sx={{
                            bgcolor: "#f8f9fa",
                            p: 3,
                            borderRadius: 2,
                            mb: 2,
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            gutterBottom
                            sx={{ fontWeight: 500 }}
                          >
                            Pronunciations
                          </Typography>
                          
                          {/* Source Language IPA - Full Sentence */}
                          {sourceIpaTranscription && (
                            <Box sx={{ mb: 2, p: 2, bgcolor: "#ffffff", borderRadius: 1, border: "1px solid #e8eaed" }}>
                              <Typography
                                variant="body2"
                                color="primary"
                                sx={{ 
                                  fontSize: "0.85rem",
                                  fontWeight: 500,
                                  mb: 1
                                }}
                              >
                                {languages.find(l => l.code === sourceLanguage)?.name || sourceLanguage}
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontFamily: '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
                                  fontSize: "1.3rem",
                                  color: "#1a73e8",
                                  fontWeight: 400,
                                  letterSpacing: "1px",
                                  lineHeight: 1.4,
                                  wordBreak: "break-word",
                                }}
                              >
                                /{sourceIpaTranscription}/
                              </Typography>
                            </Box>
                          )}
                          
                          {/* Target Language IPA - Full Sentence */}
                          {targetIpaTranscription && (
                            <Box sx={{ p: 2, bgcolor: "#ffffff", borderRadius: 1, border: "1px solid #e8eaed" }}>
                              <Typography
                                variant="body2"
                                color="primary"
                                sx={{ 
                                  fontSize: "0.85rem",
                                  fontWeight: 500,
                                  mb: 1
                                }}
                              >
                                {languages.find(l => l.code === targetLanguage)?.name || targetLanguage}
                              </Typography>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontFamily: '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
                                  fontSize: "1.3rem",
                                  color: "#1a73e8",
                                  fontWeight: 400,
                                  letterSpacing: "1px",
                                  lineHeight: 1.4,
                                  wordBreak: "break-word",
                                }}
                              >
                                /{targetIpaTranscription}/
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      )}

                      {/* Bridge Translation Info */}
                      {bridgeTranslation && (
                        <Box
                          sx={{
                            bgcolor: "#e3f2fd",
                            p: 2,
                            borderRadius: 2,
                            mb: 2,
                            border: "1px solid #1976d2",
                          }}
                        >
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            gutterBottom
                          >
                            Bridge Translation (via English):
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{ fontStyle: "italic" }}
                          >
                            {bridgeTranslation}
                          </Typography>
                        </Box>
                      )}

                      {/* Confidence Score */}
                      {confidence && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            gutterBottom
                          >
                            Translation Confidence:{" "}
                            {Math.round(confidence * 100)}%
                          </Typography>
                        </Box>
                      )}

                      {/* Translation Methods */}
                      {translationMethods.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            gutterBottom
                          >
                            Translation methods:
                          </Typography>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}
                          >
                            {[...new Set(translationMethods)].map(
                              (method, index) => (
                                <Chip
                                  key={index}
                                  label={getMethodLabel(method)}
                                  color={getMethodColor(method)}
                                  size="small"
                                  variant="outlined"
                                />
                              )
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Fade>
                )}

                {/* Empty State */}
                {!outputText && !loading && !error && inputText && (
                  <Box
                    sx={{
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "text.secondary",
                    }}
                  >
                    <Typography>Click translate to see results</Typography>
                  </Box>
                )}

                {/* Output Actions */}
                {outputText && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 2,
                    }}
                  >
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton size="small" disabled>
                        <VolumeUp />
                      </IconButton>
                      <IconButton size="small" onClick={handleCopyOutput}>
                        <ContentCopy />
                      </IconButton>
                      <IconButton size="small" disabled>
                        <Share />
                      </IconButton>
                    </Box>
                  </Box>
                )}
              </Box>
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
              startIcon={
                loading ? <CircularProgress size={20} /> : <Translate />
              }
            >
              {loading ? "Translating..." : "Translate"}
            </Button>
          </Box>
        </Card>

        {/* Recent Translations & Examples */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {/* Recent Translations */}
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <History sx={{ mr: 1 }} />
                  Recent Translations
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {translationHistory.length > 0 ? (
                  translationHistory.map((item, index) => (
                    <Card
                      key={index}
                      variant="outlined"
                      sx={{
                        mb: 1,
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#f5f5f5" },
                        borderRadius: 1,
                      }}
                      onClick={() => {
                        setInputText(item.input_text);
                        setSourceLanguage(item.source_language);
                        setTargetLanguage(item.target_language);
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {item.input_text}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          → {item.output_text}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    No recent translations
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Example Phrases */}
          <Grid item xs={12} md={6}>
            <Card elevation={1} sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Try These Examples
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {[
                  { vedda: "මේ කැකුලෝ", english: "these children" },
                  { vedda: "අම්මා ගෙදර", english: "mother at home" },
                  { vedda: "වතුර පිරිසිදු", english: "water is clean" },
                  { vedda: "යන්න", english: "go" },
                ].map((example, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      cursor: "pointer",
                      "&:hover": { bgcolor: "#f5f5f5" },
                      borderRadius: 1,
                    }}
                    onClick={() => {
                      setInputText(example.vedda);
                      setSourceLanguage("vedda");
                      setTargetLanguage("english");
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {example.vedda}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {example.english}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
