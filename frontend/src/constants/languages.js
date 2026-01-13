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
  { vedda: "මේ කැකුළෝ", english: "these children" },
];

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Service URLs - Use environment variables with API Gateway fallback
export const SERVICE_URLS = {
  TRANSLATOR: import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5000",
  DICTIONARY: import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5000",
  HISTORY: import.meta.env.VITE_API_GATEWAY_URL || "http://localhost:5000",
};
