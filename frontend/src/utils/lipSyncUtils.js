// IPA to Viseme mapping for accurate pronunciation animation
export const ipaToViseme = {
  // Vowels
  'a': { primary: ['mouthOpen', 'jaw_open', 'A', 'aa'], secondary: [], weight: 0.9, duration: 140 }, // generic a
  'ɑ': { primary: ['mouthOpen', 'jaw_open', 'A', 'aa'], secondary: [], weight: 0.95, duration: 150 }, // lot, father
  'æ': { primary: ['mouthOpen', 'A', 'aa'], secondary: ['mouthSmile'], weight: 0.85, secondaryWeight: 0.3, duration: 140 }, // cat, trap
  'ʌ': { primary: ['mouthOpen', 'A'], secondary: [], weight: 0.7, duration: 130 }, // cup, strut
  'ɔ': { primary: ['O', 'oh', 'mouthO', 'mouth_round'], secondary: ['mouthOpen'], weight: 0.85, secondaryWeight: 0.3, duration: 150 }, // thought
  'ɒ': { primary: ['O', 'oh', 'mouthO'], secondary: ['mouthOpen'], weight: 0.8, secondaryWeight: 0.4, duration: 140 }, // not (British)
  'o': { primary: ['O', 'oh', 'mouthO'], secondary: [], weight: 0.85, duration: 145 }, // generic o
  
  'ə': { primary: ['mouthOpen', 'A'], secondary: [], weight: 0.4, duration: 100 }, // schwa - about
  'ɜ': { primary: ['O', 'mouthO'], secondary: ['mouthOpen'], weight: 0.6, secondaryWeight: 0.3, duration: 140 }, // bird, nurse
  'ɚ': { primary: ['O', 'mouthO'], secondary: ['mouthOpen'], weight: 0.5, secondaryWeight: 0.2, duration: 120 }, // butter
  
  'i': { primary: ['I', 'ee', 'mouthSmile'], secondary: [], weight: 0.85, duration: 140 }, // fleece, see
  'ɪ': { primary: ['I', 'ih', 'mouthSmile'], secondary: [], weight: 0.7, duration: 120 }, // kit, bit
  'u': { primary: ['U', 'oo', 'mouthFunnel', 'mouthPucker'], secondary: [], weight: 0.9, duration: 150 }, // goose, boot
  'ʊ': { primary: ['U', 'uh', 'mouthFunnel'], secondary: [], weight: 0.7, duration: 120 }, // foot, put
  'e': { primary: ['E', 'eh', 'mouthSmile'], secondary: ['mouthOpen'], weight: 0.75, secondaryWeight: 0.3, duration: 140 }, // face
  'ɛ': { primary: ['E', 'eh'], secondary: ['mouthOpen'], weight: 0.7, secondaryWeight: 0.4, duration: 130 }, // dress, bed
  
  // Diphthongs
  'aɪ': { primary: ['mouthOpen', 'A'], secondary: ['I', 'mouthSmile'], weight: 0.85, secondaryWeight: 0.7, duration: 180 }, // price, fly
  'aʊ': { primary: ['mouthOpen', 'A'], secondary: ['U', 'mouthFunnel'], weight: 0.85, secondaryWeight: 0.7, duration: 180 }, // mouth, now
  'ɔɪ': { primary: ['O', 'mouthO'], secondary: ['I', 'mouthSmile'], weight: 0.8, secondaryWeight: 0.7, duration: 180 }, // choice, boy
  'eɪ': { primary: ['E', 'eh'], secondary: ['I', 'mouthSmile'], weight: 0.75, secondaryWeight: 0.7, duration: 170 }, // face, day
  'oʊ': { primary: ['O', 'oh'], secondary: ['U', 'mouthFunnel'], weight: 0.8, secondaryWeight: 0.7, duration: 170 }, // goat, go
  
  // Consonants - Bilabials
  'p': { primary: ['mouthPress', 'mouth_closed', 'PP', 'p'], secondary: [], weight: 1.0, duration: 100 },
  'b': { primary: ['mouthPress', 'mouth_closed', 'PP', 'p'], secondary: [], weight: 1.0, duration: 110 },
  'm': { primary: ['mouthPress', 'mouth_closed', 'PP', 'p'], secondary: [], weight: 1.0, duration: 140 },
  
  // Labiodentals
  'f': { primary: ['FF', 'f', 'mouthLowerDown'], secondary: ['mouthUpperUp'], weight: 0.75, duration: 120 },
  'v': { primary: ['FF', 'f', 'mouthLowerDown'], secondary: ['mouthUpperUp'], weight: 0.75, duration: 130 },
  
  // Dental/Interdental
  'θ': { primary: ['TH', 'th', 'mouthOpen'], secondary: [], weight: 0.6, duration: 130 }, // thin
  'ð': { primary: ['TH', 'th', 'mouthOpen'], secondary: [], weight: 0.6, duration: 130 }, // this
  
  // Alveolar
  't': { primary: ['DD', 't', 'mouthOpen'], secondary: [], weight: 0.5, duration: 90 },
  'd': { primary: ['DD', 't', 'mouthOpen'], secondary: [], weight: 0.5, duration: 100 },
  'n': { primary: ['DD', 'NN', 'mouthOpen'], secondary: [], weight: 0.5, duration: 130 },
  's': { primary: ['SS', 's', 'mouthSmile'], secondary: ['mouthShrugUpper'], weight: 0.6, secondaryWeight: 0.25, duration: 130 },
  'z': { primary: ['SS', 's', 'mouthSmile'], secondary: ['mouthShrugUpper'], weight: 0.6, secondaryWeight: 0.25, duration: 130 },
  'l': { primary: ['DD', 'TH', 'mouthOpen'], secondary: [], weight: 0.5, duration: 120 },
  
  // Post-alveolar
  'ʃ': { primary: ['CH', 'SH', 'sh', 'mouthFunnel'], secondary: [], weight: 0.75, duration: 140 }, // ship
  'ʒ': { primary: ['CH', 'SH', 'sh', 'mouthFunnel'], secondary: [], weight: 0.75, duration: 140 }, // measure
  'tʃ': { primary: ['CH', 'ch', 'mouthSmile'], secondary: ['mouthFunnel'], weight: 0.75, secondaryWeight: 0.4, duration: 140 }, // chin
  'dʒ': { primary: ['CH', 'ch', 'mouthSmile'], secondary: ['mouthFunnel'], weight: 0.75, secondaryWeight: 0.4, duration: 140 }, // judge
  'r': { primary: ['RR', 'r', 'mouthOpen'], secondary: ['mouthFunnel'], weight: 0.65, secondaryWeight: 0.25, duration: 120 },
  
  // Palatal
  'j': { primary: ['I', 'CH', 'mouthSmile'], secondary: [], weight: 0.65, duration: 100 }, // yes
  'c': { primary: ['kk', 'K', 'mouthOpen'], secondary: [], weight: 0.6, duration: 100 }, // palatal stop
  'ɟ': { primary: ['kk', 'K', 'mouthOpen'], secondary: [], weight: 0.6, duration: 110 }, // voiced palatal stop
  
  // Velar
  'k': { primary: ['kk', 'K', 'mouthOpen'], secondary: [], weight: 0.6, duration: 100 },
  'g': { primary: ['kk', 'K', 'mouthOpen'], secondary: [], weight: 0.6, duration: 110 },
  'ŋ': { primary: ['kk', 'NN', 'mouthOpen'], secondary: [], weight: 0.5, duration: 140 }, // sing
  
  // Glottal
  'h': { primary: ['mouthOpen', 'A'], secondary: [], weight: 0.35, duration: 90 },
  'ʔ': { primary: ['mouthPress', 'mouth_closed'], secondary: [], weight: 0.3, duration: 60 }, // glottal stop
  
  // Diacritics
  'ʰ': { primary: ['mouthOpen'], secondary: [], weight: 0.25, duration: 50 }, // aspiration marker (brief breath release)
  
  // Approximants
  'w': { primary: ['U', 'W', 'mouthFunnel', 'mouthPucker'], secondary: [], weight: 0.85, duration: 130 },
  'ɹ': { primary: ['RR', 'r', 'mouthOpen'], secondary: ['mouthFunnel'], weight: 0.65, secondaryWeight: 0.25, duration: 120 }, // American r
  'y': { primary: ['I', 'ee', 'mouthSmile'], secondary: [], weight: 0.8, duration: 100 }, // close front rounded vowel (as in French "tu")
  
  // Additional vowels with length markers
  'aː': { primary: ['mouthOpen', 'jaw_open', 'A', 'aa'], secondary: [], weight: 0.95, duration: 200 }, // long a
  'iː': { primary: ['I', 'ee', 'mouthSmile'], secondary: [], weight: 0.9, duration: 200 }, // long i
  'uː': { primary: ['U', 'oo', 'mouthFunnel', 'mouthPucker'], secondary: [], weight: 0.95, duration: 200 }, // long u
  'oː': { primary: ['O', 'oh', 'mouthO'], secondary: [], weight: 0.9, duration: 200 }, // long o
  'eː': { primary: ['E', 'eh', 'mouthSmile'], secondary: [], weight: 0.8, duration: 200 }, // long e
  
  // Silence/pause
  '_pause': { primary: ['mouthOpen'], secondary: [], weight: 0.1, duration: 80 },
};

