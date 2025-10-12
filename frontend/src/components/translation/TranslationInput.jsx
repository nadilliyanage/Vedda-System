import React from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { VolumeUp, Clear, Mic, PhotoCamera } from "@mui/icons-material";
import { LANGUAGES } from "../../constants/languages";

const TranslationInput = ({
  inputText,
  sourceLanguage,
  sourceIpaTranscription,
  onInputChange,
  onClear,
}) => {
  const getLanguageName = (code) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? lang.name : code;
  };

  const getLanguageNative = (code) => {
    const lang = LANGUAGES.find((l) => l.code === code);
    return lang ? lang.native : code;
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
      {/* Input Language Label */}
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {getLanguageNative(sourceLanguage)}
      </Typography>

      {/* Input Text Area */}
      <TextField
        multiline
        rows={8}
        value={inputText}
        onChange={(e) => onInputChange(e.target.value)}
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
              <IconButton onClick={onClear} size="small">
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
              mb: 1,
            }}
          >
            {LANGUAGES.find((l) => l.code === sourceLanguage)?.name ||
              sourceLanguage}{" "}
            pronunciation
          </Typography>
          <Typography
            variant="h6"
            sx={{
              fontFamily:
                '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
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
  );
};

export default TranslationInput;
