import { useState } from "react";
import { HiSwitchVertical, HiChevronDown } from "react-icons/hi";
import { LANGUAGES } from "../../constants/languages";

const CustomSelect = ({ value, onChange, languages, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = languages.find((lang) => lang.code === value);

  return (
    <div className="relative min-w-[150px]">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left bg-white border-0 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          {selectedLang && (
            <>
              <span>{selectedLang.flag}</span>
              <span className="text-gray-900">{selectedLang.name}</span>
            </>
          )}
          {!selectedLang && (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <HiChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors duration-150"
                onClick={() => {
                  onChange(lang.code);
                  setIsOpen(false);
                }}
              >
                <span>{lang.flag}</span>
                <span className="text-gray-900">{lang.name}</span>
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
    <div className="flex items-center justify-between border-b border-gray-200 p-4">
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
        className={`mx-4 p-2 rounded-lg transition-colors duration-200 ${
          sourceLanguage === targetLanguage
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
        }`}
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
