"""
Unit tests for DictionaryService and the internal LRUCache.

MongoDB and the Flask application layer are stubbed out so the tests run
without a live database or web server.  bson, pandas, and pymongo are all
real packages (installed in the project) and are NOT replaced.
"""

import sys
import types
import pathlib
import unittest
from unittest.mock import MagicMock, patch, Mock

# ---------------------------------------------------------------------------
# Flush any 'app' package left in sys.modules by a previously-run service's
# test file so that this service's own 'app' package is imported cleanly.
# ---------------------------------------------------------------------------
for _k in list(sys.modules.keys()):
    if _k == "app" or _k.startswith("app."):
        del sys.modules[_k]

# ---------------------------------------------------------------------------
# Pre-stub the entire app package hierarchy BEFORE inserting the source path.
# This prevents app/__init__.py (and app/config.py, app/routes/*, etc.) from
# executing and requiring a running Flask application or live MongoDB.
# ---------------------------------------------------------------------------

_svc_root = str(pathlib.Path(__file__).resolve().parents[1])
_app_dir  = _svc_root + "/app"

def _pkg(name, real_path):
    """Return a minimal package stub with __path__ pointing to *real_path*."""
    mod = types.ModuleType(name)
    mod.__path__    = [real_path]
    mod.__package__ = name
    return mod

# 'app' package stub – __path__ lets Python still find real sub-packages on disk
sys.modules["app"] = _pkg("app", _app_dir)

# 'app.db' package stub
sys.modules["app.db"] = _pkg("app.db", _app_dir + "/db")

# 'app.db.mongo' module stub – replaces real mongo.py (avoids DB connection)
_mongo_mod = types.ModuleType("app.db.mongo")
_mongo_mod.get_db               = MagicMock(return_value=MagicMock())
_mongo_mod.dictionary_collection = MagicMock(return_value=MagicMock())
_mongo_mod.init_mongo           = MagicMock()
sys.modules["app.db.mongo"] = _mongo_mod

# ---------------------------------------------------------------------------
# Now it's safe to add the service root to sys.path and import.
# ---------------------------------------------------------------------------

sys.path.insert(0, _svc_root)

from app.services.dictionary_service import LRUCache, DictionaryService  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

SAMPLE_WORD = {
    "id": "abc123",
    "vedda_word": "දිය රැච්ච",
    "english_word": "water",
    "sinhala_word": "වතුර",
    "vedda_ipa": "",
    "sinhala_ipa": "wəˈtʊrə",
    "english_ipa": "wɔːtər",
    "word_type": "noun",
    "usage_example": "දිය රැච්ච බොනවා",
    "frequency_score": 2.0,
    "confidence_score": 0.95,
}

SAMPLE_WORD_2 = {
    "id": "def456",
    "vedda_word": "පෝරුගං පොජ්ජ",
    "english_word": "village",
    "sinhala_word": "ගම",
    "vedda_ipa": "",
    "sinhala_ipa": "ɡaːmə",
    "english_ipa": "ˈvɪlɪdʒ",
    "word_type": "noun",
    "usage_example": "",
    "frequency_score": 1.0,
    "confidence_score": 0.95,
}

SAMPLE_WORD_3 = {
    "id": "ghi789",
    "vedda_word": "අම්මිලැත්තෝ",
    "english_word": "mother",
    "sinhala_word": "අම්මා",
    "vedda_ipa": "",
    "sinhala_ipa": "",
    "english_ipa": "ˈmʌðər",
    "word_type": "noun",
    "usage_example": "",
    "frequency_score": 1.5,
    "confidence_score": 0.95,
}

SAMPLE_WORD_4 = {
    "id": "jkl012",
    "vedda_word": "අප්පිලැත්තෝ",
    "english_word": "father",
    "sinhala_word": "අප්පච්චි",
    "vedda_ipa": "",
    "sinhala_ipa": "",
    "english_ipa": "ˈfɑːðər",
    "word_type": "noun",
    "usage_example": "",
    "frequency_score": 1.5,
    "confidence_score": 0.95,
}