// Legacy simple phoneme mapping (for backward compatibility)
export const phonemeToViseme = {
  // Vowels - open mouth shapes
  'a': { primary: ['mouthOpen', 'jaw_open', 'mouth_open', 'A', 'aa', 'ah'], secondary: [], weight: 0.9 },
  'e': { primary: ['E', 'ee', 'eh', 'mouthSmile'], secondary: ['mouthOpen'], weight: 0.7, secondaryWeight: 0.3 },
  'i': { primary: ['I', 'ih', 'ee', 'mouthSmile'], secondary: [], weight: 0.8 },
  'o': { primary: ['O', 'oh', 'mouthO', 'mouth_round'], secondary: ['mouthFunnel'], weight: 0.85 },
  'u': { primary: ['U', 'uh', 'oo', 'mouthFunnel', 'mouthPucker'], secondary: [], weight: 0.8 },
  
  // Consonants - bilabials (lips together)
  'p': { primary: ['mouthPress', 'mouth_closed', 'PP', 'p'], secondary: [], weight: 1.0, duration: 120 },
  'b': { primary: ['mouthPress', 'mouth_closed', 'PP', 'p'], secondary: [], weight: 1.0, duration: 120 },
  'm': { primary: ['mouthPress', 'mouth_closed', 'PP', 'p'], secondary: [], weight: 1.0, duration: 150 },
  
  // Labiodentals (lip to teeth)
  'f': { primary: ['FF', 'f', 'mouthLowerDown'], secondary: ['mouthUpperUp'], weight: 0.7, duration: 130 },
  'v': { primary: ['FF', 'f', 'mouthLowerDown'], secondary: ['mouthUpperUp'], weight: 0.7, duration: 130 },
  
  // Dental/alveolar
  's': { primary: ['SS', 's', 'mouthSmile'], secondary: ['mouthShrugUpper'], weight: 0.6, secondaryWeight: 0.3, duration: 140 },
  'z': { primary: ['SS', 's', 'mouthSmile'], secondary: ['mouthShrugUpper'], weight: 0.6, duration: 140 },
  't': { primary: ['DD', 't', 'mouthOpen'], secondary: [], weight: 0.5, duration: 100 },
  'd': { primary: ['DD', 't', 'mouthOpen'], secondary: [], weight: 0.5, duration: 100 },
  'n': { primary: ['DD', 'NN', 'mouthOpen'], secondary: [], weight: 0.4, duration: 120 },
  'l': { primary: ['DD', 'TH', 'mouthOpen'], secondary: [], weight: 0.5, duration: 120 },
  
  // Other consonants
  'r': { primary: ['RR', 'r', 'mouthOpen'], secondary: ['mouthFunnel'], weight: 0.6, secondaryWeight: 0.2, duration: 130 },
  'w': { primary: ['U', 'W', 'mouthFunnel', 'mouthPucker'], secondary: [], weight: 0.8, duration: 140 },
  'y': { primary: ['I', 'CH', 'mouthSmile'], secondary: [], weight: 0.6, duration: 110 },
  'h': { primary: ['mouthOpen', 'A'], secondary: [], weight: 0.3, duration: 100 },
  'k': { primary: ['kk', 'K', 'mouthOpen'], secondary: [], weight: 0.6, duration: 110 },
  'g': { primary: ['kk', 'K', 'mouthOpen'], secondary: [], weight: 0.6, duration: 110 },
  'th': { primary: ['TH', 'th', 'mouthOpen'], secondary: [], weight: 0.5, duration: 120 },
  'ch': { primary: ['CH', 'ch', 'mouthSmile'], secondary: ['mouthFunnel'], weight: 0.7, duration: 130 },
  'sh': { primary: ['CH', 'SH', 'sh', 'mouthFunnel'], secondary: [], weight: 0.7, duration: 140 },
};

