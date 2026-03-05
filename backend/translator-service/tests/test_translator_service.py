"""
Unit tests for VeddaTranslator service.

All external dependencies (HTTP calls, IPA libraries, sinling) are mocked
so the tests run without any network access or optional packages installed.
"""

import sys
import types
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
# Stub optional third-party modules before the real module is imported
# ---------------------------------------------------------------------------

def _make_stub_module(name):
    mod = types.ModuleType(name)
    sys.modules[name] = mod
    return mod


# eng_to_ipa stub
_ipa_mod = _make_stub_module("eng_to_ipa")
_ipa_mod.convert = lambda text: f"/{text}/"  # simple passthrough

# sinling stub
_sinling_mod = _make_stub_module("sinling")
_sinling_mod.SinhalaTokenizer = MagicMock()

# requests stub (so HTTPAdapter / Session can be constructed without real network)
import requests as _real_requests  # noqa: E402  (imported after stubs)

# ---------------------------------------------------------------------------
# Now import the module under test
# ---------------------------------------------------------------------------
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))

from app.services.translator_service import VeddaTranslator  # noqa: E402
import app.services.translator_service as _translator_svc_mod  # saved ref for patch.object()


# ---------------------------------------------------------------------------
# Helper factory
# ---------------------------------------------------------------------------

def _make_translator(**kwargs):
    """Create a VeddaTranslator with pre-warm disabled."""
    defaults = dict(
        dictionary_service_url="http://dict",
        history_service_url="http://history",
        google_translate_url="http://google-translate",
    )
    defaults.update(kwargs)
    with patch.object(VeddaTranslator, "_prewarm_connections", return_value=None):
        return VeddaTranslator(**defaults)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

class TestGenerateEnglishIPA(unittest.TestCase):
    """generate_english_ipa()"""

    def setUp(self):
        self.t = _make_translator()

    def test_returns_empty_for_empty_text(self):
        result = self.t.generate_english_ipa("")
        self.assertEqual(result, "")

    def test_converts_text_when_ipa_available(self):
        # The stub convert() just wraps the text in slashes
        result = self.t.generate_english_ipa("hello")
        self.assertEqual(result, "/hello/")

    def test_returns_empty_when_ipa_unavailable(self):
        mod = _translator_svc_mod
        original = mod.IPA_AVAILABLE
        try:
            mod.IPA_AVAILABLE = False
            result = self.t.generate_english_ipa("hello")
            self.assertEqual(result, "")
        finally:
            mod.IPA_AVAILABLE = original


class TestGenerateVeddaSinhalaIPA(unittest.TestCase):
    """generate_vedda_sinhala_ipa()"""

    def setUp(self):
        self.t = _make_translator()

    def test_returns_empty_for_empty_text(self):
        result = self.t.generate_vedda_sinhala_ipa("")
        self.assertEqual(result, "")

    def test_maps_sinhala_vowel_to_ipa(self):
        # 'අ' maps to 'ə'
        result = self.t.generate_vedda_sinhala_ipa("අ")
        self.assertIn("ə", result)

    def test_maps_sinhala_consonant_to_ipa(self):
        # 'ක' maps to 'ka'
        result = self.t.generate_vedda_sinhala_ipa("ක")
        self.assertIn("ka", result)

    def test_returns_empty_when_sinling_unavailable(self):
        mod = _translator_svc_mod
        original = mod.SINLING_AVAILABLE
        try:
            mod.SINLING_AVAILABLE = False
            result = self.t.generate_vedda_sinhala_ipa("ක")
            self.assertEqual(result, "")
        finally:
            mod.SINLING_AVAILABLE = original


class TestGenerateSinglishRomanization(unittest.TestCase):
    """generate_singlish_romanization()"""

    def setUp(self):
        self.t = _make_translator()

    def test_returns_empty_for_empty_text(self):
        result = self.t.generate_singlish_romanization("")
        self.assertEqual(result, "")

    def test_maps_sinhala_vowel_to_singlish(self):
        # 'අ' maps to 'a'
        result = self.t.generate_singlish_romanization("අ")
        self.assertEqual(result, "a")

    def test_maps_sinhala_consonant_to_singlish(self):
        # 'ක' maps to 'ka'
        result = self.t.generate_singlish_romanization("ක")
        self.assertEqual(result, "ka")

    def test_unmapped_character_passed_through(self):
        result = self.t.generate_singlish_romanization("X")
        self.assertIn("X", result)

    def test_returns_empty_when_sinling_unavailable(self):
        mod = _translator_svc_mod
        original = mod.SINLING_AVAILABLE
        try:
            mod.SINLING_AVAILABLE = False
            result = self.t.generate_singlish_romanization("ක")
            self.assertEqual(result, "")
        finally:
            mod.SINLING_AVAILABLE = original


