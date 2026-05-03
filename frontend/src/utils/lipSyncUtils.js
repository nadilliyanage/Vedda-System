// IPA to Viseme mapping for CC Base expressions (from the uploaded image)
// Viseme targets: AE, Ah, BMP, ChJ, EE, Er, FV, Ih, KGHNG, Oh, R, SZ, TLDN, Th, WOO

export const ipaToViseme = {
  // ========== VOWELS ==========
  
  // /æ/ as in "cat" → AE
  'æ': { primary: ['AE'], secondary: [], weight: 0.9, duration: 140 },
  'æː': { primary: ['AE'], secondary: [], weight: 0.95, duration: 200 }, // long æ (Sinhala/Vedda)
  
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
  'ɪː': { primary: ['EE'], secondary: ['Ih'], weight: 0.75, secondaryWeight: 0.25, duration: 190 },
  
  // /ɛ/, /e/ → AE or Ih (mid-front vowels)
  'ɛ': { primary: ['AE'], secondary: ['Ih'], weight: 0.7, secondaryWeight: 0.3, duration: 130 },
  'ɛː': { primary: ['AE'], secondary: ['Ih'], weight: 0.8, secondaryWeight: 0.35, duration: 200 },
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
  'ʊː': { primary: ['WOO'], secondary: [], weight: 0.85, duration: 190 },
  
  // /ə/ schwa → Ah (reduced)
  'ə': { primary: ['Ah'], secondary: [], weight: 0.4, duration: 100 },
  'əː': { primary: ['Ah'], secondary: [], weight: 0.45, duration: 170 },
  
  // /ɜ/, /ɚ/ → Er
  'ɜ': { primary: ['Er'], secondary: [], weight: 0.8, duration: 140 },
  'ɚ': { primary: ['Er'], secondary: [], weight: 0.6, duration: 120 },
  'ɜː': { primary: ['Er'], secondary: [], weight: 0.85, duration: 200 },
  
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
  '_pause': { primary: ['_pause'], secondary: [], weight: 1.0, duration: 80 },
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
  'æː',
  'əː',
  'ɛː',
  'ɪː',
  'iː',
  'ɜː',
  'uː',
  'ʊː',
  'oː',
  'ɔː',
  'eː',
];

