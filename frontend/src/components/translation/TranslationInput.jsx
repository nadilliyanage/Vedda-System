import { HiVolumeUp, HiMicrophone, HiCamera, HiX } from "react-icons/hi";
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
    <div className="p-6 h-full flex flex-col">
      {/* Input Language Label */}
      <p className="text-sm text-gray-600 mb-3">
        {getLanguageNative(sourceLanguage)}
      </p>

      {/* Input Text Area Container */}
      <div className="flex-grow relative">
        <textarea
          rows={8}
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Type in ${getLanguageName(sourceLanguage)}`}
          className="textarea-field h-full text-lg leading-relaxed resize-none"
          maxLength={5000}
        />

        {inputText && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <HiX className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Source Language IPA Display */}
      {sourceIpaTranscription && inputText && (
        <div className="bg-gray-50 p-4 rounded-lg mt-4 border border-gray-200">
          <p className="text-sm font-medium text-blue-600 mb-2">
            {LANGUAGES.find((l) => l.code === sourceLanguage)?.name ||
              sourceLanguage}{" "}
            pronunciation
          </p>
          <p
            className="text-xl text-blue-700 font-normal tracking-wide leading-relaxed break-words"
            style={{
              fontFamily:
                '"Doulos SIL", "Charis SIL", "Times New Roman", serif',
            }}
          >
            /{sourceIpaTranscription}/
          </p>
        </div>
      )}

      {/* Input Actions */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex gap-2">
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled
          >
            <HiVolumeUp className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled
          >
            <HiMicrophone className="w-5 h-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            disabled
          >
            <HiCamera className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500">{inputText.length}/5000</p>
      </div>
    </div>
  );
};

export default TranslationInput;
