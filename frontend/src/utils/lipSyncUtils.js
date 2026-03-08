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
  'ɔː': { primary: ['Oh'], secondary: [], weight: 0.95, duration: 200 },
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
  'd͡ʒ': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 140 }, // judge
  'dʒ': { primary: ['ChJ'], secondary: [], weight: 0.9, duration: 140 }, // judge
  'j': { primary: ['ChJ'], secondary: ['EE'], weight: 0.7, secondaryWeight: 0.3, duration: 100 }, // yes
  
  // R-sounds → R
  'r': { primary: ['R'], secondary: [], weight: 0.85, duration: 120 },
  'ɹ': { primary: ['R'], secondary: [], weight: 0.85, duration: 120 }, // American r
  
  // Velar stops → KGHNG
  'k': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 100 },
  'g': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 110 },
  'ɡ': { primary: ['KGHNG'], secondary: [], weight: 0.8, duration: 110 },
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

const IPA_MULTI_CHAR_SYMBOLS = [
  'tʃ',
  'dʒ',
  'aɪ',
  'aʊ',
  'ɔɪ',
  'eɪ',
  'oʊ',
  'aː',
  'iː',
  'uː',
  'oː',
  'ɔː',
  'eː',
];

const IPA_VOWELS = new Set([
  'a',
  'aː',
  'æ',
  'ɑ',
  'ə',
  'ɛ',
  'e',
  'eː',
  'ɚ',
  'ɜ',
  'ɪ',
  'i',
  'iː',
  'ɒ',
  'ɔ',
  'ɔː',
  'o',
  'oː',
  'ʊ',
  'u',
  'uː',
  'ʌ',
  'y',
  'aɪ',
  'aʊ',
  'ɔɪ',
  'eɪ',
  'oʊ',
]);

export function normalizeIpaString(ipaString) {
  if (!ipaString) return '';

  return ipaString
    .trim()
    .replace(/\//g, '')
    .replace(/[ˈˌ.]/g, '')
    .replace(/\u0361+/g, '\u0361')
    .replace(/t\u0361ʃ/g, 'tʃ')
    .replace(/d\u0361ʒ/g, 'dʒ')
    .replace(/\u0361/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeIpa(ipaString) {
  const cleaned = normalizeIpaString(ipaString);
  const tokens = [];
  let index = 0;

  while (index < cleaned.length) {
    let matched = false;

    for (const symbol of IPA_MULTI_CHAR_SYMBOLS) {
      if (cleaned.substr(index, symbol.length) === symbol) {
        tokens.push(symbol);
        index += symbol.length;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    const char = cleaned[index];
    if (char === ' ' || char === '-') {
      tokens.push('_pause');
    } else {
      tokens.push(char);
    }
    index++;
  }

  return tokens;
}

function isIpaVowel(token) {
  return IPA_VOWELS.has(token);
}

function isGeminateBoundary(tokens, index) {
  const current = tokens[index];
  const next = tokens[index + 1];
  const afterNext = tokens[index + 2];

  return current && next && current === next && !isIpaVowel(current) && isIpaVowel(afterNext);
}

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
    'ɒ': 'o',    // short-o (British "hot" / Sinhala context) — 'ah' produces unnatural TTS
    'æ': 'a',
    'ɛ': 'eh',
    'e': 'ay',
    'eː': 'ay',
    'ɪ': 'ih',
    'i': 'ee',
    'iː': 'ee',
    'ɔ': 'aw',
    'ɔː': 'aw',
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
    'ɡ': 'g',
    'f': 'f',
    'v': 'v',
    'θ': 'th',
    'ð': 'th',
    's': 's',
    'z': 'z',
    'ʃ': 'sh',
    'ʒ': 'zh',
    'tʃ': 'ch',
    't͡ʃ': 'ch',   // tied notation generated by backend (t͡ʃ)
    'dʒ': 'j',
    'd͡ʒ': 'j',   // tied notation (already normalised above, kept as fallback)
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

  const tokens = tokenizeIpa(ipaString);
  let result = '';

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (token === '_pause') {
      result += ' ';
      continue;
    }

    if (token === ':' || token === 'ː') {
      continue;
    }

    result += ipaToEnglish[token] || token;

    if (isGeminateBoundary(tokens, index)) {
      result += ' ';
    }
  }

  result = result.replace(/\s+/g, ' ').trim();

  console.log('IPA to Phonetic English:', ipaString, '→', result);
  return result;
}

// Parse IPA transcription to phonemes for accurate animation
export function ipaToPhonemes(ipaString) {
  if (!ipaString) return [];

  const phonemes = [];
  const cleaned = normalizeIpaString(ipaString);

  console.log('Parsing IPA string:', cleaned);

  for (const token of tokenizeIpa(cleaned)) {
    if (token === '_pause') {
      phonemes.push('_pause');
      console.log('Adding pause');
      continue;
    }

    if (token === ':' || token === 'ː') {
      console.log('Skipping length marker');
      continue;
    }

    if (ipaToViseme[token]) {
      phonemes.push(token);
      if (token.length > 1) {
        console.log(`Matched multi-char: ${token}`);
      } else {
        console.log(`Matched single char: ${token} → ${ipaToViseme[token].primary[0]}`);
      }
      continue;
    }

    console.warn(`Unknown IPA symbol: ${token} (U+${token.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')})`);
    phonemes.push('ə');
  }
  
  console.log('Final phonemes array:', phonemes);
  return phonemes;
}