import { useState } from "react";
import { HiSwitchVertical, HiChevronDown } from "react-icons/hi";
import { LANGUAGES } from "../../constants/languages";

const glassSelectBtn = {
  background: "rgba(255, 248, 230, 0.38)",
  border: "1px solid rgba(200, 165, 90, 0.30)",
  borderRadius: "8px",
  color: "#2d1f07",
  fontWeight: "600",
  fontSize: "0.9rem",
  cursor: "pointer",
  transition: "background 0.2s",
};

const glassDropdown = {
  background: "rgba(255, 248, 230, 0.88)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(200, 165, 90, 0.32)",
  borderRadius: "10px",
  boxShadow: "0 8px 28px rgba(0,0,0,0.18)",
  overflow: "auto",
  maxHeight: "15rem",
};

const CustomSelect = ({ value, onChange, languages, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = languages.find((lang) => lang.code === value);

  return (
    <div className="relative min-w-[150px]">
      <button
        type="button"
        style={glassSelectBtn}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left focus:outline-none"
        onMouseEnter={(e) =>
          (e.currentTarget.style.background = "rgba(255, 248, 230, 0.60)")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = "rgba(255, 248, 230, 0.38)")
        }
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {selectedLang && (
            <>
              <span>{selectedLang.flag}</span>
              <span style={{ color: "#2d1f07" }}>{selectedLang.name}</span>
            </>
          )}
          {!selectedLang && (
            <span style={{ color: "#8c7040" }}>{placeholder}</span>
          )}
        </div>
        <HiChevronDown
          style={{ color: "#8c7040", width: "1rem", height: "1rem" }}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1" style={glassDropdown}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-left focus:outline-none transition-colors duration-150"
                style={{
                  color: "#2d1f07",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    "rgba(200, 165, 90, 0.18)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
                onClick={() => {
                  onChange(lang.code);
                  setIsOpen(false);
                }}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const LanguageSelector = ({
  sourceLanguage,
  targetLanguage,
  onSourceLanguageChange,
  onTargetLanguageChange,
  onSwapLanguages,
}) => {
  return (
    <div
      className="flex items-center justify-between p-4"
      style={{ borderBottom: "1px solid rgba(200, 165, 90, 0.25)" }}
    >
      {/* Source Language */}
      <CustomSelect
        value={sourceLanguage}
        onChange={onSourceLanguageChange}
        languages={LANGUAGES}
        placeholder="Select source language"
      />

      {/* Swap Button */}
      <button
        onClick={onSwapLanguages}
        className="mx-4 p-2 rounded-lg transition-colors duration-200"
        style={{
          background:
            sourceLanguage === targetLanguage
              ? "rgba(200,165,90,0.10)"
              : "rgba(200,165,90,0.18)",
          border: "1px solid rgba(200,165,90,0.28)",
          color:
            sourceLanguage === targetLanguage
              ? "rgba(140,112,64,0.45)"
              : "#5c4a1e",
          cursor: sourceLanguage === targetLanguage ? "not-allowed" : "pointer",
        }}
        disabled={sourceLanguage === targetLanguage}
      >
        <HiSwitchVertical className="w-5 h-5" />
      </button>

      {/* Target Language */}
      <CustomSelect
        value={targetLanguage}
        onChange={onTargetLanguageChange}
        languages={LANGUAGES}
        placeholder="Select target language"
      />
    </div>
  );
};

export default LanguageSelector;
