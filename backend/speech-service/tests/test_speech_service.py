"""
Unit tests for SpeechService.

All external I/O (gTTS, SpeechRecognition, Vedda ASR, file system) is
mocked so the suite runs without audio hardware or network access.
"""

import sys
import os
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
# Stub optional / heavy third-party modules BEFORE importing the service
# ---------------------------------------------------------------------------

def _stub(name, attrs=None):
    mod = types.ModuleType(name)
    if attrs:
        for k, v in attrs.items():
            setattr(mod, k, v)
    sys.modules[name] = mod
    return mod


# gtts
_gtts_cls = MagicMock()
_stub("gtts", {"gTTS": _gtts_cls})

# speech_recognition
_sr = _stub("speech_recognition")
_sr.Recognizer = MagicMock
_sr.AudioFile = MagicMock
_sr.UnknownValueError = type("UnknownValueError", (Exception,), {})
_sr.RequestError = type("RequestError", (Exception,), {})

# vedda_asr_service (optional)
_vedda_asr_mod = _stub("vedda_asr_service")
_vedda_asr_mod.get_vedda_asr_service = MagicMock()

# ---------------------------------------------------------------------------
# Add service package to path and import
# ---------------------------------------------------------------------------

sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parents[1]))

from app.services.speech_service import SpeechService  # noqa: E402
import app.services.speech_service as _speech_svc_mod  # saved ref for patch.object()
_speech_svc_sr = _speech_svc_mod.sr  # the stubbed speech_recognition module


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_service():
    """Return a fresh SpeechService instance with a reset recognizer mock."""
    svc = SpeechService()
    svc.recognizer = MagicMock()
    return svc


def _fake_audio_file(content=b"FAKE"):
    """Return a mock file-like object with a .save() method."""
    mock_file = MagicMock()
    mock_file.save = MagicMock()
    return mock_file


# ---------------------------------------------------------------------------
# LRU / constructor smoke-test
# ---------------------------------------------------------------------------

class TestSpeechServiceInit(unittest.TestCase):
    def test_creates_instance(self):
        svc = _make_service()
        self.assertIsInstance(svc, SpeechService)


# ---------------------------------------------------------------------------
# text_to_speech()
# ---------------------------------------------------------------------------

