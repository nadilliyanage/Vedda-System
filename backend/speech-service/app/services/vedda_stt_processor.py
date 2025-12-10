"""
Vedda Language Speech-to-Text Processor
Processes Sinhala STT output and maps it to Vedda language using MongoDB dictionary
"""

import os
import re
from difflib import SequenceMatcher
import logging
from app.db.mongo import get_db

logger = logging.getLogger(__name__)


# Singleton instance
_vedda_stt_processor_instance = None


def get_vedda_stt_processor():
    """Get or create singleton VeddaSTTProcessor instance"""
    global _vedda_stt_processor_instance
    if _vedda_stt_processor_instance is None:
        _vedda_stt_processor_instance = VeddaSTTProcessor()
    return _vedda_stt_processor_instance


class VeddaSTTProcessor:
    def __init__(self):
        self.db = get_db()
        self.vedda_dict = {}
        self.sinhala_to_vedda = {}
        self.vedda_phonetic_patterns = {}
        self.load_dictionary()
        logger.info("Vedda STT Processor initialized")
    
    def load_dictionary(self):
        """Load Vedda dictionary from MongoDB"""
        try:
            if self.db is None:
                logger.warning("Database not initialized, skipping dictionary load")
                return
            
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


# Global instance
_vedda_stt_processor = None


def get_vedda_stt_processor():
    """Get Vedda STT processor instance"""
    global _vedda_stt_processor
    if _vedda_stt_processor is None:
        _vedda_stt_processor = VeddaSTTProcessor()
    return _vedda_stt_processor