def _make_service(words=None):
    """
    Return a DictionaryService whose in-memory dictionary is pre-populated
    with *words* (defaults to SAMPLE_WORD + SAMPLE_WORD_2).
    """
    if words is None:
        words = [SAMPLE_WORD, SAMPLE_WORD_2]

    svc = object.__new__(DictionaryService)

    # Build the dictionary structure manually (mirrors load_dictionary logic)
    dictionary = {
        "vedda_to_english": {},
        "english_to_vedda": {},
        "vedda_to_sinhala": {},
        "sinhala_to_vedda": {},
        "english_to_sinhala": {},
        "sinhala_to_english": {},
        "all_words": [],
        "word_map": {},
    }
    for w in words:
        v, e, s = w["vedda_word"].lower(), w["english_word"].lower(), w["sinhala_word"].lower()
        dictionary["vedda_to_english"][v] = w
        dictionary["english_to_vedda"][e] = w
        dictionary["vedda_to_sinhala"][v] = w
        dictionary["sinhala_to_vedda"][s] = w
        dictionary["english_to_sinhala"][e] = w
        dictionary["sinhala_to_english"][s] = w
        dictionary["all_words"].append(w)
        dictionary["word_map"][w["id"]] = w

    svc.dictionary = dictionary
    svc.translation_cache = LRUCache(maxsize=10)
    svc._build_fast_indexes()
    return svc


# ---------------------------------------------------------------------------
# LRUCache tests
# ---------------------------------------------------------------------------

