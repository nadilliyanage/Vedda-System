export const LANGUAGES = [
  { code: "vedda", name: "Vedda", native: "වැද්දා", flag: "VE" },
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

export const EXAMPLE_PHRASES = [
  { vedda: "මේ කැකුලෝ", english: "these children" },
  { vedda: "අම්මා ගෙදර", english: "mother at home" },
  { vedda: "වතුර පිරිසිදු", english: "water is clean" },
  { vedda: "යන්න", english: "go" },
];

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5001";

// Service URLs using environment variables
export const SERVICE_URLS = {
  TRANSLATOR: import.meta.env.VITE_TRANSLATOR_SERVICE_URL || "http://localhost:5003/api",
  DICTIONARY: import.meta.env.VITE_DICTIONARY_SERVICE_URL || "http://localhost:5004/api",
  HISTORY: import.meta.env.VITE_HISTORY_SERVICE_URL || "http://localhost:5005/api",
};