export const findBestMorphMatch = (shapeNames, availableMorphs) => {
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
};

export const textToPhonemes = (text) => {
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
};

// Parse IPA transcription to phonemes for accurate animation
export const ipaToPhonemes = (ipaString) => {
  if (!ipaString) return [];
  
  const phonemes = [];
  let i = 0;
  
  // Remove stress markers and syllable breaks
  const cleaned = ipaString.replace(/[ˈˌ.]/g, '');
  
  while (i < cleaned.length) {
    let matched = false;
    
    // Try to match multi-character IPA symbols first (longest match first)
    const multiChar = ['tʃ', 'dʒ', 'aɪ', 'aʊ', 'ɔɪ', 'eɪ', 'oʊ', 'aː', 'iː', 'uː', 'oː', 'eː'];
    for (const symbol of multiChar) {
      if (cleaned.substr(i, symbol.length) === symbol) {
        phonemes.push(symbol);
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
        i++;
      } else if (char === ':' || char === 'ː') {
        // Length marker - extend the previous phoneme duration
        if (phonemes.length > 0) {
          // Already handled by long vowel variants
        }
        i++;
      } else if (char === ' ' || char === '-') {
        // Space or hyphen - treat as pause
        phonemes.push('_pause');
        i++;
      } else {
        // Unknown IPA symbol, use neutral mouth position
        console.warn(`Unknown IPA symbol: ${char} (code: ${char.charCodeAt(0)})`);
        // Use schwa as fallback for vowel-like sounds
        phonemes.push('ə');
        i++;
      }
    }
  }
  
  return phonemes;
};
