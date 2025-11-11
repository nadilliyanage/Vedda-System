// Utility functions for text-to-speech functionality

export const getAvailableVoices = () => {
  return speechSynthesis.getVoices();
};

export const checkLanguageSupport = (languageCode) => {
  const voices = getAvailableVoices();
  const languageMap = {
    'english': ['en-US', 'en-GB', 'en'],
    'sinhala': ['si-LK', 'si'],
    'vedda': ['si-LK', 'si'], // Uses Sinhala voices
    'tamil': ['ta-IN', 'ta'],
    'hindi': ['hi-IN', 'hi'],
    'chinese': ['zh-CN', 'zh-TW', 'zh'],
    'japanese': ['ja-JP', 'ja'],
    'korean': ['ko-KR', 'ko'],
    'french': ['fr-FR', 'fr-CA', 'fr'],
    'german': ['de-DE', 'de'],
    'spanish': ['es-ES', 'es-MX', 'es'],
    'italian': ['it-IT', 'it'],
    'portuguese': ['pt-BR', 'pt-PT', 'pt'],
    'russian': ['ru-RU', 'ru'],
    'arabic': ['ar-SA', 'ar']
  };

  const preferredLangs = languageMap[languageCode] || [];
  
  for (const lang of preferredLangs) {
    const voice = voices.find(v => v.lang.startsWith(lang));
    if (voice) {
      return {
        supported: true,
        voice: voice.name,
        language: voice.lang
      };
    }
  }
  
  return {
    supported: false,
    fallback: 'English (en-US)'
  };
};

export const getVoicesForLanguage = (languageCode) => {
  const voices = getAvailableVoices();
  const languageMap = {
    'english': ['en'],
    'sinhala': ['si'],
    'vedda': ['si'], // Uses Sinhala voices
    'tamil': ['ta'],
    'hindi': ['hi'],
    'chinese': ['zh'],
    'japanese': ['ja'],
    'korean': ['ko'],
    'french': ['fr'],
    'german': ['de'],
    'spanish': ['es'],
    'italian': ['it'],
    'portuguese': ['pt'],
    'russian': ['ru'],
    'arabic': ['ar']
  };

  const langPrefixes = languageMap[languageCode] || [];
  return voices.filter(voice => 
    langPrefixes.some(prefix => voice.lang.startsWith(prefix))
  );
};