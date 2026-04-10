import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
try:
    import eng_to_ipa as ipa
    IPA_AVAILABLE = True
except ImportError:
    IPA_AVAILABLE = False

try:
    from sinling import SinhalaTokenizer
    SINLING_AVAILABLE = True
    sinhala_tokenizer = SinhalaTokenizer()
except ImportError:
    SINLING_AVAILABLE = False
    sinhala_tokenizer = None


class VeddaTranslator:
    def __init__(self, dictionary_service_url, history_service_url, google_translate_url):
        self.dictionary_service_url = dictionary_service_url
        self.history_service_url = history_service_url
        self.google_translate_url = google_translate_url

        # IGNORE RULES LIST - Sinhala words that should NOT be translated
        # These words will be passed through without translation attempt
        # Format: Sinhala word → (vedda equivalent or keep as-is)
        self.sinhala_ignore_list = {
            'එකට': 'එකට',           # together (keep as-is, no Vedda translation needed)
            'විට': 'විට', 
            'යට': 'යට',
            'මෙන්': 'මෙන්', 
            'යනු': 'යනු',
            'බලා': 'බලා'
            # Add more words here in the format: 'sinhala_word': 'vedda_or_original'
        }

        # Create persistent session for connection pooling
        self.session = requests.Session()
        
        # Configure connection pooling with retry strategy
        retry_strategy = Retry(
            total=2,
            status_forcelist=[429, 500, 502, 503, 504],
            backoff_factor=0.1
        )
        adapter = HTTPAdapter(
            pool_connections=10,
            pool_maxsize=20,
            max_retries=retry_strategy
        )
        self.session.mount('http://', adapter)
        self.session.mount('https://', adapter)
        
        # Pre-warm connections to services
        self._prewarm_connections()
        
        self.supported_languages = {
            'vedda': 'vedda',
            'sinhala': 'si',
            'english': 'en',
            'tamil': 'ta',
            'hindi': 'hi',
            'chinese': 'zh',
            'japanese': 'ja',
            'korean': 'ko',
            'french': 'fr',
            'german': 'de',
            'spanish': 'es',
            'italian': 'it',
            'portuguese': 'pt',
            'russian': 'ru',
            'arabic': 'ar',
            'dutch': 'nl',
            'swedish': 'sv',
            'norwegian': 'no',
            'danish': 'da',
            'finnish': 'fi',
            'polish': 'pl',
            'czech': 'cs',
            'hungarian': 'hu',
            'thai': 'th',
            'vietnamese': 'vi',
            'indonesian': 'id',
            'malay': 'ms',
            'turkish': 'tr',
            'hebrew': 'he',
            'greek': 'el',
            'bulgarian': 'bg',
            'romanian': 'ro',
            'ukrainian': 'uk',
            'croatian': 'hr',
            'serbian': 'sr',
            'slovak': 'sk',
            'slovenian': 'sl',
            'latvian': 'lv',
            'lithuanian': 'lt',
            'estonian': 'et'
        }

    def _is_ignored_word(self, word):
        """
        Check if word is in the ignore list.
        Returns (is_ignored, translation) tuple.
        If ignored: (True, vedda_translation_or_word)
        If not ignored: (False, None)
        """
        if word in self.sinhala_ignore_list:
            return True, self.sinhala_ignore_list[word]
        return False, None

    def _extract_verb_suffix(self, word):
        """
        Extract verb suffix from Sinhala word while preserving it.
        Returns tuple (base_word, suffix) where suffix is what should be preserved.

        Usage:
            දඩයම් කිරීමට → (දඩයම් කිරීම, ට)
            දඩයම් කරනවා → (දඩයම් කරන, වා)
        """
        if not word:
            return word, ''

        # Common verb suffixes that should be preserved (longest first, but ට is HIGHEST PRIORITY)
        preservable_suffixes = [
            'ට',       # ❌ HIGHEST PRIORITY: Any word ending in ට gets extracted
                        # Examples: මුවන්ට, දඩයම් කිරීමට, ඕනෑ ඕනෑ ට
            'ගේ',      # possessive/dative
            'ෙන්',     # instrumental
            'ගෙන්',    # instrumental (with)
            'තින්',    # with/by means of
            'දී',      # location/time
            'දීම',     # action noun
            'ලයි',     # completed
            'ලා',      # having done
            'නවා',     # continuous present
            'වා',      # past/completed
            'ශි',      # honorific
            'සලු',     # together
        ]

        for suffix in preservable_suffixes:
            if len(word) > len(suffix) and word.endswith(suffix):
                base = word[:-len(suffix)]
                return base, suffix

        return word, ''

    def _is_ignored_word(self, word):
        """
        Check if word is in the ignore list.
        Returns (is_ignored, translation) tuple.
        If ignored: (True, vedda_translation_or_word)
        If not ignored: (False, None)
        """
        if word in self.sinhala_ignore_list:
            return True, self.sinhala_ignore_list[word]
        return False, None

    def _generate_sinhala_normalization_candidates(self, word):
        """Generate likely Sinhala base-form candidates for inflected Sinhala words."""
        if not word:
            return []

        # Ordered longest-first to avoid partial stripping before specific forms.
        suffix_rules = [
            # ===== SINHALA PLURAL & NOUN FORM NORMALIZATION (longest first) =====
            # These convert plural/variant noun forms to singular base forms
            # Examples:
            #   බළලුන් (plural cats) → බළලා (singular cat)
            #   දරුවුන් (plural children) → දරුවා (singular child)
            #   ගෝලු (plural spheres) → ගෝලය (singular sphere)
            ('ුන්', 'ා'),      # Plural suffix → singular marker: බළලුන් → බළලා
            ('වුන්', 'වා'),    # Plural variant: දරුවුන් → දරුවා
            ('ුවන්', 'ුවා'),   # Plural variant form

            # ===== NOUN DECLENSION & INFLECTION RULES (longest first) =====
            # These normalize noun base forms that have markers or inflections
            # Examples:
            #   දඩයම් (with marker) → දඩයම (base form in dictionary)
            #   කලිම් (with marker) → කලිම (base form)
            ('ම්', 'ම'),      # Remove halant/marker from nouns - දඩයම් → දඩයම
            ('ය්', 'ය'),      # Remove halant from nouns - කලිය් → කලිය

            # ===== VERB CONJUGATION SUFFIXES =====
            # Vedda doesn't use Sinhala person-based verb conjugations
            # All forms should normalize to base form (verb root + න or නවා)

            # Verb suffix preservation rules (longest first)
            # These extract the base verb form while preserving suffixes
            # Examples:
            #   දඩයම් කිරීමට → දඩයම් කිරීම + ට (suffix preserved as separate word)
            #   දඩයම් කරනවා → දඩයම් කරන + වා (suffix preserved)
            #   ගිහි ගේ → ගිහි + ගේ (suffix preserved)
            ('නවාට', 'නවා ට'),   
            ('නවාගේ', 'නවා ගේ'),  
            ('නවාදී', 'නවා දී'),   
            ('নවාලයි', 'නවා ලයි'),  
            ('නවාලා', 'නවා ලා'),   
            ('තිබ්බටට', 'තිබ්බ ට'),  # was + dative
            ('තිබ්බගේ', 'තිබ්බ ගේ'), # was + possessive
            ('කරනු ඇතිවා', 'කරන ු ඇතිවා'), # will do

            # Infinitive noun form normalization
            # These handle නම infinitive noun forms (කිරීම) which need base form (කරන්න)
            # The pattern: remove ිරීම and replace with nothing, leaving the root verb
            ('ිරීම', ''),  # infinitive noun marker - උයිම → උයි, කිරීම → ක, ගිහිම → ගි

            # Past tense forms (longest first)
            # Strip suffixes to get past root, then verb_root_transformations will convert to present form
            ('ෙමුය', ''),       # we ate (formal) - කෑවෙමුය → කෑව → කනවා
            ('ෙවූය', ''),       # happened (formal)
            ('ෙරූ', ''),        # became (plural)
            ('ෝය', ''),         # formal past
            ('ේය', ''),         # they ate (formal) - කෑවේය → කෑව → කනවා
            ('ාය', ''),         # ate (formal) - කෑවාය → කෑව → කනවා
            ('ෙමු', ''),        # we ate - කෑවෙමු → කෑව → කනවා
            ('ෙව්', ''),        # happened
            ('ේම', ''),         # emphatic past
            ('ෙම', ''),         # variant past
            ('ෙව', ''),         # happened variant
            ('ො', ''),          # past marker
            ('ා', ''),          # past simple - කෑවා → කෑව → කනවා (but also used in nouns - handle carefully)

            # Present/Future tense person markers (longest first)
            ('මුද', 'නවා'),     # question form "do we?"
            ('මිද', 'නවා'),     # question form "do I?"
            ('තිද', 'නවා'),     # question form "do they?"
            ('මෝ', 'නවා'),      # hortative "let's" - කමෝ → කනවා
            ('මු', 'නවා'),       # we - කමු → කනවා
            ('මි', 'නවා'),       # I - කමි → කනවා
            ('ති', 'නවා'),       # they/you formal - කති → කනවා
            ('තු', 'නවා'),       # you plural
            ('ත්', 'නවා'),       # verb marker
            ('ම', 'නවා'),        # short form

            # Progressive/Continuous forms
            ('මින්', 'නවා'),    # progressive "while eating"
            ('නවාය', 'නවා'),    # formal present continuous
            ('නවා', 'නවා'),     # present continuous - already base form
            ('න්නේ', 'නවා'),    # emphatic present
            ('න්නෙ', 'නවා'),    # colloquial emphatic
            ('ද්දී', 'නවා'),    # while doing - කද්දී → කනවා

            # Perfect/Completed forms
            ('ලයි', 'නවා'),     # completed action
            ('ලූ', 'නවා'),      # completed plural
            ('ලා', 'නවා'),      # having done - කාලා → කනවා
            ('ල', 'නවා'),       # completed

            # Infinitive and other verb forms
            ('න්නට', 'නවා'),    # "in order to do"
            ('න්න', 'නවා'),     # infinitive "to do" - කන්න → කනවා
            ('නු', 'නවා'),       # future/habitual marker

            # Imperative forms
            ('මින්', 'නවා'),    # polite command
            ('න්', 'නවා'),      # base imperative

            # Negative verb forms
            ('ත් නැහැ', 'නවා'), # doesn't (with space - rare in single word)
            ('නෙ', 'නවා'),      # negative colloquial

            # Other verb markers
            ('යි', ''),          # copula "is/are" - can be removed
            ('වා', 'නවා'),      # past/action marker
            ('යෙ', 'නවා'),      # informal past
            ('ආ', 'නවා'),       # came/went past marker

            # ===== POSSESSIVE/GENITIVE CASE MARKERS =====
            # These normalize possessive forms to base noun forms in dictionary
            # Examples: කැලේ → කැලය or කැල; පැලේ → පැලය or පැල
            # (Dictionary has base forms like: කැලය, පැලය, කුඹුර, රට, etc.)

            # Generate candidates for both with-ය and without-ය base forms
            # They're handled by expansion rules below: ('ේ', 'ය') and existing ('ේ', '')

            # ===== NOUN SUFFIXES (existing) =====
            ('වලටත්', ''),
            ('වලගෙ', ''),
            ('වලේදී', ''),
            ('වලදී', ''),
            ('වලෙහි', ''),
            ('වලහි', ''),
            ('වලේ', ''),
            ('වලෙ', ''),
            ('වලගෙන්', ''),
            ('වලින්', ''),
            ('වලට', ''),
            ('වලද', ''),
            ('වලම', ''),
            ('වලත්', ''),
            ('යන්ටත්', 'යා'),
            ('යන්ගේ', 'යා'),
            ('යන්ගෙන්', 'යා'),
            ('යන්වත්', 'යා'),
            ('යන්හි', 'යා'),
            ('යන්ට', 'යා'),
            ('යන්ව', 'යා'),
            ('යන්', 'යා'),
            ('වරුන්ගේ', 'වරු'),
            ('වරුන්', 'වරු'),
            ('වරුට', 'වරු'),
            ('වරුගේ', 'වරු'),
            ('වරුහි', 'වරු'),
            ('වරු', ''),
            ('ලාගෙ', 'ලා'),
            ('ලාගෙන්', 'ලා'),
            ('ලාගේ', 'ලා'),
            ('ලාහි', 'ලා'),
            ('ලාට', 'ලා'),
            ('ලා', ''),
            ('ුන්ටත්', ''),
            ('ුන්ගේ', 'ුන්'),
            ('ුන්ගෙන්', ''),
            ('ුන්ගේ', ''),
            ('ුන්ට', ''),
            ('ුන්', ''),
            ('න්ටත්', ''),
            ('න්ගේ', 'න්'),
            ('න්ගෙන්', ''),
            ('න්ගේ', ''),
            ('න්ට', ''),
            ('යාගෙන්', 'යා'),
            ('යාගේ', 'යා'),
            ('යාට', 'යා'),
            ('යාව', 'යා'),
            ('යාහි', 'යා'),
            ('ගේදී', ''),
            ('ගේම', ''),
            ('ගෙන්ම', ''),
            ('කින්ම', 'ක'),
            ('ටමත්', ''),
            ('වත්', ''),
            ('ගැන', ''),
            ('සමඟ', ''),
            ('සමග', ''),
            ('ෙහි', ''),
            ('හි', ''),
            ('යෙහි', 'ය'),
            ('යේ', 'ය'),
            ('නු', 'න'),
            ('ගෙන්', ''),
            ('කින්', 'ක'),
            ('ෙන්', ''),
            ('ගේ', ''),
            ('ගෙ', ''),
            ('ටත්', ''),
            ('ටද', ''),
            ('ටම', ''),
            ('ට', ''),
            ('ෙකුගෙන්', 'ා'),
            ('ෙකුගේ', 'ා'),
            ('ෙකුටත්', 'ා'),
            ('ෙකුට', 'ා'),
            ('ෙකුද', 'ා'),
            ('ෙකුම', 'ා'),
            ('ෙකු', 'ා'),
            ('ෙක්', 'ා'),
            ('වල්', ''),
            ('වෝ', 'වා'),
            ('වන්', 'වා'),
            ('මේ', 'ම'),
            ('යේ', ''),
            ('යෝ', 'යා'),
            ('යන්', 'ය'),
            ('න්', 'ා'),
            ('ෝ', 'ා'),
            ('ේ', 'ය'),         # possessive ේ → ය: කැලේ→කැලය, පැලේ→පැලය
            ('ේ', ''),          # OR just remove ේ: කුඹුරේ→කුඹුර, රටේ→රට
            ('ී', 'ි'),
            ('ක්ද', ''),
            ('ක්ම', ''),
            ('කුත්', ''),
            ('කුගෙන්', ''),
            ('කුගේ', ''),
            ('කුට', ''),
            ('කු', ''),
            ('කි', ''),
            ('ක්', '')
        ]

        # Expansion rules for common plural/short-base -> dictionary base forms.
        ending_expansion_rules = [
            ('ි', 'ියා'),   # අලි -> අලියා
            ('ු', 'ුවා')    # fallback pattern for some animate nouns
        ]

        # Verb root vowel transformations (past tense → base form)
        # These handle cases where past tense changes the verb root vowel
        # Transform to FULL dictionary form (typically present continuous: verb + නවා)
        verb_root_transformations = [
            # ===== INFINITIVE NOUN → BASE FORM TRANSFORMATIONS =====
            # These handle infinitive noun forms (suffix ිරීම) which need to be normalized to base form
            # Usage: දඩයම් කිරීම → දඩයම් කරන්න (the base form that exists in dictionary)
            ('කිරීම', 'කරන්න'),     # infinitive noun to base infinitive (for "do")
            ('උයිම', 'උයනවා'),     # cooking infinitive noun
            ('ගිහිම', 'යනවා'),      # going infinitive noun
            ('දෙණීම', 'දෙනවා'),    # giving infinitive noun
            ('െයිම', 'ෙන්න'),       # infinitive noun to base infinitive (for "said")
            ('යිම', 'යන්න'),        # infinitive noun to base infinitive (for "go")

            # ===== CONJUGATED FORM → BASE FORM TRANSFORMATIONS =====
            # These handle verb conjugations that need to be converted to base form
            # Pattern: conjugated_form → base_form
            # Example: මුවන්ට (extract ට) → මුවන් → මුවා → කබරා ට
            ('මුවන්', 'මුවා'),       # conjugated form to base: මුවන් → මුවා (take/carry)
            ('ගිනුවන්', 'ගිනුවා'),   # conjugated form to base
            ('සිනුවන්', 'සිනුවා'),   # conjugated form to base
            ('පිනුවන්', 'පිනුවා'),   # conjugated form to base

            # ===== COMMON IRREGULAR VERB PATTERNS =====
            # (past root → present continuous form)
            ('කෑව', 'කනවා'),      # ate → eat: කෑවා/කෑවෙමු/කෑවේය → කනවා
            ('කා', 'කනවා'),        # eating → eat (also handles කාලා)
            ('ගිය', 'යනවා'),       # went → go
            ('ගිහි', 'යනවා'),      # went (variant) → go
            ('ආව', 'එනවා'),       # came → come
            ('ආ', 'එනවා'),         # came (short) → come
            ('ගත්ත', 'ගනවා'),     # took → take
            ('ගත්', 'ගනවා'),       # took (short) → take
            ('දුන්න', 'දෙනවා'),   # gave → give
            ('දුන්', 'දෙනවා'),     # gave (short) → give
            ('දී', 'දෙනවා'),       # gave (variant) → give
            ('හිටි', 'ඉන්නවා'),    # sat → sit/stay
            ('හිටිය', 'ඉන්නවා'),   # sat (variant) → sit/stay
            ('ඉඳි', 'ඉන්නවා'),     # sat (colloquial) → sit/stay
            ('බිව්ව', 'බොනවා'),    # drank → drink
            ('බීව', 'බොනවා'),      # drank variant → drink
            ('බී', 'බොනවා'),        # drank (short) → drink
            ('කීව', 'කියනවා'),     # said → say
            ('කී', 'කියනවා'),       # said (short) → say
            ('දැක්ක', 'දකිනවා'),  # saw → see
            ('දැක්', 'දකිනවා'),    # saw (short) → see
            ('බැලු', 'බලනවා'),      # looked → look
            ('බැලූ', 'බලනවා'),     # looked (variant) → look
            ('බැල', 'බලනවා'),      # looked (short) → look
            ('ඇහු', 'අහනවා'),       # heard/asked → hear/ask
            ('ඇසු', 'අහනවා'),       # heard/asked (variant) → hear/ask
            ('ඇහූ', 'අහනවා'),      # heard/asked (variant) → hear/ask
            ('හැදු', 'හදනවා'),     # made → make
            ('හැද', 'හදනවා'),      # made (short) → make
            ('පැන', 'පනිනවා'),     # jumped → jump
            ('ගහ', 'ගහනවා'),       # hit → hit
            ('ගැහු', 'ගහනවා'),      # hit (past) → hit
            ('ගැහූ', 'ගහනවා'),     # hit (variant) → hit
            ('උඩ', 'උඩනවා'),       # cooked → cook (උයනවා)
            ('උයා', 'උයනවා'),      # cooked → cook
            ('උයල', 'උයනවා'),      # having cooked → cook
            ('ලියා', 'ලියනවා'),    # wrote → write
            ('ලිව්', 'ලියනවා'),    # wrote (variant) → write
            ('ලිව', 'ලියනවා'),     # wrote (short) → write
            ('කළ', 'කරනවා'),        # did → do
            ('කරපු', 'කරනවා'),     # did (past participle) → do
            ('කළා', 'කරනවා'),      # did (past) → do
            ('කර', 'කරනවා'),        # do (imperative/short) → do
            ('වූ', 'වෙනවා'),        # became → become (වූවා → වෙනවා)
            ('වී', 'වෙනවා'),        # became (variant) → become
            ('වෙච්ච', 'වෙනවා'),    # happened (colloquial) → happen
            ('හැම', 'හමනවා'),      # turned → turn
            ('හැඹ', 'හඹනවා'),      # chased → chase
            ('වැඩ', 'වැඩනවා'),      # worked → work (වැඩකරනවා)
            ('වැඩ', 'වැඩනවා'),      # grew → grow
        ]

        queue = [(word, 0)]
        seen = {word}
        candidates = []
        max_depth = 2

        # Add punctuation-stripped variant as a normalization candidate seed.
        punctuation_trimmed = word.strip('.,!?;:"\'“”‘’()[]{}')
        if punctuation_trimmed and punctuation_trimmed != word:
            seen.add(punctuation_trimmed)
            candidates.append(punctuation_trimmed)
            queue.append((punctuation_trimmed, 0))

        while queue:
            current_word, depth = queue.pop(0)

            root_variants = []
            if len(current_word) > 1 and current_word.endswith('හ'):
                root_variants.append(current_word[:-1] + 'ස')
            if len(current_word) > 2 and current_word.endswith('ස්'):
                root_variants.append(current_word[:-2] + 'ස')

            # Apply verb root transformations for past→base conversion
            for past_form, base_form in verb_root_transformations:
                if current_word.startswith(past_form):
                    # Replace past root with base root, keeping any remaining suffix
                    remainder = current_word[len(past_form):]
                    transformed = base_form + remainder
                    if transformed not in seen:
                        root_variants.append(transformed)
                # Also try if the word ends with the past form
                if current_word.endswith(past_form):
                    # Replace past ending with base ending
                    prefix = current_word[:-len(past_form)]
                    transformed = prefix + base_form
                    if transformed not in seen and transformed != current_word:
                        root_variants.append(transformed)

            for ending, replacement in ending_expansion_rules:
                if len(current_word) > len(ending) and current_word.endswith(ending):
                    expanded = current_word[:-len(ending)] + replacement
                    if expanded not in seen:
                        root_variants.append(expanded)

            for root_variant in root_variants:
                if root_variant not in seen:
                    seen.add(root_variant)
                    candidates.append(root_variant)
                    if depth < max_depth:
                        queue.append((root_variant, depth + 1))

            if depth >= max_depth:
                continue

            for suffix, replacement in suffix_rules:
                if len(current_word) > len(suffix) and current_word.endswith(suffix):
                    candidate = current_word[:-len(suffix)] + replacement
                    if candidate and candidate not in seen and candidate != current_word:
                        seen.add(candidate)
                        candidates.append(candidate)
                        queue.append((candidate, depth + 1))

        return candidates

    def _batch_translate_sinhala_with_normalization(self, words, target_lang):
        """Batch translate Sinhala words with base-form normalization fallback."""
        exact_results = self.batch_translate_dictionary(words, 'sinhala', target_lang)

        unresolved_words = []
        for word in words:
            result = exact_results.get(word, {})
            if not result.get('found'):
                unresolved_words.append(word)

        if not unresolved_words:
            return exact_results

        variant_to_originals = {}
        variant_words = []
        for original_word in unresolved_words:
            for candidate in self._generate_sinhala_normalization_candidates(original_word):
                if candidate not in variant_to_originals:
                    variant_to_originals[candidate] = []
                    variant_words.append(candidate)
                variant_to_originals[candidate].append(original_word)

        if not variant_words:
            return exact_results

        variant_results = self.batch_translate_dictionary(variant_words, 'sinhala', target_lang)

        normalized_hits = 0
        for variant_word, variant_result in variant_results.items():
            if not variant_result.get('found'):
                continue

            for original_word in variant_to_originals.get(variant_word, []):
                original_result = exact_results.get(original_word, {})
                if original_result.get('found'):
                    continue

                exact_results[original_word] = {
                    'found': True,
                    'translation': variant_result.get('translation', original_word),
                    'normalized_from': variant_word
                }
                normalized_hits += 1

        if normalized_hits > 0:
            print(f"[TRANSLATE] Sinhala normalization fallback matched {normalized_hits} inflected word(s)")

        return exact_results
    
    def _prewarm_connections(self):
        """Pre-establish connections to frequently used services for faster first request"""
        try:
            # Pre-warm dictionary service connection
            self.session.get(
                f"{self.dictionary_service_url}/stats",
                timeout=0.5
            )
            print("[PERF] Dictionary service connection pre-warmed")
        except Exception as e:
            print(f"[PERF] Pre-warm failed (service may not be ready): {e}")
    
    def generate_english_ipa(self, text):
        """Generate IPA pronunciation for English text"""
        if not IPA_AVAILABLE or not text:
            return ''
        try:
            return ipa.convert(text)
        except Exception as e:
            return ''
    
    def generate_vedda_sinhala_ipa(self, text):
        """Generate IPA phonetic representation for Vedda/Sinhala text"""
        if not SINLING_AVAILABLE or not text:
            return ''
        try:
            # IPA phonetic mapping for Sinhala/Vedda script
            sinhala_to_ipa = {
                # Vowels
                'අ': 'ə', 'ආ': 'aː', 'ඇ': 'æ', 'ඈ': 'æː', 'ඉ': 'i', 'ඊ': 'iː', 'උ': 'u', 'ඌ': 'uː',
                'ඍ': 'ru', 'ඎ': 'ruː', 'ඏ': 'lu', 'ඐ': 'luː', 'එ': 'e', 'ඒ': 'eː', 'ඓ': 'ai',
                'ඔ': 'o', 'ඕ': 'oː', 'ඖ': 'au',
                # Consonants (Velar)
                'ක': 'ka', 'ඛ': 'kʰa', 'ග': 'ɡa', 'ඝ': 'ɡʰa', 'ඞ': 'ŋa',
                # Consonants (Palatal)
                'ච': 't͡ʃa', 'ඡ': 't͡ʃʰa', 'ජ': 'd͡ʒa', 'ඣ': 'd͡ʒʰa', 'ඤ': 'ɲa',
                # Consonants (Retroflex)
                'ට': 'ʈa', 'ඨ': 'ʈʰa', 'ඩ': 'ɖa', 'ඪ': 'ɖʰa', 'ණ': 'ɳa',
                # Consonants (Dental)
                'ත': 't̪a', 'ථ': 't̪ʰa', 'ද': 'd̪a', 'ධ': 'd̪ʰa', 'න': 'na',
                # Consonants (Labial)
                'ප': 'pa', 'ඵ': 'pʰa', 'බ': 'ba', 'භ': 'bʰa', 'ම': 'ma',
                # Consonants (Approximants)
                'ය': 'ja', 'ර': 'ra', 'ල': 'la', 'ව': 'ʋa', 
                # Consonants (Sibilants)
                'ශ': 'ʃa', 'ෂ': 'ʂa', 'ස': 'sa', 'හ': 'ha', 'ළ': 'ɭa', 'ෆ': 'fa',
                # Diacritics and modifiers
                'ං': 'ŋ', 'ඃ': 'h', '්': '', 
                'ා': 'aː', 'ැ': 'æ', 'ෑ': 'æː', 
                'ි': 'i', 'ී': 'iː', 'ු': 'u', 'ූ': 'uː',
                'ෘ': 'ru', 'ෲ': 'ruː', 'ෟ': 'lu', 'ෳ': 'luː', 
                'ෙ': 'e', 'ේ': 'eː', 'ෛ': 'ai', 
                'ො': 'o', 'ෝ': 'oː', 'ෞ': 'au'
            }
            
            result = ''
            for char in text:
                result += sinhala_to_ipa.get(char, char)
            
            return result.strip()
        except Exception as e:
            return ''
    
    def generate_singlish_romanization(self, text):
        """Generate Singlish romanization for Vedda/Sinhala text"""
        if not SINLING_AVAILABLE or not text:
            return ''
        try:
            # Singlish romanization mapping
            sinhala_to_singlish = {
                # Vowels
                'අ': 'a', 'ආ': 'aa', 'ඇ': 'ae', 'ඈ': 'aae', 'ඉ': 'i', 'ඊ': 'ii', 'උ': 'u', 'ඌ': 'uu',
                'ඍ': 'ru', 'ඎ': 'ruu', 'ඏ': 'lu', 'ඐ': 'luu', 'එ': 'e', 'ඒ': 'ee', 'ඓ': 'ai',
                'ඔ': 'o', 'ඕ': 'oo', 'ඖ': 'au',
                # Consonants (Velar)
                'ක': 'ka', 'ඛ': 'kha', 'ග': 'ga', 'ඝ': 'gha', 'ඞ': 'nga',
                # Consonants (Palatal)
                'ච': 'cha', 'ඡ': 'chha', 'ජ': 'ja', 'ඣ': 'jha', 'ඤ': 'gna',
                # Consonants (Retroflex)
                'ට': 'ta', 'ඨ': 'tha', 'ඩ': 'da', 'ඪ': 'dha', 'ණ': 'na',
                # Consonants (Dental)
                'ත': 'tha', 'ථ': 'thha', 'ද': 'dha', 'ධ': 'dhha', 'න': 'na',
                # Consonants (Labial)
                'ප': 'pa', 'ඵ': 'pha', 'බ': 'ba', 'භ': 'bha', 'ම': 'ma',
                # Consonants (Approximants)
                'ය': 'ya', 'ර': 'ra', 'ල': 'la', 'ව': 'wa', 
                # Consonants (Sibilants)
                'ශ': 'sha', 'ෂ': 'sha', 'ස': 'sa', 'හ': 'ha', 'ළ': 'la', 'ෆ': 'fa',
                # Diacritics and modifiers
                'ං': 'ng', 'ඃ': 'h', '්': '', 
                'ා': 'aa', 'ැ': 'ae', 'ෑ': 'aae', 
                'ි': 'i', 'ී': 'ii', 'ු': 'u', 'ූ': 'uu',
                'ෘ': 'ru', 'ෲ': 'ruu', 'ෟ': 'lu', 'ෳ': 'luu', 
                'ෙ': 'e', 'ේ': 'ee', 'ෛ': 'ai', 
                'ො': 'o', 'ෝ': 'oo', 'ෞ': 'au'
            }
            
            result = ''
            for char in text:
                result += sinhala_to_singlish.get(char, char)
            
            return result.strip()
        except Exception as e:
            return ''
    
    def batch_translate_dictionary(self, words, source_lang, target_lang):
        """
        Batch translate multiple words using dictionary service's batch endpoint.
        This is much faster than calling search_dictionary multiple times.
        
        Args:
            words: List of words to translate
            source_lang: Source language (vedda, sinhala, english)
            target_lang: Target language (vedda, sinhala, english)
            
        Returns:
            Dictionary mapping original words to their translation info
            Format: {word: {'found': True/False, 'translation': 'translated_word'}}
        """
        import time
        start = time.perf_counter()
        try:
            # Call batch translate endpoint
            req_start = time.perf_counter()
            response = self.session.post(
                f"{self.dictionary_service_url}/translate/batch",
                json={
                    'words': words,
                    'source': source_lang,
                    'target': target_lang
                },
                timeout=10
            )
            req_time = (time.perf_counter() - req_start) * 1000
            print(f"[PERF] Dictionary batch API call ({len(words)} words): {req_time:.1f}ms")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    # Convert list of results to dictionary for fast lookup
                    result_dict = {}
                    for item in data.get('translations', []):
                        result_dict[item['word']] = {
                            'found': item.get('found', False),
                            'translation': item.get('translation', item['word'])
                        }
                    total_time = (time.perf_counter() - start) * 1000
                    print(f"[PERF] batch_translate_dictionary total: {total_time:.1f}ms")
                    return result_dict
            
            # If batch fails, return empty dict
            return {}
            
        except Exception as e:
            total_time = (time.perf_counter() - start) * 1000
            print(f"[PERF] batch_translate_dictionary error after {total_time:.1f}ms: {e}")
            return {}
    
    def search_dictionary(self, word, source_lang='vedda', target_lang='english'):
        """Search dictionary service for word translation (LEGACY - use batch_translate_dictionary for better performance)"""
        try:
            response = self.session.get(
                f"{self.dictionary_service_url}/search",
                params={
                    'q': word,
                    'source': source_lang,
                    'target': target_lang
                },
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and data.get('count', 0) > 0:
                    for result in data.get('results', []):
                        match_found = False
                        if source_lang == 'vedda' and result.get('vedda_word') == word:
                            match_found = True
                        elif source_lang == 'sinhala' and result.get('sinhala_word') == word:
                            match_found = True
                        elif source_lang == 'english' and result.get('english_word') == word:
                            match_found = True
                        
                        if match_found:
                            return {
                                'found': True,
                                'translation': {
                                    'english': result.get('english_word'),
                                    'sinhala': result.get('sinhala_word'),
                                    'vedda': result.get('vedda_word'),
                                    'vedda_ipa': result.get('vedda_ipa'),
                                    'english_ipa': result.get('english_ipa'),
                                    'sinhala_ipa': result.get('sinhala_ipa')
                                }
                            }
                    first_result = data['results'][0]
                    return {
                        'found': True,
                        'translation': {
                            'english': first_result.get('english_word'),
                            'sinhala': first_result.get('sinhala_word'),
                            'vedda': first_result.get('vedda_word'),
                            'vedda_ipa': first_result.get('vedda_ipa'),
                            'english_ipa': first_result.get('english_ipa'),
                            'sinhala_ipa': first_result.get('sinhala_ipa')
                        }
                    }
                return {'found': False}
            return {'found': False}
        except Exception as e:
            return {'found': False}
    
    def google_translate(self, text, source_lang, target_lang):
        """Use Google Translate API for translation"""
        import time
        start = time.perf_counter()
        try:
            source_code = self.supported_languages.get(source_lang, source_lang)
            target_code = self.supported_languages.get(target_lang, target_lang)
            
            if target_code == 'vedda':
                target_code = 'si'
            elif source_code == 'vedda':
                source_code = 'si'
            
            params = {
                'client': 'gtx',
                'sl': source_code,
                'tl': target_code,
                'dt': 't',
                'q': text
            }
            
            req_start = time.perf_counter()
            response = self.session.get(self.google_translate_url, params=params, timeout=10)
            req_time = (time.perf_counter() - req_start) * 1000
            print(f"[PERF] Google Translate API call: {req_time:.1f}ms")
            
            if response.status_code == 200:
                result = response.json()
                if result and len(result) > 0 and len(result[0]) > 0:
                    # Handle both single and multi-chunk responses
                    # For large texts, Google Translate returns multiple chunks in result[0]
                    # Each chunk is [translated_text, original_text, ...]
                    translated_text = ''
                    for chunk in result[0]:
                        if chunk and len(chunk) > 0 and chunk[0]:
                            translated_text += chunk[0]
                    
                    if translated_text:
                        total_time = (time.perf_counter() - start) * 1000
                        print(f"[PERF] google_translate total: {total_time:.1f}ms")
                        return translated_text
            return None
            
        except Exception as e:
            total_time = (time.perf_counter() - start) * 1000
            print(f"[PERF] google_translate error after {total_time:.1f}ms: {e}")
            return None
    
    def translate_to_vedda_via_sinhala(self, text, source_language):
        """Translate any language to Vedda via Sinhala bridge"""
        
        if source_language == 'sinhala':
            sinhala_text = text
            step1_confidence = 1.0
        else:
            sinhala_text = self.google_translate(text, source_language, 'sinhala')
            if not sinhala_text:
                return {
                    'translated_text': text,
                    'confidence': 0.1,
                    'method': 'fallback',
                    'source_ipa': '',
                    'target_ipa': '',
                    'bridge_translation': '',
                    'methods_used': ['fallback'],
                    'note': 'Failed to translate to Sinhala bridge'
                }
            step1_confidence = 0.8
        
        sinhala_words = [word.strip() for word in sinhala_text.split() if word.strip()]
        vedda_words = []
        word_sources = []  # Track whether each word came from dictionary or is Sinhala fallback
        dictionary_hits = 0
        processed_indices = set()  # Track which Sinhala words have been processed

        # STEP 1: Try multi-word phrase matching with normalization
        # This handles cases like "විවාහ වෙමු" → "විවාහ වෙනවා" → "කැකුළියෙක්‌ ඇන්න මංගච්චනවා"
        i = 0
        while i < len(sinhala_words):
            if i in processed_indices:
                i += 1
                continue

            # Try progressively longer phrases (up to 5 words)
            matched = False
            for phrase_len in range(min(5, len(sinhala_words) - i), 0, -1):
                phrase = ' '.join(sinhala_words[i:i+phrase_len])

                # IMPORTANT: For single words, check ignore list FIRST
                if phrase_len == 1:
                    is_ignored, ignore_translation = self._is_ignored_word(phrase)
                    if is_ignored:
                        # Word is in ignore list - use as-is without translation
                        print(f"[TRANSLATE] ⊘ Ignoring word (in ignore list): '{phrase}' → '{ignore_translation}'")
                        vedda_words.append(ignore_translation)
                        word_sources.append(('ignored', ignore_translation, ignore_translation))

                        # Mark as processed
                        processed_indices.add(i)
                        i += 1
                        matched = True
                        break

                # IMPORTANT: For single words, extract suffix BEFORE translating
                # This ensures suffixes like ට are always preserved
                phrase_base = phrase
                phrase_suffix = ''

                if phrase_len == 1:
                    # Single word: extract and preserve suffix
                    phrase_base, phrase_suffix = self._extract_verb_suffix(phrase)

                # Try exact match first, then normalization candidates
                # Translate the base form (with suffix removed)
                batch_results = self._batch_translate_sinhala_with_normalization([phrase_base], 'vedda')

                if phrase_base in batch_results and batch_results[phrase_base]['found']:
                    vedda_translation = batch_results[phrase_base]['translation']
                    print(f"[TRANSLATE] ✓ Found Sinhala phrase match: '{phrase}' → '{vedda_translation}'")

                    # Handle multi-word Vedda translations
                    vedda_phrase_words = [w.strip() for w in vedda_translation.split() if w.strip()]

                    translation_dict = {
                        'vedda': vedda_translation,
                        'sinhala': phrase,
                        'vedda_ipa': '',
                        'sinhala_ipa': '',
                        'english': '',
                        'english_ipa': ''
                    }

                    # Add each word from the multi-word translation
                    for vedda_word in vedda_phrase_words:
                        vedda_words.append(vedda_word)
                        word_sources.append(('vedda', translation_dict, vedda_word))

                    # CRITICAL: Only preserve suffix if VEDDA TRANSLATION exists
                    # Preserve suffix with space only when there is a valid Vedda translation
                    if phrase_suffix and phrase_len == 1:
                        vedda_words[-1] = vedda_words[-1] + ' ' + phrase_suffix
                        word_sources.append(('sinhala', phrase_suffix, phrase_suffix))

                    # Mark all words in this phrase as processed
                    for j in range(i, i + phrase_len):
                        processed_indices.add(j)

                    dictionary_hits += 1
                    matched = True
                    i += phrase_len
                    break

            if not matched:
                # STEP 2: No phrase match, try single word with normalization
                sinhala_word = sinhala_words[i]

                # CRITICAL: Extract ANY suffix from word (especially ට)
                base_word, preserve_suffix = self._extract_verb_suffix(sinhala_word)

                # Try to translate the base form first
                batch_results = self._batch_translate_sinhala_with_normalization([base_word], 'vedda')

                if base_word in batch_results and batch_results[base_word]['found']:
                    # Base form found - translate it
                    vedda_translation = batch_results[base_word]['translation']
                    vedda_phrase_words = [w.strip() for w in vedda_translation.split() if w.strip()]

                    translation_dict = {
                        'vedda': vedda_translation,
                        'sinhala': base_word,
                        'vedda_ipa': '',
                        'sinhala_ipa': '',
                        'english': '',
                        'english_ipa': ''
                    }

                    for vedda_word in vedda_phrase_words:
                        vedda_words.append(vedda_word)
                        word_sources.append(('vedda', translation_dict, vedda_word))

                    # CRITICAL: Only preserve suffix if base form was found in dictionary
                    # If translation exists for base word, preserve ට as separate word
                    if preserve_suffix:
                        vedda_words[-1] = vedda_words[-1] + ' ' + preserve_suffix
                        word_sources.append(('sinhala', preserve_suffix, preserve_suffix))

                    dictionary_hits += 1
                else:
                    # Base form not found in dictionary
                    # DO NOT preserve suffix - use original word with suffix intact
                    batch_results = self._batch_translate_sinhala_with_normalization([sinhala_word], 'vedda')

                    if sinhala_word in batch_results and batch_results[sinhala_word]['found']:
                        vedda_translation = batch_results[sinhala_word]['translation']
                        vedda_phrase_words = [w.strip() for w in vedda_translation.split() if w.strip()]

                        translation_dict = {
                            'vedda': vedda_translation,
                            'sinhala': sinhala_word,
                            'vedda_ipa': '',
                            'sinhala_ipa': '',
                            'english': '',
                            'english_ipa': ''
                        }

                        for vedda_word in vedda_phrase_words:
                            vedda_words.append(vedda_word)
                            word_sources.append(('vedda', translation_dict, vedda_word))

                        dictionary_hits += 1
                    else:
                        # No translation found at all
                        # Use original word WITH suffix (no separation)
                        vedda_words.append(sinhala_word)
                        word_sources.append(('sinhala', sinhala_word, sinhala_word))

                processed_indices.add(i)
                i += 1
        
        final_text = ' '.join(vedda_words)
        dict_coverage = dictionary_hits / len(sinhala_words) if sinhala_words else 0
        final_confidence = step1_confidence * 0.7 + dict_coverage * 0.3
        
        # Generate source IPA if source is English
        source_ipa = self.generate_english_ipa(text) if source_language == 'english' else ''
        
        # Build target IPA and Singlish by combining dictionary and generated versions
        target_ipa_parts = []
        target_singlish_parts = []
        for i, word_source in enumerate(word_sources):
            source_type = word_source[0]
            if source_type == 'vedda':
                # Word from Vedda dictionary - use vedda_ipa or generate from vedda word
                vedda_word = word_source[2]  # The individual word from multi-word phrase
                source_data = word_source[1]  # The translation dict
                vedda_ipa = source_data.get('vedda_ipa', '')
                if not vedda_ipa:
                    # Generate IPA for individual Vedda word
                    vedda_ipa = self.generate_vedda_sinhala_ipa(vedda_word)
                if vedda_ipa:
                    target_ipa_parts.append(vedda_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(vedda_word)
                if singlish:
                    target_singlish_parts.append(singlish)
            else:
                # Sinhala fallback word
                sinhala_word = word_source[2]  # The individual word
                dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'sinhala')
                if dict_result and dict_result.get('found'):
                    sinhala_ipa = dict_result['translation'].get('sinhala_ipa', '')
                    if sinhala_ipa:
                        target_ipa_parts.append(sinhala_ipa)
                    else:
                        # Generate IPA for Sinhala word
                        generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                        if generated_ipa:
                            target_ipa_parts.append(generated_ipa)
                else:
                    # Generate IPA for Sinhala word
                    generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                    if generated_ipa:
                        target_ipa_parts.append(generated_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(sinhala_word)
                if singlish:
                    target_singlish_parts.append(singlish)
        
        target_ipa = ' '.join(target_ipa_parts)
        target_singlish = ' '.join(target_singlish_parts)
        
        return {
            'translated_text': final_text,
            'confidence': final_confidence,
            'method': 'sinhala_to_vedda_bridge',
            'source_ipa': source_ipa,
            'target_ipa': target_ipa,
            'target_romanization': target_singlish,
            'bridge_translation': sinhala_text,
            'methods_used': ['google', 'dictionary', 'sinhala_bridge'],
            'note': f'Translated via Sinhala bridge. Dictionary coverage: {dictionary_hits}/{len(sinhala_words)} words'
        }
    
    def translate_from_vedda_via_sinhala(self, text, target_language):
        """Translate Vedda to any language via Sinhala bridge"""
        
        phrase_result = self.search_dictionary(text.strip(), 'vedda', target_language)
        if phrase_result and phrase_result.get('found'):
            translation = phrase_result['translation']
            if target_language == 'english' and translation.get('english'):
                # Get English IPA from dictionary or generate it
                target_ipa = translation.get('english_ipa', '')
                if not target_ipa:
                    target_ipa = self.generate_english_ipa(translation['english'])
                
                # Generate source romanization from vedda word
                source_romanization = self.generate_singlish_romanization(text.strip())
                
                return {
                    'translated_text': translation['english'],
                    'confidence': 0.95,
                    'method': 'vedda_phrase',
                    'source_ipa': translation.get('vedda_ipa', ''),
                    'source_romanization': source_romanization,
                    'target_ipa': target_ipa,
                    'bridge_translation': translation.get('sinhala', ''),
                    'methods_used': ['dictionary', 'phrase_match'],
                    'note': 'Direct phrase match found in dictionary'
                }
            elif target_language == 'sinhala' and translation.get('sinhala'):
                # Get Sinhala IPA from dictionary or generate IPA
                target_ipa = translation.get('sinhala_ipa', '')
                if not target_ipa:
                    target_ipa = self.generate_vedda_sinhala_ipa(translation['sinhala'])
                
                # Generate romanization for both source and target
                source_romanization = self.generate_singlish_romanization(text.strip())
                target_romanization = self.generate_singlish_romanization(translation['sinhala'])
                
                return {
                    'translated_text': translation['sinhala'],
                    'confidence': 0.95,
                    'method': 'vedda_phrase',
                    'source_ipa': translation.get('vedda_ipa', ''),
                    'source_romanization': source_romanization,
                    'target_ipa': target_ipa,
                    'target_romanization': target_romanization,
                    'bridge_translation': translation.get('sinhala', ''),
                    'methods_used': ['dictionary', 'phrase_match'],
                    'note': 'Direct phrase match found in dictionary'
                }
        
        vedda_words = [word.strip() for word in text.split() if word.strip()]
        sinhala_words = []
        word_sources = []  # Track whether each word came from dictionary or is fallback
        dictionary_hits = 0
        processed_indices = set()  # Track which vedda words have been processed
        
        # STEP 1: Try to match the entire text as a phrase first using batch endpoint
        full_text = text.strip()
        print(f"[TRANSLATE] Attempting to translate Vedda phrase: '{full_text}'")
        
        batch_results = self.batch_translate_dictionary([full_text], 'vedda', 'sinhala')
        if full_text in batch_results and batch_results[full_text]['found']:
            sinhala_translation = batch_results[full_text]['translation']
            print(f"[TRANSLATE] ✓ Found phrase match: '{full_text}' → '{sinhala_translation}'")
            
            translation = {
                'sinhala': sinhala_translation,
                'vedda': full_text,
                'vedda_ipa': '',
                'sinhala_ipa': '',
                'english': '',
                'english_ipa': ''
            }
            sinhala_words.append(sinhala_translation)
            word_sources.append(('vedda_phrase', translation, full_text, sinhala_translation))
            dictionary_hits = 1
            # Mark all words as processed
            for idx in range(len(vedda_words)):
                processed_indices.add(idx)
        else:
            print(f"[TRANSLATE] No phrase match found for '{full_text}'")
        
        # STEP 2: If no full phrase match, try to match multi-word phrases progressively
        i = 0
        while i < len(vedda_words):
            if i in processed_indices:
                i += 1
                continue
                
            # Try progressively longer phrases (up to 5 words)
            matched = False
            for phrase_len in range(min(5, len(vedda_words) - i), 0, -1):
                phrase = ' '.join(vedda_words[i:i+phrase_len])
                
                # Use batch translate endpoint for phrase matching
                batch_results = self.batch_translate_dictionary([phrase], 'vedda', 'sinhala')
                
                if phrase in batch_results and batch_results[phrase]['found']:
                    sinhala_translation = batch_results[phrase]['translation']
                    translation = {
                        'sinhala': sinhala_translation,
                        'vedda': phrase,
                        'vedda_ipa': '',
                        'sinhala_ipa': '',
                        'english': '',
                        'english_ipa': ''
                    }
                    
                    # Mark all words in this phrase as processed
                    for j in range(i, i + phrase_len):
                        processed_indices.add(j)
                    
                    # Add the Sinhala translation
                    sinhala_words.append(sinhala_translation)
                    word_sources.append(('vedda_phrase', translation, phrase, sinhala_translation))
                    dictionary_hits += 1
                    matched = True
                    print(f"[TRANSLATE] ✓ Found sub-phrase match: '{phrase}' → '{sinhala_translation}'")
                    i += phrase_len
                    break
            
            if not matched:
                # STEP 3: No phrase match, use batch translation for single word
                vedda_word = vedda_words[i]
                batch_results = self.batch_translate_dictionary([vedda_word], 'vedda', 'sinhala')
                
                if vedda_word in batch_results and batch_results[vedda_word]['found']:
                    sinhala_word = batch_results[vedda_word]['translation']
                    translation_dict = {
                        'sinhala': sinhala_word,
                        'vedda': vedda_word,
                        'vedda_ipa': '',
                        'sinhala_ipa': '',
                        'english': '',
                        'english_ipa': ''
                    }
                    sinhala_words.append(sinhala_word)
                    word_sources.append(('vedda_phrase', translation_dict, vedda_word, sinhala_word))
                    dictionary_hits += 1
                else:
                    # Fallback: keep the Vedda word unchanged
                    sinhala_words.append(vedda_word)
                    word_sources.append(('sinhala', None, vedda_word, vedda_word))
                
                processed_indices.add(i)
                i += 1
        
        sinhala_text = ' '.join(sinhala_words)
        
        if target_language == 'sinhala':
            final_text = sinhala_text
            step2_confidence = 1.0
        else:
            final_text = self.google_translate(sinhala_text, 'sinhala', target_language)
            if not final_text:
                final_text = sinhala_text
                step2_confidence = 0.5
            else:
                step2_confidence = 0.8
        
        dict_coverage = dictionary_hits / len(vedda_words) if vedda_words else 0
        final_confidence = dict_coverage * 0.7 + step2_confidence * 0.3
        
        # Build source IPA and Singlish by combining dictionary and generated versions
        source_ipa_parts = []
        source_singlish_parts = []
        for word_source in word_sources:
            source_type = word_source[0]
            if source_type == 'vedda_phrase':
                # Phrase from Vedda dictionary
                source_data = word_source[1]  # Translation dict
                vedda_phrase = word_source[2]  # Original Vedda phrase
                vedda_ipa = source_data.get('vedda_ipa', '')
                if not vedda_ipa:
                    # Generate IPA for Vedda phrase
                    vedda_ipa = self.generate_vedda_sinhala_ipa(vedda_phrase)
                if vedda_ipa:
                    source_ipa_parts.append(vedda_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(vedda_phrase)
                if singlish:
                    source_singlish_parts.append(singlish)
            else:
                # Sinhala fallback word
                vedda_word = word_source[2]  # Original Vedda word (used as Sinhala)
                dict_result = self.search_dictionary(vedda_word, 'sinhala', 'sinhala')
                if dict_result and dict_result.get('found'):
                    sinhala_ipa = dict_result['translation'].get('sinhala_ipa', '')
                    if sinhala_ipa:
                        source_ipa_parts.append(sinhala_ipa)
                    else:
                        # Generate IPA for word
                        generated_ipa = self.generate_vedda_sinhala_ipa(vedda_word)
                        if generated_ipa:
                            source_ipa_parts.append(generated_ipa)
                else:
                    # Generate IPA for word
                    generated_ipa = self.generate_vedda_sinhala_ipa(vedda_word)
                    if generated_ipa:
                        source_ipa_parts.append(generated_ipa)
                # Generate Singlish
                singlish = self.generate_singlish_romanization(vedda_word)
                if singlish:
                    source_singlish_parts.append(singlish)
        
        source_ipa = ' '.join(source_ipa_parts)
        source_singlish = ' '.join(source_singlish_parts)
        
        # Generate target IPA based on target language
        if target_language == 'english':
            target_ipa = self.generate_english_ipa(final_text)
        elif target_language == 'sinhala':
            # For Sinhala, build IPA from dictionary or generate
            target_ipa_parts = []
            for sinhala_word in sinhala_words:
                dict_result = self.search_dictionary(sinhala_word, 'sinhala', 'sinhala')
                if dict_result and dict_result.get('found'):
                    sinhala_ipa = dict_result['translation'].get('sinhala_ipa', '')
                    if sinhala_ipa:
                        target_ipa_parts.append(sinhala_ipa)
                    else:
                        # Generate IPA for Sinhala word
                        generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                        if generated_ipa:
                            target_ipa_parts.append(generated_ipa)
                else:
                    # Generate IPA for Sinhala word
                    generated_ipa = self.generate_vedda_sinhala_ipa(sinhala_word)
                    if generated_ipa:
                        target_ipa_parts.append(generated_ipa)
            target_ipa = ' '.join(target_ipa_parts)
        else:
            target_ipa = ''
        
        return {
            'translated_text': final_text,
            'confidence': final_confidence,
            'method': 'vedda_to_sinhala_bridge',
            'source_ipa': source_ipa,
            'source_romanization': source_singlish,
            'target_ipa': target_ipa,
            'bridge_translation': sinhala_text,
            'methods_used': ['dictionary', 'google', 'sinhala_bridge'],
            'note': f'Translated via Sinhala bridge. Dictionary coverage: {dictionary_hits}/{len(vedda_words)} words'
        }
    
    def direct_translation(self, text, source_language, target_language):
        """Direct translation for non-Vedda languages"""
        
        result = self.google_translate(text, source_language, target_language)
        if result:
            # Generate IPA for English text
            source_ipa = self.generate_english_ipa(text) if source_language == 'english' else ''
            
            # Generate target IPA and romanization based on target language
            target_romanization = ''
            if target_language == 'english':
                target_ipa = self.generate_english_ipa(result)
            elif target_language == 'sinhala':
                target_ipa = self.generate_vedda_sinhala_ipa(result)
                target_romanization = self.generate_singlish_romanization(result)
            else:
                target_ipa = ''
            
            return {
                'translated_text': result,
                'confidence': 0.85,
                'method': 'google_direct',
                'source_ipa': source_ipa,
                'target_ipa': target_ipa,
                'target_romanization': target_romanization,
                'bridge_translation': '',
                'methods_used': ['google']
            }
        else:
            return {
                'translated_text': text,
                'confidence': 0.1,
                'method': 'fallback',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': ['fallback'],
                'note': 'Google Translate failed'
            }
    
    def translate_text(self, text, source_language, target_language):
        """Main translation method with Sinhala bridge for Vedda"""
        if not text.strip():
            return {
                'translated_text': '',
                'confidence': 0,
                'method': 'none',
                'source_ipa': '',
                'target_ipa': '',
                'bridge_translation': '',
                'methods_used': []
            }

        if target_language == 'vedda':
            return self.translate_to_vedda_via_sinhala(text, source_language)
        elif source_language == 'vedda':
            return self.translate_from_vedda_via_sinhala(text, target_language)
        else:
            return self.direct_translation(text, source_language, target_language)
    
    def save_translation_history(self, input_text, output_text, source_language, 
                               target_language, translation_method, confidence):
        """Save translation to history service (runs in background thread)"""
        try:
            data = {
                'input_text': input_text,
                'output_text': output_text,
                'source_language': source_language,
                'target_language': target_language,
                'translation_method': translation_method,
                'confidence_score': confidence
            }
            
            # Use reasonable timeout since we're in background thread
            response = self.session.post(
                f"{self.history_service_url}/api/history",
                json=data,
                timeout=5  # 5 seconds is fine in background
            )
            if response.status_code == 201:
                print(f"[HISTORY] Saved: {input_text[:30]}... → {output_text[:30]}...")
                return True
            else:
                print(f"[HISTORY] Failed to save (status {response.status_code})")
                return False
        except Exception as e:
            print(f"[HISTORY] Error saving: {e}")
            return False