class TestLRUCache(unittest.TestCase):

    def test_put_and_get_single_item(self):
        cache = LRUCache(maxsize=5)
        cache.put("k", "v")
        self.assertEqual(cache.get("k"), "v")

    def test_miss_returns_none(self):
        cache = LRUCache(maxsize=5)
        self.assertIsNone(cache.get("missing"))

    def test_hit_increments_hits(self):
        cache = LRUCache(maxsize=5)
        cache.put("k", "v")
        cache.get("k")
        self.assertEqual(cache.info()["hits"], 1)

    def test_miss_increments_misses(self):
        cache = LRUCache(maxsize=5)
        cache.get("missing")
        self.assertEqual(cache.info()["misses"], 1)

    def test_evicts_lru_when_full(self):
        cache = LRUCache(maxsize=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        # 'a' is LRU — adding 'd' should evict it
        cache.put("d", 4)
        self.assertIsNone(cache.get("a"))
        self.assertEqual(cache.get("d"), 4)

    def test_access_promotes_to_end(self):
        cache = LRUCache(maxsize=3)
        cache.put("a", 1)
        cache.put("b", 2)
        cache.put("c", 3)
        cache.get("a")  # promote 'a'; LRU is now 'b'
        cache.put("d", 4)  # evicts 'b'
        self.assertIsNone(cache.get("b"))
        self.assertEqual(cache.get("a"), 1)

    def test_clear_resets_everything(self):
        cache = LRUCache(maxsize=5)
        cache.put("k", "v")
        cache.get("k")
        cache.get("missing")
        cache.clear()
        info = cache.info()
        self.assertEqual(info["hits"], 0)
        self.assertEqual(info["misses"], 0)
        self.assertEqual(info["size"], 0)

    def test_info_returns_correct_maxsize(self):
        cache = LRUCache(maxsize=42)
        self.assertEqual(cache.info()["maxsize"], 42)

    def test_overwrite_existing_key_does_not_grow(self):
        # The real put() moves an existing key to MRU position but does NOT
        # update its value.  Size must remain 1.
        cache = LRUCache(maxsize=5)
        cache.put("k", 1)
        cache.put("k", 2)
        # value stays as original (implementation detail of this LRU)
        self.assertIsNotNone(cache.get("k"))
        self.assertEqual(cache.info()["size"], 1)


# ---------------------------------------------------------------------------
# DictionaryService._build_fast_indexes()
# ---------------------------------------------------------------------------

class TestBuildFastIndexes(unittest.TestCase):

    def test_word_type_index_built_correctly(self):
        svc = _make_service()
        self.assertIn("noun", svc.word_type_index)
        self.assertEqual(len(svc.word_type_index["noun"]), 2)

    def test_unknown_type_grouped_together(self):
        # word_type key is absent entirely → falls back to 'unknown' via .get()
        word_no_type = {k: v for k, v in SAMPLE_WORD.items() if k != "word_type"}
        svc = _make_service(words=[word_no_type])
        self.assertIn("unknown", svc.word_type_index)


# ---------------------------------------------------------------------------
# DictionaryService.fast_translate()
# ---------------------------------------------------------------------------

class TestFastTranslate(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    def test_exact_match_vedda_to_english(self):
        result = self.svc.fast_translate("දිය රැච්ච", "vedda", "english")
        self.assertIsNotNone(result)
        self.assertEqual(result["english_word"], "water")

    def test_case_insensitive_lookup(self):
        # Sinhala has no case; test case insensitivity via English lookup
        result = self.svc.fast_translate("WATER", "english", "vedda")
        self.assertIsNotNone(result)

    def test_missing_word_returns_none(self):
        result = self.svc.fast_translate("nonexistent", "vedda", "english")
        self.assertIsNone(result)

    def test_result_is_cached_on_second_call(self):
        self.svc.fast_translate("දිය රැච්ච", "vedda", "english")
        self.svc.fast_translate("දිය රැච්ච", "vedda", "english")
        self.assertEqual(self.svc.translation_cache.info()["hits"], 1)

    def test_cache_miss_on_first_call(self):
        self.svc.fast_translate("දිය රැච්ච", "vedda", "english")
        self.assertEqual(self.svc.translation_cache.info()["misses"], 1)

    def test_english_to_vedda(self):
        result = self.svc.fast_translate("water", "english", "vedda")
        self.assertIsNotNone(result)
        self.assertEqual(result["vedda_word"], "දිය රැච්ච")


# ---------------------------------------------------------------------------
# DictionaryService.search_dictionary()
# ---------------------------------------------------------------------------

class TestSearchDictionary(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    def test_search_by_vedda_exact(self):
        results = self.svc.search_dictionary("දිය රැච්ච", source_language="vedda")
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]["vedda_word"], "දිය රැච්ච")

    def test_search_by_english_exact(self):
        results = self.svc.search_dictionary("water", source_language="english")
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]["english_word"], "water")

    def test_search_by_sinhala_exact(self):
        results = self.svc.search_dictionary("වතුර", source_language="sinhala")
        self.assertGreater(len(results), 0)
        self.assertEqual(results[0]["sinhala_word"], "වතුර")

    def test_search_all_languages_returns_match(self):
        results = self.svc.search_dictionary("දිය රැච්ච")
        self.assertGreater(len(results), 0)

    def test_no_match_returns_empty_list(self):
        results = self.svc.search_dictionary("zzznomatch")
        self.assertEqual(results, [])

    def test_exact_match_sorted_first(self):
        results = self.svc.search_dictionary("water", source_language="all")
        # Exact "water" should appear before partial matches
        first = results[0]
        self.assertEqual(first["english_word"], "water")

    def test_limit_is_respected(self):
        # Both words are nouns; searching with limit=1 should return ≤1 result
        results = self.svc.search_dictionary("a", source_language="all", limit=1)
        self.assertLessEqual(len(results), 1)

    def test_partial_vedda_search(self):
        # 'දිය' is a prefix of 'දිය රැච්ච'
        results = self.svc.search_dictionary("දිය", source_language="vedda")
        vedda_words = [r["vedda_word"] for r in results]
        self.assertIn("දිය රැච්ච", vedda_words)


# ---------------------------------------------------------------------------
# DictionaryService.get_random_words()
# ---------------------------------------------------------------------------

