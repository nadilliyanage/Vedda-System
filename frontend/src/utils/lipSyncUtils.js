// IPA to Viseme mapping for CC Base expressions (from the uploaded image)
// Viseme targets: AE, Ah, BMP, ChJ, EE, Er, FV, Ih, KGHNG, Oh, R, SZ, TLDN, Th, WOO

export const ipaToViseme = {
  // ========== VOWELS ==========
  
  // /æ/ as in "cat" → AE
  'æ': { primary: ['AE'], secondary: [], weight: 0.9, duration: 140 },
  
  // /ɑ/, /ɒ/, /ʌ/ → Ah (open mouth vowels)
  'ɑ': { primary: ['Ah'], secondary: [], weight: 0.95, duration: 150 },
  'ɒ': { primary: ['Ah'], secondary: [], weight: 0.9, duration: 140 },
  'ʌ': { primary: ['Ah'], secondary: [], weight: 0.85, duration: 130 }, // cup, strut
  'a': { primary: ['Ah'], secondary: [], weight: 0.9, duration: 140 }, // generic a
  'aː': { primary: ['Ah'], secondary: [], weight: 0.95, duration: 200 }, // long a
  
  // /i/, /iː/ → EE (smile/close front)
  'i': { primary: ['EE'], secondary: [], weight: 0.9, duration: 140 },
  'iː': { primary: ['EE'], secondary: [], weight: 0.95, duration: 200 },
  'y': { primary: ['EE'], secondary: [], weight: 0.85, duration: 100 }, // French "tu"
  
  // /ɪ/ → Ih (relaxed smile)
  'ɪ': { primary: ['Ih'], secondary: [], weight: 0.85, duration: 120 },
  
  // /ɛ/, /e/ → AE or Ih (mid-front vowels)
  'ɛ': { primary: ['AE'], secondary: ['Ih'], weight: 0.7, secondaryWeight: 0.3, duration: 130 },
  'e': { primary: ['AE'], secondary: ['EE'], weight: 0.7, secondaryWeight: 0.3, duration: 140 },
  'eː': { primary: ['AE'], secondary: ['EE'], weight: 0.8, secondaryWeight: 0.4, duration: 200 },
  
  // /ɔ/, /o/, /oː/ → Oh (rounded open)
  'ɔ': { primary: ['Oh'], secondary: [], weight: 0.9, duration: 150 },
  'o': { primary: ['Oh'], secondary: [], weight: 0.85, duration: 145 },
  'oː': { primary: ['Oh'], secondary: [], weight: 0.9, duration: 200 },
  
  // /u/, /uː/ → WOO (rounded close)
  'u': { primary: ['WOO'], secondary: [], weight: 0.9, duration: 150 },
  'uː': { primary: ['WOO'], secondary: [], weight: 0.95, duration: 200 },
  'ʊ': { primary: ['WOO'], secondary: [], weight: 0.7, duration: 120 },
  
  // /ə/ schwa → Ah (reduced)
  'ə': { primary: ['Ah'], secondary: [], weight: 0.4, duration: 100 },
  
  // /ɜ/, /ɚ/ → Er
  'ɜ': { primary: ['Er'], secondary: [], weight: 0.8, duration: 140 },
  'ɚ': { primary: ['Er'], secondary: [], weight: 0.6, duration: 120 },
  
  // ========== DIPHTHONGS ==========
  'aɪ': { primary: ['Ah'], secondary: ['EE'], weight: 0.85, secondaryWeight: 0.7, duration: 180 },
  'aʊ': { primary: ['Ah'], secondary: ['WOO'], weight: 0.85, secondaryWeight: 0.7, duration: 180 },
  'ɔɪ': { primary: ['Oh'], secondary: ['EE'], weight: 0.8, secondaryWeight: 0.7, duration: 180 },
  'eɪ': { primary: ['AE'], secondary: ['EE'], weight: 0.75, secondaryWeight: 0.7, duration: 170 },
  'oʊ': { primary: ['Oh'], secondary: ['WOO'], weight: 0.8, secondaryWeight: 0.7, duration: 170 },
  
  // ========== CONSONANTS ==========
  
  // Bilabials (lips together) → BMP
  'p': { primary: ['BMP'], secondary: [], weight: 1.0, duration: 100 },
  'b': { primary: ['BMP'], secondary: [], weight: 1.0, duration: 110 },
  'm': { primary: ['BMP'], secondary: [], weight: 1.0, duration: 140 },
  
  // Labiodentals (lip to teeth) → FV
  'f': { primary: ['FV'], secondary: [], weight: 0.9, duration: 120 },
  'v': { primary: ['FV'], secondary: [], weight: 0.9, duration: 130 },
  
  // Dental/Alveolar stops → TLDN
  't': { primary: ['TLDN'], secondary: [], weight: 0.8, duration: 90 },
  'd': { primary: ['TLDN'], secondary: [], weight: 0.8, duration: 100 },
  'n': { primary: ['TLDN'], secondary: [], weight: 0.7, duration: 130 },
  'l': { primary: ['TLDN'], secondary: [], weight: 0.7, duration: 120 },
  
  // Dental fricatives → Th
  'θ': { primary: ['Th'], secondary: [], weight: 0.85, duration: 130 }, // thin
  'ð': { primary: ['Th'], secondary: [], weight: 0.85, duration: 130 }, // this
  
  // Alveolar fricatives → SZ
  's': { primary: ['SZ'], secondary: [], weight: 0.85, duration: 130 },
  'z': { primary: ['SZ'], secondary: [], weight: 0.85, duration: 130 },
  
  // Post-alveolar/Palatal → ChJ
  'ʃ': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 140 }, // ship
  'ʒ': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 140 }, // measure
  'tʃ': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 140 }, // chin
  'dʒ': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 140 }, // judge
  'j': { primary: ['ChJ'], secondary: ['EE'], weight: 0.7, secondaryWeight: 0.3, duration: 100 }, // yes
  
  // R-sounds → R
  'r': { primary: ['R'], secondary: [], weight: 0.85, duration: 120 },
  'ɹ': { primary: ['R'], secondary: [], weight: 0.85, duration: 120 }, // American r
  
  // Velar stops → KGHNG
  'k': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 100 },
  'g': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 110 },
  'ŋ': { primary: ['KGHNG'], secondary: [], weight: 0.7, duration: 140 }, // sing
  
  // W-sound → WOO
  'w': { primary: ['WOO'], secondary: [], weight: 0.9, duration: 130 },
  
  // Glottal/other
  'h': { primary: ['Ah'], secondary: [], weight: 0.3, duration: 90 },
  'ʔ': { primary: ['BMP'], secondary: [], weight: 0.3, duration: 60 }, // glottal stop
  
  // Palatal stops
  'c': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 100 },
  'ɟ': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 110 },
  
  // Aspiration marker
  'ʰ': { primary: ['Ah'], secondary: [], weight: 0.25, duration: 50 },
  
  // Silence/pause
  '_pause': { primary: ['Ah'], secondary: [], weight: 0.1, duration: 80 },
};