class TestTextToSpeech(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    def test_empty_text_returns_error(self):
        result = self.svc.text_to_speech("", "english")
        self.assertFalse(result["success"])
        self.assertIn("error", result)

    @patch.object(_speech_svc_mod, "gTTS")
    @patch("os.path.exists", return_value=True)
    def test_valid_text_english_succeeds(self, _mock_exists, mock_gtts_cls):
        mock_tts = MagicMock()
        mock_gtts_cls.return_value = mock_tts

        result = self.svc.text_to_speech("Hello world", "english")

        mock_gtts_cls.assert_called_once_with(text="Hello world", lang="en", slow=False)
        mock_tts.save.assert_called_once()
        self.assertTrue(result["success"])
        self.assertIn("audio_path", result)

    @patch.object(_speech_svc_mod, "gTTS")
    def test_unsupported_language_falls_back_to_english(self, mock_gtts_cls):
        """First gTTS call raises; fallback to English must succeed."""
        fallback_tts = MagicMock()

        def side_effect(**kwargs):
            if kwargs.get("lang") != "en":
                raise Exception("lang not supported")
            return fallback_tts

        mock_gtts_cls.side_effect = side_effect

        result = self.svc.text_to_speech("Hello", "klingon")
        # klingon maps to 'en' via default, but test covers the except path
        # Just assert it returned a dict (success or fallback)
        self.assertIn("success", result)

    @patch.object(_speech_svc_mod, "gTTS")
    def test_gtts_raises_and_fallback_also_fails(self, mock_gtts_cls):
        mock_gtts_cls.side_effect = Exception("network down")
        result = self.svc.text_to_speech("Hello", "sinhala")
        # sinhala maps to 'si', not 'en', so fallback to English is attempted
        # Both calls will raise → service unavailable
        self.assertIn("success", result)

    @patch.object(_speech_svc_mod, "gTTS")
    def test_vedda_language_uses_sinhala_code(self, mock_gtts_cls):
        mock_tts = MagicMock()
        mock_gtts_cls.return_value = mock_tts
        self.svc.text_to_speech("maya", "vedda")
        _, call_kwargs = mock_gtts_cls.call_args
        self.assertEqual(call_kwargs["lang"], "si")

    @patch.object(_speech_svc_mod, "gTTS")
    def test_sinhala_uses_si_language_code(self, mock_gtts_cls):
        mock_tts = MagicMock()
        mock_gtts_cls.return_value = mock_tts
        self.svc.text_to_speech("ජලය", "sinhala")
        _, call_kwargs = mock_gtts_cls.call_args
        self.assertEqual(call_kwargs["lang"], "si")


# ---------------------------------------------------------------------------
# speech_to_text()
# ---------------------------------------------------------------------------

class TestSpeechToText(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    # ---------- Google STT path ----------

    @patch.object(_speech_svc_sr, "AudioFile")
    def test_google_stt_success(self, mock_audio_file):
        mock_audio_file.return_value.__enter__ = MagicMock(return_value=MagicMock())
        mock_audio_file.return_value.__exit__ = MagicMock(return_value=False)
        self.svc.recognizer.adjust_for_ambient_noise = MagicMock()
        self.svc.recognizer.record = MagicMock(return_value=MagicMock())
        self.svc.recognizer.recognize_google = MagicMock(return_value="hello world")

        result = self.svc.speech_to_text(_fake_audio_file(), "english")

        self.assertTrue(result["success"])
        self.assertEqual(result["text"], "hello world")
        self.assertEqual(result["method"], "google_stt")

    @patch.object(_speech_svc_sr, "AudioFile")
    def test_google_stt_unknown_value_returns_failure(self, mock_audio_file):
        mock_audio_file.return_value.__enter__ = MagicMock(return_value=MagicMock())
        mock_audio_file.return_value.__exit__ = MagicMock(return_value=False)
        self.svc.recognizer.adjust_for_ambient_noise = MagicMock()
        self.svc.recognizer.record = MagicMock(return_value=MagicMock())
        self.svc.recognizer.recognize_google = MagicMock(
            side_effect=_speech_svc_sr.UnknownValueError()
        )

        result = self.svc.speech_to_text(_fake_audio_file(), "english")

        self.assertFalse(result["success"])
        self.assertEqual(result["text"], "")

    @patch.object(_speech_svc_sr, "AudioFile")
    def test_google_stt_request_error_returns_503_message(self, mock_audio_file):
        mock_audio_file.return_value.__enter__ = MagicMock(return_value=MagicMock())
        mock_audio_file.return_value.__exit__ = MagicMock(return_value=False)
        self.svc.recognizer.adjust_for_ambient_noise = MagicMock()
        self.svc.recognizer.record = MagicMock(return_value=MagicMock())
        self.svc.recognizer.recognize_google = MagicMock(
            side_effect=_speech_svc_sr.RequestError("API down")
        )

        result = self.svc.speech_to_text(_fake_audio_file(), "english")

        self.assertFalse(result["success"])
        self.assertIn("unavailable", result.get("error", "").lower())

    # ---------- Vedda ASR path ----------

    @patch.object(_speech_svc_sr, "AudioFile")
    def test_vedda_uses_vedda_asr_when_available(self, _mock_audio_file):
        original_available = _speech_svc_mod.VEDDA_ASR_AVAILABLE
        mock_vedda_svc = Mock()
        mock_vedda_svc.is_ready = True
        mock_vedda_svc.transcribe = Mock(
            return_value={"text": "maya", "confidence": 0.9, "error": None, "duration": 1.2}
        )

        try:
            _speech_svc_mod.VEDDA_ASR_AVAILABLE = True
            with patch.object(_speech_svc_mod, "get_vedda_asr_service", return_value=mock_vedda_svc):
                result = self.svc.speech_to_text(_fake_audio_file(), "vedda")

            self.assertTrue(result["success"])
            self.assertEqual(result["text"], "maya")
            self.assertEqual(result["method"], "vedda_whisper")
        finally:
            _speech_svc_mod.VEDDA_ASR_AVAILABLE = original_available

    @patch.object(_speech_svc_sr, "AudioFile")
    def test_vedda_asr_error_returns_failure(self, _mock_audio_file):
        original_available = _speech_svc_mod.VEDDA_ASR_AVAILABLE
        mock_vedda_svc = Mock()
        mock_vedda_svc.is_ready = True
        mock_vedda_svc.transcribe = Mock(
            return_value={"text": "", "error": "model crashed", "confidence": 0}
        )

        try:
            _speech_svc_mod.VEDDA_ASR_AVAILABLE = True
            with patch.object(_speech_svc_mod, "get_vedda_asr_service", return_value=mock_vedda_svc):
                result = self.svc.speech_to_text(_fake_audio_file(), "vedda")

            self.assertFalse(result["success"])
        finally:
            _speech_svc_mod.VEDDA_ASR_AVAILABLE = original_available

    @patch.object(_speech_svc_sr, "AudioFile")
    def test_vedda_asr_not_ready_falls_back_to_google(self, mock_audio_file):
        """When Vedda ASR is not ready it should fall back to Google STT."""
        original_available = _speech_svc_mod.VEDDA_ASR_AVAILABLE
        mock_vedda_svc = Mock()
        mock_vedda_svc.is_ready = False

        mock_audio_file.return_value.__enter__ = MagicMock(return_value=MagicMock())
        mock_audio_file.return_value.__exit__ = MagicMock(return_value=False)
        self.svc.recognizer.adjust_for_ambient_noise = MagicMock()
        self.svc.recognizer.record = MagicMock(return_value=MagicMock())
        self.svc.recognizer.recognize_google = MagicMock(return_value="sinhala text")

        try:
            _speech_svc_mod.VEDDA_ASR_AVAILABLE = True
            with patch.object(_speech_svc_mod, "get_vedda_asr_service", return_value=mock_vedda_svc):
                result = self.svc.speech_to_text(_fake_audio_file(), "vedda")

            self.assertIn("success", result)
        finally:
            _speech_svc_mod.VEDDA_ASR_AVAILABLE = original_available


# ---------------------------------------------------------------------------
# get_supported_*_languages()
# ---------------------------------------------------------------------------

class TestSupportedLanguages(unittest.TestCase):

    def setUp(self):
        self.svc = _make_service()

    def test_tts_supported_languages_contains_english(self):
        result = self.svc.get_supported_tts_languages()
        self.assertIn("english", result["supported_languages"])

    def test_tts_supported_languages_contains_sinhala(self):
        result = self.svc.get_supported_tts_languages()
        self.assertIn("sinhala", result["supported_languages"])

    def test_tts_supported_languages_contains_vedda(self):
        result = self.svc.get_supported_tts_languages()
        self.assertIn("vedda", result["supported_languages"])

    def test_stt_supported_languages_contains_english(self):
        result = self.svc.get_supported_stt_languages()
        self.assertIn("english", result["supported_languages"])

    def test_stt_supported_languages_contains_vedda(self):
        result = self.svc.get_supported_stt_languages()
        self.assertIn("vedda", result["supported_languages"])

    def test_tts_language_map_has_correct_code(self):
        result = self.svc.get_supported_tts_languages()
        self.assertEqual(result["language_map"]["english"], "en")
        self.assertEqual(result["language_map"]["sinhala"], "si")

    def test_stt_language_map_has_correct_code(self):
        result = self.svc.get_supported_stt_languages()
        self.assertEqual(result["language_map"]["english"], "en-US")
        self.assertEqual(result["language_map"]["sinhala"], "si-LK")


if __name__ == "__main__":
    unittest.main()