class TestBatchTranslateDictionary(unittest.TestCase):
    """batch_translate_dictionary()"""

    def setUp(self):
        self.t = _make_translator()

    def _mock_response(self, payload, status=200):
        resp = Mock()
        resp.status_code = status
        resp.json.return_value = payload
        return resp

    def test_returns_result_dict_on_success(self):
        payload = {
            "success": True,
            "translations": [
                {"word": "water", "found": True, "translation": "watura"}
            ],
        }
        self.t.session.post = Mock(return_value=self._mock_response(payload))
        result = self.t.batch_translate_dictionary(["water"], "sinhala", "vedda")
        self.assertIn("water", result)
        self.assertTrue(result["water"]["found"])
        self.assertEqual(result["water"]["translation"], "watura")

    def test_returns_empty_dict_on_non_200(self):
        self.t.session.post = Mock(return_value=self._mock_response({}, status=500))
        result = self.t.batch_translate_dictionary(["water"], "sinhala", "vedda")
        self.assertEqual(result, {})

    def test_returns_empty_dict_on_exception(self):
        self.t.session.post = Mock(side_effect=Exception("network error"))
        result = self.t.batch_translate_dictionary(["water"], "sinhala", "vedda")
        self.assertEqual(result, {})

    def test_returns_empty_dict_when_success_false(self):
        payload = {"success": False}
        self.t.session.post = Mock(return_value=self._mock_response(payload))
        result = self.t.batch_translate_dictionary(["water"], "sinhala", "vedda")
        self.assertEqual(result, {})


class TestSearchDictionary(unittest.TestCase):
    """search_dictionary()"""

    def setUp(self):
        self.t = _make_translator()

    def _mock_response(self, payload, status=200):
        resp = Mock()
        resp.status_code = status
        resp.json.return_value = payload
        return resp

    def test_exact_match_returns_translation(self):
        payload = {
            "success": True,
            "count": 1,
            "results": [
                {
                    "vedda_word": "maya",
                    "english_word": "water",
                    "sinhala_word": "watura",
                    "vedda_ipa": "",
                    "english_ipa": "",
                    "sinhala_ipa": "",
                }
            ],
        }
        self.t.session.get = Mock(return_value=self._mock_response(payload))
        result = self.t.search_dictionary("maya", "vedda", "english")
        self.assertTrue(result["found"])
        self.assertEqual(result["translation"]["english"], "water")

    def test_not_found_returns_false(self):
        payload = {"success": True, "count": 0, "results": []}
        self.t.session.get = Mock(return_value=self._mock_response(payload))
        result = self.t.search_dictionary("unknownword", "vedda", "english")
        self.assertFalse(result["found"])

    def test_non_200_returns_not_found(self):
        self.t.session.get = Mock(return_value=self._mock_response({}, status=503))
        result = self.t.search_dictionary("maya", "vedda", "english")
        self.assertFalse(result["found"])

    def test_exception_returns_not_found(self):
        self.t.session.get = Mock(side_effect=Exception("timeout"))
        result = self.t.search_dictionary("maya", "vedda", "english")
        self.assertFalse(result["found"])