// Legacy simple phoneme mapping (for backward compatibility with text-based animation)
export const phonemeToViseme = {
  // Vowels
  'a': { primary: ['Ah'], secondary: [], weight: 0.9 },
  'e': { primary: ['AE'], secondary: ['EE'], weight: 0.7, secondaryWeight: 0.3 },
  'i': { primary: ['EE'], secondary: [], weight: 0.8 },
  'o': { primary: ['Oh'], secondary: [], weight: 0.85 },
  'u': { primary: ['WOO'], secondary: [], weight: 0.8 },
  
  // Consonants
  'p': { primary: ['BMP'], secondary: [], weight: 1.0, duration: 120 },
  'b': { primary: ['BMP'], secondary: [], weight: 1.0, duration: 120 },
  'm': { primary: ['BMP'], secondary: [], weight: 1.0, duration: 150 },
  'f': { primary: ['FV'], secondary: [], weight: 0.9, duration: 130 },
  'v': { primary: ['FV'], secondary: [], weight: 0.9, duration: 130 },
  's': { primary: ['SZ'], secondary: [], weight: 0.85, duration: 140 },
  'z': { primary: ['SZ'], secondary: [], weight: 0.85, duration: 140 },
  't': { primary: ['TLDN'], secondary: [], weight: 0.8, duration: 100 },
  'd': { primary: ['TLDN'], secondary: [], weight: 0.8, duration: 100 },
  'n': { primary: ['TLDN'], secondary: [], weight: 0.7, duration: 120 },
  'l': { primary: ['TLDN'], secondary: [], weight: 0.7, duration: 120 },
  'r': { primary: ['R'], secondary: [], weight: 0.85, duration: 130 },
  'w': { primary: ['WOO'], secondary: [], weight: 0.9, duration: 140 },
  'y': { primary: ['EE'], secondary: [], weight: 0.8, duration: 110 },
  'h': { primary: ['Ah'], secondary: [], weight: 0.3, duration: 100 },
  'k': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 110 },
  'g': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 110 },
  'th': { primary: ['Th'], secondary: [], weight: 0.85, duration: 120 },
  'ch': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 130 },
  'sh': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 140 },
};

// Helper function to find best matching morph target
export function findBestMorphMatch(shapeNames, availableMorphs) {
  for (const shapeName of shapeNames) {
    // Exact match first
    const exactMatch = availableMorphs.find(m => 
      m.toLowerCase() === shapeName.toLowerCase()
    );
    if (exactMatch) return exactMatch;
    
    // Partial match
    const partialMatch = availableMorphs.find(m => 
      m.toLowerCase().includes(shapeName.toLowerCase()) ||
      shapeName.toLowerCase().includes(m.toLowerCase())
    );
    if (partialMatch) return partialMatch;
  }
  return null;
}