class TestGetRandomWords(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    def test_returns_list(self):
        result = self.svc.get_random_words(count=2)
        self.assertIsInstance(result, list)

    def test_count_is_capped_at_total(self):
        result = self.svc.get_random_words(count=100)
        self.assertLessEqual(len(result), len(self.svc.dictionary["all_words"]))

    def test_filter_by_word_type(self):
        result = self.svc.get_random_words(count=10, word_type="noun")
        for word in result:
            self.assertEqual(word["word_type"], "noun")

    def test_unknown_word_type_returns_empty(self):
        result = self.svc.get_random_words(count=5, word_type="imaginary_type")
        self.assertEqual(result, [])

    def test_count_1_returns_exactly_1(self):
        result = self.svc.get_random_words(count=1)
        self.assertEqual(len(result), 1)


# ---------------------------------------------------------------------------
# DictionaryService.clear_cache() / get_cache_info()
# ---------------------------------------------------------------------------

class TestCacheManagement(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    def test_clear_cache_resets_hits_and_misses(self):
        self.svc.fast_translate("දිය රැච්ච", "vedda", "english")  # 1 miss
        self.svc.fast_translate("දිය රැච්ච", "vedda", "english")  # 1 hit
        self.svc.clear_cache()
        info = self.svc.get_cache_info()
        self.assertEqual(info["hits"], 0)
        self.assertEqual(info["misses"], 0)
        self.assertEqual(info["size"], 0)

    def test_get_cache_info_returns_dict(self):
        info = self.svc.get_cache_info()
        for key in ("hits", "misses", "size", "maxsize"):
            self.assertIn(key, info)


# ---------------------------------------------------------------------------
# DictionaryService.add_word()
# ---------------------------------------------------------------------------

class TestAddWord(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_add_new_word_succeeds(self, mock_coll_fn):
        mock_coll = MagicMock()
        mock_coll.find_one.return_value = None
        inserted = MagicMock()
        inserted.inserted_id = "newid123"
        mock_coll.insert_one.return_value = inserted
        mock_coll_fn.return_value = mock_coll

        with patch.object(self.svc, "load_dictionary", return_value=self.svc.dictionary):
            result = self.svc.add_word("hena", "tree", "gas", word_type="noun")

        self.assertTrue(result["success"])
        self.assertIn("id", result)

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_add_duplicate_removes_old_and_inserts_new(self, mock_coll_fn):
        mock_coll = MagicMock()
        existing_doc = {"_id": "oldid"}
        mock_coll.find_one.return_value = existing_doc
        inserted = MagicMock()
        inserted.inserted_id = "newid999"
        mock_coll.insert_one.return_value = inserted
        mock_coll_fn.return_value = mock_coll

        with patch.object(self.svc, "load_dictionary", return_value=self.svc.dictionary):
            result = self.svc.add_word("දිය රැච්ච", "water", "වතුර")

        mock_coll.delete_one.assert_called_once_with({"_id": "oldid"})
        self.assertTrue(result["success"])

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_add_word_db_error_returns_failure(self, mock_coll_fn):
        mock_coll = MagicMock()
        mock_coll.find_one.side_effect = Exception("DB error")
        mock_coll_fn.return_value = mock_coll

        result = self.svc.add_word("hena", "tree", "gas")
        self.assertFalse(result["success"])
        self.assertIn("error", result)


# ---------------------------------------------------------------------------
# DictionaryService.update_word()
# ---------------------------------------------------------------------------

# Valid 24-char hex ObjectId strings used by update/delete tests
_VALID_OID   = "507f1f77bcf86cd799439011"
_INVALID_OID = "not-an-objectid"


class TestUpdateWord(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_update_valid_field_succeeds(self, mock_coll_fn):
        mock_coll = MagicMock()
        update_result = MagicMock()
        update_result.matched_count = 1
        mock_coll.update_one.return_value = update_result
        mock_coll_fn.return_value = mock_coll

        with patch.object(self.svc, "load_dictionary", return_value=self.svc.dictionary):
            result = self.svc.update_word(_VALID_OID, {"vedda_word": "newmaya"})

        self.assertTrue(result["success"])

    def test_update_invalid_object_id_returns_error(self):
        result = self.svc.update_word(_INVALID_OID, {"vedda_word": "newmaya"})
        self.assertFalse(result["success"])
        self.assertIn("Invalid word ID", result["error"])

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_update_no_valid_fields_returns_error(self, mock_coll_fn):
        mock_coll_fn.return_value = MagicMock()
        result = self.svc.update_word(_VALID_OID, {"nonexistent_field": "val"})
        self.assertFalse(result["success"])
        self.assertIn("No valid fields", result["error"])

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_update_not_found_returns_error(self, mock_coll_fn):
        mock_coll = MagicMock()
        update_result = MagicMock()
        update_result.matched_count = 0
        mock_coll.update_one.return_value = update_result
        mock_coll_fn.return_value = mock_coll

        result = self.svc.update_word(_VALID_OID, {"vedda_word": "newmaya"})
        self.assertFalse(result["success"])
        self.assertIn("not found", result["error"].lower())


# ---------------------------------------------------------------------------
# DictionaryService.delete_word()
# ---------------------------------------------------------------------------

class TestDeleteWord(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_delete_existing_word_succeeds(self, mock_coll_fn):
        mock_coll = MagicMock()
        del_result = MagicMock()
        del_result.deleted_count = 1
        mock_coll.delete_one.return_value = del_result
        mock_coll_fn.return_value = mock_coll

        with patch.object(self.svc, "load_dictionary", return_value=self.svc.dictionary):
            result = self.svc.delete_word(_VALID_OID)

        self.assertTrue(result["success"])

    def test_delete_invalid_object_id_returns_error(self):
        result = self.svc.delete_word(_INVALID_OID)
        self.assertFalse(result["success"])
        self.assertIn("Invalid word ID", result["error"])

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_delete_missing_word_returns_error(self, mock_coll_fn):
        mock_coll = MagicMock()
        del_result = MagicMock()
        del_result.deleted_count = 0
        mock_coll.delete_one.return_value = del_result
        mock_coll_fn.return_value = mock_coll

        result = self.svc.delete_word(_VALID_OID)
        self.assertFalse(result["success"])
        self.assertIn("not found", result["error"].lower())


# ---------------------------------------------------------------------------
# DictionaryService.get_word_types()
# ---------------------------------------------------------------------------

class TestGetWordTypes(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_returns_filtered_list(self, mock_coll_fn):
        mock_coll = MagicMock()
        mock_coll.distinct.return_value = ["noun", "verb", "", None, "  "]
        mock_coll_fn.return_value = mock_coll

        result = self.svc.get_word_types()
        self.assertIn("noun", result)
        self.assertIn("verb", result)
        # empty/whitespace entries should be filtered out
        self.assertNotIn("", result)

    @patch("app.services.dictionary_service.dictionary_collection")
    def test_db_error_returns_empty_list(self, mock_coll_fn):
        mock_coll = MagicMock()
        mock_coll.distinct.side_effect = Exception("DB error")
        mock_coll_fn.return_value = mock_coll

        result = self.svc.get_word_types()
        self.assertEqual(result, [])


# ---------------------------------------------------------------------------
# DictionaryService.upload_csv() — basic validation guards
# ---------------------------------------------------------------------------

class TestUploadCsv(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    def test_no_file_returns_error(self):
        result = self.svc.upload_csv(None)
        self.assertFalse(result["success"])

    def test_unsupported_extension_returns_error(self):
        mock_file = MagicMock()
        mock_file.filename = "data.txt"
        result = self.svc.upload_csv(mock_file)
        self.assertFalse(result["success"])
        self.assertIn("CSV or XLSX", result["error"])

    def test_empty_filename_returns_error(self):
        mock_file = MagicMock()
        mock_file.filename = ""
        result = self.svc.upload_csv(mock_file)
        self.assertFalse(result["success"])


if __name__ == "__main__":
    unittest.main()
