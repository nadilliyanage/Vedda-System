"""
Vedda Language Speech-to-Text Processor
Processes Sinhala STT output and maps it to Vedda language using MongoDB dictionary
"""

import os
import re
from difflib import SequenceMatcher
import logging
from pymongo import MongoClient
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class VeddaSTTProcessor:
    def __init__(self, mongodb_uri=None, database_name='vedda-system'):
        self.mongodb_uri = mongodb_uri or os.getenv('MONGODB_URI')
        self.database_name = database_name
        self.client = None
        self.db = None
        self.vedda_dict = {}
        self.sinhala_to_vedda = {}
        self.vedda_phonetic_patterns = {}
        self.connect_and_load()
    
    def connect_and_load(self):
        """Connect to MongoDB and load dictionary"""
        try:
            # Connect to MongoDB
            self.client = MongoClient(self.mongodb_uri)
            self.db = self.client[self.database_name]
            
            # Test connection
            self.client.admin.command('ping')
            
            # Load dictionary
            self.load_dictionary()
            
        except Exception as e:
            logger.error(f"Error connecting to MongoDB: {str(e)}")
            self.vedda_dict = {}
            self.sinhala_to_vedda = {}
    
    def load_dictionary(self):
        """Load Vedda dictionary from MongoDB"""
        try:
            # Load all dictionary entries from MongoDB
            cursor = self.db.dictionary.find({})
            
            for doc in cursor:
                vedda_word = doc.get('vedda_word', '')
                sinhala_word = doc.get('sinhala_word', '')
                english_word = doc.get('english_word', '')
                vedda_ipa = doc.get('vedda_ipa', '')
                sinhala_ipa = doc.get('sinhala_ipa', '')
                
                # Create mappings
                self.vedda_dict[vedda_word] = {
                    'sinhala': sinhala_word,
                    'english': english_word,
                    'vedda_ipa': vedda_ipa,
                    'sinhala_ipa': sinhala_ipa
                }
                
                # Reverse mapping: Sinhala to Vedda
                if sinhala_word:
                    self.sinhala_to_vedda[sinhala_word.lower()] = vedda_word
                
                # Create phonetic patterns for better matching
                if vedda_ipa and sinhala_ipa:
                    self.vedda_phonetic_patterns[vedda_word] = {
                        'vedda_pattern': self._create_phonetic_pattern(vedda_ipa),
                        'sinhala_pattern': self._create_phonetic_pattern(sinhala_ipa)
                    }
            
            logger.info(f"Loaded {len(self.vedda_dict)} Vedda dictionary entries from MongoDB")
            
        except Exception as e:
            logger.error(f"Error loading Vedda dictionary from MongoDB: {str(e)}")
            self.vedda_dict = {}
            self.sinhala_to_vedda = {}
    
    def _create_phonetic_pattern(self, ipa_text):
        """Create simplified phonetic pattern for matching"""
        if not ipa_text:
            return ""
        
        # Simplify IPA symbols for pattern matching
        pattern = ipa_text.lower()
        # Remove stress marks and other diacritics
        pattern = re.sub(r'[ˈˌ]', '', pattern)
        # Normalize common sound variations
        pattern = re.sub(r'[aæɑ]', 'a', pattern)
        pattern = re.sub(r'[eɛ]', 'e', pattern)
        pattern = re.sub(r'[iɪ]', 'i', pattern)
        pattern = re.sub(r'[oɔ]', 'o', pattern)
        pattern = re.sub(r'[uʊ]', 'u', pattern)
        
        return pattern
    
    def process_sinhala_stt_result(self, sinhala_text, confidence=0.8):
        """
        Process Sinhala STT result and convert to Vedda
        """
        if not sinhala_text:
            return {
                'success': False,
                'error': 'No input text provided',
                'original_sinhala': sinhala_text,
                'vedda_text': '',
                'confidence': 0,
                'method': 'vedda_stt_processor'
            }
        
        try:
            # Clean and normalize input
            normalized_text = sinhala_text.strip()
            words = normalized_text.split()
            
            vedda_words = []
            total_confidence = 0
            matched_words = 0
            word_details = []
            
            for word in words:
                word_clean = word.lower().strip('.,!?;:')
                
                # Try direct mapping first
                if word_clean in self.sinhala_to_vedda:
                    vedda_word = self.sinhala_to_vedda[word_clean]
                    vedda_words.append(vedda_word)
                    total_confidence += 0.9
                    matched_words += 1
                    word_details.append({
                        'sinhala': word,
                        'vedda': vedda_word,
                        'method': 'direct_mapping',
                        'confidence': 0.9
                    })
                else:
                    # Try fuzzy matching
                    best_match = self._find_best_match(word_clean)
                    if best_match:
                        vedda_words.append(best_match['vedda'])
                        total_confidence += best_match['confidence']
                        matched_words += 1
                        word_details.append({
                            'sinhala': word,
                            'vedda': best_match['vedda'],
                            'method': 'fuzzy_matching',
                            'confidence': best_match['confidence']
                        })
                    else:
                        # Keep original word if no match found
                        vedda_words.append(word)
                        total_confidence += 0.3
                        word_details.append({
                            'sinhala': word,
                            'vedda': word,
                            'method': 'no_match',
                            'confidence': 0.3
                        })
            
            # Calculate average confidence
            final_confidence = (total_confidence / len(words)) if words else 0
            final_confidence = min(final_confidence * confidence, 1.0)  # Factor in original STT confidence
            
            vedda_text = ' '.join(vedda_words)
            
            return {
                'success': True,
                'original_sinhala': sinhala_text,
                'vedda_text': vedda_text,
                'confidence': final_confidence,
                'matched_words': matched_words,
                'total_words': len(words),
                'word_details': word_details,
                'method': 'vedda_stt_processor'
            }
            
        except Exception as e:
            logger.error(f"Error processing Sinhala STT result: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'original_sinhala': sinhala_text,
                'vedda_text': '',
                'confidence': 0,
                'method': 'vedda_stt_processor'
            }
    
    def _find_best_match(self, sinhala_word):
        """Find best matching Vedda word using fuzzy matching"""
        best_score = 0
        best_match = None
        
        for vedda_word, data in self.vedda_dict.items():
            sinhala_equiv = data['sinhala']
            if not sinhala_equiv:
                continue
            
            # Calculate similarity score
            score = SequenceMatcher(None, sinhala_word.lower(), sinhala_equiv.lower()).ratio()
            
            if score > best_score and score > 0.7:  # Minimum similarity threshold
                best_score = score
                best_match = {
                    'vedda': vedda_word,
                    'sinhala': sinhala_equiv,
                    'confidence': score * 0.8  # Reduce confidence for fuzzy matches
                }
        
        return best_match
    
    def get_dictionary_stats(self):
        """Get statistics about the loaded dictionary"""
        return {
            'total_entries': len(self.vedda_dict),
            'sinhala_mappings': len(self.sinhala_to_vedda),
            'phonetic_patterns': len(self.vedda_phonetic_patterns)
        }
    
    def add_word_mapping(self, vedda_word, sinhala_word, english_word=None):
        """Add a new word mapping to the processor (runtime only)"""
        self.vedda_dict[vedda_word] = {
            'sinhala': sinhala_word,
            'english': english_word or '',
            'vedda_ipa': '',
            'sinhala_ipa': ''
        }
        
        if sinhala_word:
            self.sinhala_to_vedda[sinhala_word.lower()] = vedda_word
        
        logger.info(f"Added runtime mapping: {sinhala_word} -> {vedda_word}")

# Example usage and testing
if __name__ == "__main__":
    processor = VeddaSTTProcessor()
    
    # Test with some Sinhala text
    test_cases = [
        "ළමයි ගෙදර ඉන්නවා",  # Should map to: කැකුලෝ ගෙදර ඉන්නවා
        "මේ ගස ලොකු",          # Should map to: මේ ගස් ලොකු
        "අම්මා කෑම කරනවා",     # Should map to: අම්මා කෑම කරනවා (some words might stay same)
    ]
    
    for test_text in test_cases:
        result = processor.process_sinhala_stt_result(test_text, confidence=0.8)
        print(f"\nInput: {test_text}")
        print(f"Output: {result['vedda_text']}")
        print(f"Confidence: {result['confidence']:.2f}")
        print(f"Matched: {result.get('matched_words', 0)}/{result.get('total_words', 0)}")