class TestGoogleTranslate(unittest.TestCase):
    """google_translate()"""

    def setUp(self):
        self.t = _make_translator()

    def _mock_response(self, body, status=200):
        resp = Mock()
        resp.status_code = status
        resp.json.return_value = body
        return resp

    def test_returns_translated_text(self):
        body = [[["hola", "hello", None, None, None]]]
        self.t.session.get = Mock(return_value=self._mock_response(body))
        result = self.t.google_translate("hello", "english", "spanish")
        self.assertEqual(result, "hola")

    def test_returns_none_on_non_200(self):
        self.t.session.get = Mock(return_value=self._mock_response({}, status=429))
        result = self.t.google_translate("hello", "english", "spanish")
        self.assertIsNone(result)

    def test_returns_none_on_exception(self):
        self.t.session.get = Mock(side_effect=Exception("timeout"))
        result = self.t.google_translate("hello", "english", "spanish")
        self.assertIsNone(result)

    def test_vedda_source_remapped_to_sinhala(self):
        """When source is 'vedda' the API must receive 'si', not 'vedda'."""
        captured = {}

        def fake_get(url, params=None, timeout=None):
            captured["params"] = params
            resp = Mock()
            resp.status_code = 200
            resp.json.return_value = [[["result", "", None, None]]]
            return resp

        self.t.session.get = fake_get
        self.t.google_translate("maya", "vedda", "english")
        self.assertEqual(captured["params"]["sl"], "si")

    def test_vedda_target_remapped_to_sinhala(self):
        """When target is 'vedda' the API must receive 'si'."""
        captured = {}

        def fake_get(url, params=None, timeout=None):
            captured["params"] = params
            resp = Mock()
            resp.status_code = 200
            resp.json.return_value = [[["result", "", None, None]]]
            return resp

        self.t.session.get = fake_get
        self.t.google_translate("water", "english", "vedda")
        self.assertEqual(captured["params"]["tl"], "si")


class TestTranslateText(unittest.TestCase):
    """translate_text() — main routing logic"""

    def setUp(self):
        self.t = _make_translator()

    def test_empty_text_returns_early(self):
        result = self.t.translate_text("   ", "english", "vedda")
        self.assertEqual(result["translated_text"], "")
        self.assertEqual(result["confidence"], 0)
        self.assertEqual(result["method"], "none")

    def test_routes_to_vedda_target(self):
        self.t.translate_to_vedda_via_sinhala = Mock(
            return_value={"translated_text": "maya", "confidence": 0.8, "method": "sinhala_to_vedda_bridge"}
        )
        result = self.t.translate_text("water", "english", "vedda")
        self.t.translate_to_vedda_via_sinhala.assert_called_once_with("water", "english")
        self.assertEqual(result["translated_text"], "maya")

    def test_routes_from_vedda_source(self):
        self.t.translate_from_vedda_via_sinhala = Mock(
            return_value={"translated_text": "water", "confidence": 0.9, "method": "vedda_to_sinhala_bridge"}
        )
        result = self.t.translate_text("maya", "vedda", "english")
        self.t.translate_from_vedda_via_sinhala.assert_called_once_with("maya", "english")
        self.assertEqual(result["translated_text"], "water")

    def test_routes_direct_translation(self):
        self.t.direct_translation = Mock(
            return_value={"translated_text": "hola", "confidence": 0.85, "method": "google_direct"}
        )
        result = self.t.translate_text("hello", "english", "spanish")
        self.t.direct_translation.assert_called_once_with("hello", "english", "spanish")
        self.assertEqual(result["translated_text"], "hola")


class TestDirectTranslation(unittest.TestCase):
    """direct_translation()"""

    def setUp(self):
        self.t = _make_translator()

    def test_success_returns_translated_text(self):
        self.t.google_translate = Mock(return_value="hola")
        result = self.t.direct_translation("hello", "english", "spanish")
        self.assertEqual(result["translated_text"], "hola")
        self.assertEqual(result["method"], "google_direct")
        self.assertGreater(result["confidence"], 0)

    def test_google_failure_returns_fallback(self):
        self.t.google_translate = Mock(return_value=None)
        result = self.t.direct_translation("hello", "english", "spanish")
        self.assertEqual(result["translated_text"], "hello")
        self.assertEqual(result["method"], "fallback")

    def test_english_target_generates_ipa(self):
        self.t.google_translate = Mock(return_value="hola")
        self.t.generate_english_ipa = Mock(return_value="/hoʊlə/")
        # source is english so source_ipa should be generated
        result = self.t.direct_translation("hello", "english", "spanish")
        # source_ipa generated
        self.t.generate_english_ipa.assert_called()


class TestSupportedLanguages(unittest.TestCase):
    """supported_languages attribute"""

    def setUp(self):
        self.t = _make_translator()

    def test_vedda_is_in_supported_languages(self):
        self.assertIn("vedda", self.t.supported_languages)

    def test_english_is_in_supported_languages(self):
        self.assertIn("english", self.t.supported_languages)

    def test_sinhala_is_in_supported_languages(self):
        self.assertIn("sinhala", self.t.supported_languages)


if __name__ == "__main__":
    unittest.main()