const IPA_VOWELS = new Set([
  'a',
  'aː',
  'æ',
  'æː',
  'ɑ',
  'ə',
  'əː',
  'ɛ',
  'ɛː',
  'e',
  'eː',
  'ɚ',
  'ɜ',
  'ɜː',
  'ɪ',
  'ɪː',
  'i',
  'iː',
  'ɒ',
  'ɔ',
  'ɔː',
  'o',
  'oː',
  'ʊ',
  'ʊː',
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
    // Remove common IPA delimiters and punctuation
    .replace(/[\/\[\]{}()]/g, '')
    .replace(/[ˈˌ.]/g, '')
    // Normalize ASCII length marker ':' to IPA length mark 'ː'
    .replace(/:/g, 'ː')
      // Defensive: explicitly normalize dental diacritics (t̪/d̪) to plain t/d
      // (these combining marks are stripped below anyway, but this avoids any accidental remaps)
      .replace(/t\u032A/g, 't')
      .replace(/d\u032A/g, 'd')
    // Normalize tie bars (t͡ʃ, d͡ʒ) and remove them
    .replace(/[\u035C\u0361]+/g, '\u0361')
    .replace(/t\u0361ʃ/g, 'tʃ')
    .replace(/d\u0361ʒ/g, 'dʒ')
    .replace(/\u0361/g, '')
    // Strip remaining combining marks (e.g., dental sign ◌̪)
    .replace(/[\u0300-\u036F]+/g, '')
    // Map Sinhala/Vedda-specific IPA letters to closest supported set
    .replace(/ʈ/g, 't')
    .replace(/ɖ/g, 'd')
    .replace(/[ɳɲ]/g, 'n')
    .replace(/ɭ/g, 'l')
    .replace(/ʋ/g, 'v')
    .replace(/ʂ/g, 'ʃ')
    .replace(/[ɾɽ]/g, 'r')
    .replace(/ɐ/g, 'ə')
    // Fix common Sinhala/Vedda IPA generator patterns
    .replace(/aaː/g, 'aː')
    .replace(/iiː/g, 'iː')
    .replace(/eeː/g, 'eː')
    .replace(/ooː/g, 'oː')
    .replace(/uuː/g, 'uː')
    .replace(/ææː/g, 'æː')
    // Sinhala/Vedda IPA generator often emits consonant + inherent 'a' followed by a vowel sign
    // (because consonants are mapped like ක->ka and vowel signs like ැ->æ).
    // Example: කැ -> kaæ (should be kæ), කෘ -> karu (should be kru).
    // Remove ONLY the unwanted inherent 'a' when a vowel/vowel-sign sequence follows.
    .replace(
      /((?:tʃ|dʒ|[pbtdkgɡmnŋnlrɹjwvfszʃʒh]|c|ɟ)(?:ʰ)?)(?:a)(?=(?:aː|æː|æ|iː|i|uː|u|eː|e|oː|o|ɔː|ɔ|əː|ə|ɪː|ɪ|ʊː|ʊ|ɜː|ɜ|ɚ|ai|au|r(?:uː|u)|l(?:uː|u)))/g,
      '$1'
    )
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

// Map our "CC Base" viseme target names to common morph-target naming schemes
// (e.g., OVR/Rhubarb-style visemes: sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, ih, oh, ou)
const MORPH_TARGET_ALIASES = {
  // CC Base → OVR/Rhubarb
  Ah: ['aa'],
  AE: ['E'],
  EE: ['ih', 'E'],
  Ih: ['ih', 'E'],
  Er: ['RR'],
  Oh: ['oh'],
  WOO: ['ou'],

  BMP: ['PP'],
  FV: ['FF'],
  Th: ['TH'],
  TLDN: ['DD', 'nn'],
  SZ: ['SS'],
  ChJ: ['CH'],
  KGHNG: ['kk'],
  R: ['RR'],

  // Pause/silence
  _pause: ['sil'],
};

function expandMorphTargets(shapeNames) {
  const expanded = [];
  for (const name of shapeNames || []) {
    if (!name) continue;
    expanded.push(name);
    const aliases = MORPH_TARGET_ALIASES[name];
    if (aliases && aliases.length) {
      expanded.push(...aliases);
    }
  }
  // de-dupe while preserving order (case-insensitive)
  const seen = new Set();
  return expanded.filter((n) => {
    const key = n.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Helper function to find best matching morph target
export function findBestMorphMatch(shapeNames, availableMorphs) {
  if (!availableMorphs || availableMorphs.length === 0) return null;

  const candidates = expandMorphTargets(shapeNames);

  // 1) Case-insensitive exact match (preferred)
  for (const candidate of candidates) {
    const exactMatch = availableMorphs.find(
      (m) => m.toLowerCase() === candidate.toLowerCase(),
    );
    if (exactMatch) return exactMatch;
  }

  // 2) Partial match with a simple score (avoid returning the first weak match)
  let best = null;
  let bestScore = -1;
  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    for (const m of availableMorphs) {
      const mm = m.toLowerCase();
      const includes = mm.includes(c) || c.includes(mm);
      if (!includes) continue;

      // Prefer longer, more specific matches and closer lengths
      const score = Math.min(mm.length, c.length) * 10 - Math.abs(mm.length - c.length);
      if (score > bestScore) {
        bestScore = score;
        best = m;
      }
    }
  }

  return best;
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
    'a': 'ah',
    'æ': 'ae',
    'æː': 'aae',
    'ɛ': 'eh',
    'ɛː': 'eh',
    'e': 'eh',
    'eː': 'eh',
    'ɪ': 'ih',
    'i': 'ee',
    'iː': 'ee',
    'ɔ': 'aw',
    'ɔː': 'aw',
    'o': 'oh',
    'oː': 'oo',
    'u': 'oo',
    'uː': 'oo',
    'ʊ': 'u',
    'ʊː': 'uu',
    'ə': 'a',
    'əː': 'aa',
    'ɜ': 'er',
    'ɚ': 'er',
    'ɜː': 'er',

    // Long vowel tokens (so we don't leak "ː" into TTS text)
    'aː': 'aa',
    'ɪː': 'ee',

    // Diphthongs
    'aɪ': 'ai',
    'aʊ': 'au',
    'ɔɪ': 'oy',
    'eɪ': 'ei',
    'oʊ': 'ou',

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
    'ʰ': 'h',
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

  // Build per-word tokens by concatenating syllable chunks.
  // This avoids spaced letters (which triggers spelling), and usually sounds more like a word.
  const words = [];
  let currentSyllables = [];
  let consonantBuffer = '';

  const flushWord = () => {
    if (consonantBuffer) {
      currentSyllables.push(consonantBuffer);
      consonantBuffer = '';
    }
    const w = currentSyllables.filter(Boolean).join('');
    if (w) words.push(w);
    currentSyllables = [];
  };

  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index];

    if (token === '_pause') {
      flushWord();
      continue;
    }

    if (token === ':' || token === 'ː') {
      continue;
    }

    const mapped = ipaToEnglish[token];
    const safeToken = mapped
      ? mapped
      : (/^[\x20-\x7E]+$/.test(token) ? token : '');

    if (!safeToken) {
      continue;
    }

    if (isIpaVowel(token)) {
      currentSyllables.push((consonantBuffer + safeToken).trim());
      consonantBuffer = '';
    } else {
      consonantBuffer += safeToken;
    }

    // Gemination boundary: end the current consonant cluster as its own syllable chunk
    // so TTS doesn't swallow it (still stays within the same word via hyphens).
    if (isGeminateBoundary(tokens, index)) {
      if (consonantBuffer) {
        currentSyllables.push(consonantBuffer);
        consonantBuffer = '';
      }
    }
  }

  flushWord();

  let result = words
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Keep TTS input ASCII-only (prevents some voices from cutting off early)
    .replace(/[^\x20-\x7E]/g, '')
    // Avoid extreme vowel runs like "aaaa" which can confuse pronunciation
    .replace(/([aeiou])\1{2,}/gi, '$1$1')
    // Fix double 'j' which TTS often mispronounces. 'dj' forces the correct hard 'j' sound (e.g. "podja")
    .replace(/jj/gi, 'dj')
    .replace(/\s+/g, ' ')
    .trim();

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

// Very lightweight Sinhala-to-Latin approximation for browser TTS fallback.
// This is NOT a full transliteration system; it aims to produce a pronounceable Latin string
// when the platform lacks Sinhala (si-*) voices.
export function sinhalaToLatinApprox(text) {
  if (!text) return '';

  const independentVowels = {
    'අ': 'a', 'ආ': 'aa', 'ඇ': 'ae', 'ඈ': 'aae', 'ඉ': 'i', 'ඊ': 'ii',
    'උ': 'u', 'ඌ': 'uu', 'එ': 'e', 'ඒ': 'ee', 'ඔ': 'o', 'ඕ': 'oo',
    'ඓ': 'ai', 'ඖ': 'au',
  };

  const consonants = {
    'ක': 'k', 'ඛ': 'kh', 'ග': 'g', 'ඝ': 'gh', 'ඞ': 'ng',
    'ච': 'ch', 'ඡ': 'chh', 'ජ': 'j', 'ඣ': 'jh', 'ඤ': 'gn',
    'ට': 't', 'ඨ': 'th', 'ඩ': 'd', 'ඪ': 'dh', 'ණ': 'n',
    'ත': 't', 'ථ': 'th', 'ද': 'd', 'ධ': 'dh', 'න': 'n',
    'ප': 'p', 'ඵ': 'ph', 'බ': 'b', 'භ': 'bh', 'ම': 'm',
    'ය': 'y', 'ර': 'r', 'ල': 'l', 'ව': 'w',
    'ශ': 'sh', 'ෂ': 'sh', 'ස': 's', 'හ': 'h', 'ළ': 'l', 'ෆ': 'f',
    'ඟ': 'ng', 'ඥ': 'gn',
  };

  const vowelSigns = {
    'ා': 'aa', 'ැ': 'ae', 'ෑ': 'aae', 'ි': 'i', 'ී': 'ii', 'ු': 'u', 'ූ': 'uu',
    'ෙ': 'e', 'ේ': 'ee', 'ො': 'o', 'ෝ': 'oo', 'ෛ': 'ai', 'ෞ': 'au',
  };

  const output = [];
  let lastInherentVowelIndex = -1;

  for (const ch of text) {
    if (ch === '්') {
      // Virama: remove inherent vowel if present
      if (lastInherentVowelIndex >= 0 && output[lastInherentVowelIndex] === 'a') {
        output.splice(lastInherentVowelIndex, 1);
      }
      lastInherentVowelIndex = -1;
      continue;
    }

    if (ch === 'ං') {
      output.push('ng');
      lastInherentVowelIndex = -1;
      continue;
    }

    if (ch === 'ඃ') {
      output.push('h');
      lastInherentVowelIndex = -1;
      continue;
    }

    const sign = vowelSigns[ch];
    if (sign) {
      // Replace inherent 'a' if we just emitted a consonant
      if (lastInherentVowelIndex >= 0 && output[lastInherentVowelIndex] === 'a') {
        output[lastInherentVowelIndex] = sign;
      } else {
        output.push(sign);
      }
      lastInherentVowelIndex = -1;
      continue;
    }

    const v = independentVowels[ch];
    if (v) {
      output.push(v);
      lastInherentVowelIndex = -1;
      continue;
    }

    const c = consonants[ch];
    if (c) {
      output.push(c);
      output.push('a');
      lastInherentVowelIndex = output.length - 1;
      continue;
    }

    if (ch === ' ' || ch === '\t' || ch === '\n') {
      output.push(' ');
      lastInherentVowelIndex = -1;
      continue;
    }

    // Fallback: keep ASCII letters/digits/punct, drop other unknowns
    if (/^[\x20-\x7E]$/.test(ch)) {
      output.push(ch);
    }
    lastInherentVowelIndex = -1;
  }

  return output
    .join('')
    .replace(/\s+/g, ' ')
    .replace(/\s([,.!?;:])/g, '$1')
    .trim();
}