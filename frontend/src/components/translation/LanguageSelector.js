import React from "react";
import { Box, FormControl, Select, MenuItem, IconButton } from "@mui/material";
import { SwapHoriz } from "@mui/icons-material";
import { LANGUAGES } from "../../constants/languages";

const LanguageSelector = ({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages,
}) => {
  return (
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
          onChange={(e) => onSourceLanguageChange(e.target.value)}
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
          {LANGUAGES.map((lang) => (
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
        onClick={onSwapLanguages}
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
          onChange={(e) => onTargetLanguageChange(e.target.value)}
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
          {LANGUAGES.map((lang) => (
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
  );
};

export default LanguageSelector;
