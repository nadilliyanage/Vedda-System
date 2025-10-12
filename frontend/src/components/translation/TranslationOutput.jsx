import React from "react";
import {
  Box,
  Typography,
  Alert,
  Fade,
  Skeleton,
  Chip,
  IconButton,
} from "@mui/material";
import { VolumeUp, ContentCopy, Share } from "@mui/icons-material";
import { LANGUAGES } from "../../constants/languages";

const TranslationOutput = ({
  outputText,
  targetLanguage,
  loading,
  error,
  sourceIpaTranscription,
  targetIpaTranscription,
  bridgeTranslation,
  confidence,
  translationMethods,
  onCopyOutput,
}) => {
  const getLanguageNative = (code) => {
    const lang = LANGUAGES.find((l) => l.code === code);
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

                {/* Target Language IPA - Full Sentence */}
                {targetIpaTranscription && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: "#ffffff",
                      borderRadius: 1,
                      border: "1px solid #e8eaed",
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        mb: 1,
                      }}
                    >
                      {LANGUAGES.find((l) => l.code === targetLanguage)?.name ||
                        targetLanguage}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontFamily:
                          '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
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
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Bridge Translation (via English):
                </Typography>
                <Typography variant="body1" sx={{ fontStyle: "italic" }}>
                  {bridgeTranslation}
                </Typography>
              </Box>
            )}

            {/* Confidence Score */}
            {confidence && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Translation Confidence: {Math.round(confidence * 100)}%
                </Typography>
              </Box>
            )}

            {/* Translation Methods */}
            {translationMethods.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Translation methods:
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {[...new Set(translationMethods)].map((method, index) => (
                    <Chip
                      key={index}
                      label={getMethodLabel(method)}
                      color={getMethodColor(method)}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Fade>
      )}

      {/* Empty State */}
      {!outputText && !loading && !error && (
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
            <IconButton size="small" onClick={onCopyOutput}>
              <ContentCopy />
            </IconButton>
            <IconButton size="small" disabled>
              <Share />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TranslationOutput;