// Convert plain text to phonemes (legacy support)
export function textToPhonemes(text) {
  const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
  const phonemes = [];
  
  for (const word of words) {
    if (!word) continue;
    
    let i = 0;
    while (i < word.length) {
      // Check for digraphs first
      const twoChar = word.substr(i, 2);
      if (phonemeToViseme[twoChar]) {
        phonemes.push(twoChar);
        i += 2;
      } else {
        const oneChar = word[i];
        phonemes.push(oneChar);
        i++;
      }
    }
    phonemes.push('_pause'); // Short pause between words
  }
  
  return phonemes;
}

// Convert IPA to phonetic English approximation for TTS
export function ipaToPhoneticEnglish(ipaString) {
  if (!ipaString) return '';
  
  // Map IPA phonemes to English-pronounceable text
  const ipaToEnglish = {
    // Vowels
    'ʌ': 'uh',
    'ɑ': 'ah',
    'ɒ': 'ah',
    'æ': 'a',
    'ɛ': 'eh',
    'e': 'ay',
    'eː': 'ay',
    'ɪ': 'ih',
    'i': 'ee',
    'iː': 'ee',
    'ɔ': 'aw',
    'o': 'oh',
    'oː': 'oh',
    'u': 'oo',
    'uː': 'oo',
    'ʊ': 'uh',
    'ə': 'uh',
    'ɜ': 'er',
    'ɚ': 'er',
    
    // Diphthongs
    'aɪ': 'eye',
    'aʊ': 'ow',
    'ɔɪ': 'oy',
    'eɪ': 'ay',
    'oʊ': 'oh',
    
    // Consonants
    'm': 'm',
    'n': 'n',
    'ŋ': 'ng',
    'p': 'p',
    'b': 'b',
    't': 't',
    'd': 'd',
    'k': 'k',
    'g': 'g',
    'f': 'f',
    'v': 'v',
    'θ': 'th',
    'ð': 'th',
    's': 's',
    'z': 'z',
    'ʃ': 'sh',
    'ʒ': 'zh',
    'tʃ': 'ch',
    'dʒ': 'j',
    'h': 'h',
    'w': 'w',
    'l': 'l',
    'r': 'r',
    'ɹ': 'r',
    'j': 'y',
    'ʔ': '',
    'c': 'k',
    'ɟ': 'g',
  };
  
  let result = '';
  let i = 0;
  const cleaned = ipaString.replace(/[ˈˌ.]/g, ''); // Remove stress markers
  
  while (i < cleaned.length) {
    let matched = false;
    
    // Try multi-character symbols first
    const multiChar = ['tʃ', 'dʒ', 'aɪ', 'aʊ', 'ɔɪ', 'eɪ', 'oʊ', 'aː', 'iː', 'uː', 'oː', 'eː'];
    for (const symbol of multiChar) {
      if (cleaned.substr(i, symbol.length) === symbol) {
        result += ipaToEnglish[symbol] || symbol;
        i += symbol.length;
        matched = true;
        break;
      }
    }
    
    // Try single character
    if (!matched) {
      const char = cleaned[i];
      if (ipaToEnglish[char]) {
        result += ipaToEnglish[char];
      } else if (char === ':' || char === 'ː') {
        // Skip length markers
      } else if (char === ' ' || char === '-') {
        result += ' ';
      } else {
        // Keep unknown characters as-is
        result += char;
      }
      i++;
    }
  }
  
  console.log('IPA to Phonetic English:', ipaString, '→', result);
  return result;
}

// Parse IPA transcription to phonemes for accurate animation
export function ipaToPhonemes(ipaString) {
  if (!ipaString) return [];
  
  const phonemes = [];
  let i = 0;
  
  // Remove stress markers and syllable breaks
  const cleaned = ipaString.replace(/[ˈˌ.]/g, '');
  
  console.log('Parsing IPA string:', cleaned);
  
  while (i < cleaned.length) {
    let matched = false;
    
    // Try to match multi-character IPA symbols first (longest match first)
    const multiChar = ['tʃ', 'dʒ', 'aɪ', 'aʊ', 'ɔɪ', 'eɪ', 'oʊ', 'aː', 'iː', 'uː', 'oː', 'eː'];
    for (const symbol of multiChar) {
      if (cleaned.substr(i, symbol.length) === symbol) {
        phonemes.push(symbol);
        console.log(`Matched multi-char: ${symbol}`);
        i += symbol.length;
        matched = true;
        break;
      }
    }
    
    // Try single character IPA symbols
    if (!matched) {
      const char = cleaned[i];
      
      if (ipaToViseme[char]) {
        phonemes.push(char);
        console.log(`Matched single char: ${char} → ${ipaToViseme[char].primary[0]}`);
        i++;
      } else if (char === ':' || char === 'ː') {
        // Length marker - already handled by long vowel variants
        console.log('Skipping length marker');
        i++;
      } else if (char === ' ' || char === '-') {
        // Space or hyphen - treat as pause
        phonemes.push('_pause');
        console.log('Adding pause');
        i++;
      } else {
        // Unknown IPA symbol - log and use fallback
        console.warn(`Unknown IPA symbol: ${char} (U+${char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`);
        // Use schwa as fallback
        phonemes.push('ə');
        i++;
      }
    }
  }
  
  console.log('Final phonemes array:', phonemes);
  return phonemes;
}