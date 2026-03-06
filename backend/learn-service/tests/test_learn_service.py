"""
Unit tests for learn_service.

MongoDB is fully stubbed. Tests run without a live database or application context.
"""

import sys
import types
import pathlib
import unittest
from unittest.mock import MagicMock, patch
from datetime import datetime

# ---------------------------------------------------------------------------
# Flush any stale 'app' package from sys.modules
# ---------------------------------------------------------------------------
for _k in list(sys.modules.keys()):
    if _k == "app" or _k.startswith("app."):
        del sys.modules[_k]

# ---------------------------------------------------------------------------
# Service root path setup
# ---------------------------------------------------------------------------
_svc_root = str(pathlib.Path(__file__).resolve().parents[1])
_app_dir  = _svc_root + "/app"


def _pkg(name, real_path):
    """Return a minimal package stub with __path__ pointing to *real_path*."""
    mod = types.ModuleType(name)
    mod.__path__    = [real_path]
    mod.__package__ = name
    return mod


# ---------------------------------------------------------------------------
# Pre-stub package hierarchy to prevent Flask / DB / ML init
# ---------------------------------------------------------------------------
sys.modules["app"]                  = _pkg("app", _app_dir)
sys.modules["app.db"]               = _pkg("app.db", _app_dir + "/db")
sys.modules["app.models"]           = _pkg("app.models", _app_dir + "/models")
sys.modules["app.services"]         = _pkg("app.services", _app_dir + "/services")
sys.modules["app.ml"]               = _pkg("app.ml", _app_dir + "/ml")
sys.modules["app.config"]           = types.ModuleType("app.config")
sys.modules["app.routes"]           = _pkg("app.routes", _app_dir + "/routes")
sys.modules["app.ml.predictor"]     = types.ModuleType("app.ml.predictor")
sys.modules["app.ml.model_classes"] = types.ModuleType("app.ml.model_classes")

# app.db.mongo stub — avoids live MongoDB connection
_mongo_mod = types.ModuleType("app.db.mongo")
_mongo_mod.get_collection = MagicMock()
sys.modules["app.db.mongo"] = _mongo_mod

# ---------------------------------------------------------------------------
# Add service root to sys.path and import the module under test.
# challenge_model contains only pure functions (re + random) — load it for real.
# ---------------------------------------------------------------------------
sys.path.insert(0, _svc_root)

from app.services.learn_service import (  # noqa: E402
    save_user_lesson_progress,
    seed_challenges_if_empty,
    get_health_info,
    list_challenges_public,
    get_next_challenge_public,
    submit_challenge,
)
import app.services.learn_service as _learn_mod  # noqa: E402 — kept for patch.object


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fresh_col():
    """Return a fresh MagicMock mimicking a MongoDB collection."""
    col = MagicMock()
    col.find_one.return_value = None
    col.find.return_value = iter([])
    col.insert_one.return_value = MagicMock(inserted_id="fake_id")
    col.insert_many.return_value = MagicMock()
    col.update_one.return_value = MagicMock(modified_count=0)
    col.count_documents.return_value = 0
    return col


# Reusable challenge fixtures
FILL_BLANK_CH = {
    "_id": "id_fb",
    "id": "fb1",
    "type": "fill_blank",
    "prompt": "Type the English word for 'tree'",
    "answers": ["tree"],
    "xp": 20,
    "coins": 4,
    "timeLimitSec": 45,
}

MULTI_CHOICE_CH = {
    "_id": "id_mc",
    "id": "mc1",
    "type": "multiple_choice",
    "prompt": "Select the correct meaning",
    "options": [{"id": "A", "text": "sand"}, {"id": "B", "text": "stone"}],
    "correct": ["A"],
    "xp": 15,
    "coins": 3,
}

MATCH_PAIRS_CH = {
    "_id": "id_mp",
    "id": "mp1",
    "type": "match_pairs",
    "prompt": "Match the words",
    "pairs": [
        {"left": "ගස", "right": "tree"},
        {"left": "වතුර", "right": "water"},
    ],
    "xp": 25,
    "coins": 5,
}


# ---------------------------------------------------------------------------
# Tests: save_user_lesson_progress
# ---------------------------------------------------------------------------

class TestSaveUserLessonProgress(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_creates_new_record_when_not_exists(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        save_user_lesson_progress("user1", "lesson1", completed=False)

        col.insert_one.assert_called_once()
        doc = col.insert_one.call_args[0][0]
        self.assertEqual(doc["user_id"], "user1")
        self.assertEqual(doc["lesson_id"], "lesson1")
        self.assertFalse(doc["completed"])
        self.assertIsNone(doc["completed_at"])
        self.assertIn("started_at", doc)

    @patch.object(_learn_mod, "get_collection")
    def test_marks_completed_when_existing_record_not_completed(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "_id": "existing_id",
            "user_id": "user1",
            "lesson_id": "lesson1",
            "completed": False,
        }
        mock_get_col.return_value = col

        save_user_lesson_progress("user1", "lesson1", completed=True)

        col.update_one.assert_called_once()
        update = col.update_one.call_args[0][1]["$set"]
        self.assertTrue(update["completed"])
        self.assertIn("completed_at", update)

    @patch.object(_learn_mod, "get_collection")
    def test_skips_update_when_already_completed(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "_id": "existing_id",
            "user_id": "user1",
            "lesson_id": "lesson1",
            "completed": True,
        }
        mock_get_col.return_value = col

        save_user_lesson_progress("user1", "lesson1", completed=True)

        col.update_one.assert_not_called()

    @patch.object(_learn_mod, "get_collection")
    def test_creates_with_completed_true_on_first_call(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        save_user_lesson_progress("user1", "lesson1", completed=True)

        doc = col.insert_one.call_args[0][0]
        self.assertTrue(doc["completed"])
        self.assertIsNotNone(doc["completed_at"])


# ---------------------------------------------------------------------------
# Tests: seed_challenges_if_empty
# ---------------------------------------------------------------------------

class TestSeedChallengesIfEmpty(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_inserts_seed_data_when_collection_is_empty(self, mock_get_col):
        col = _fresh_col()
        col.count_documents.return_value = 0
        mock_get_col.return_value = col

        seed_challenges_if_empty()

        col.insert_many.assert_called_once()
        inserted = col.insert_many.call_args[0][0]
        self.assertGreater(len(inserted), 0)
        for ch in inserted:
            self.assertIn("id", ch)
            self.assertIn("type", ch)

    @patch.object(_learn_mod, "get_collection")
    def test_skips_seeding_when_collection_not_empty(self, mock_get_col):
        col = _fresh_col()
        col.count_documents.return_value = 5
        mock_get_col.return_value = col

        seed_challenges_if_empty()

        col.insert_many.assert_not_called()


# ---------------------------------------------------------------------------
# Tests: get_health_info
# ---------------------------------------------------------------------------

class TestGetHealthInfo(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_returns_healthy_status_with_challenge_count(self, mock_get_col):
        col = _fresh_col()
        col.count_documents.return_value = 7
        mock_get_col.return_value = col

        result = get_health_info()

        self.assertEqual(result["status"], "healthy")
        self.assertEqual(result["service"], "learn-service")
        self.assertEqual(result["database"], "MongoDB")
        self.assertEqual(result["challenge_count"], 7)
        self.assertIn("timestamp", result)

    @patch.object(_learn_mod, "get_collection")
    def test_challenge_count_zero_when_empty(self, mock_get_col):
        col = _fresh_col()
        col.count_documents.return_value = 0
        mock_get_col.return_value = col

        result = get_health_info()

        self.assertEqual(result["challenge_count"], 0)


# ---------------------------------------------------------------------------
# Tests: list_challenges_public
# ---------------------------------------------------------------------------

class TestListChallengesPublic(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_lists_all_when_no_type_filter(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([FILL_BLANK_CH, MULTI_CHOICE_CH])
        mock_get_col.return_value = col

        results = list_challenges_public(None)

        col.find.assert_called_once_with({})
        self.assertEqual(len(results), 2)

    @patch.object(_learn_mod, "get_collection")
    def test_filters_collection_by_type(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([FILL_BLANK_CH])
        mock_get_col.return_value = col

        results = list_challenges_public("fill_blank")

        col.find.assert_called_once_with({"type": "fill_blank"})
        self.assertEqual(len(results), 1)

    @patch.object(_learn_mod, "get_collection")
    def test_sanitizes_answer_fields(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([FILL_BLANK_CH])
        mock_get_col.return_value = col

        results = list_challenges_public(None)

        self.assertNotIn("answers", results[0])
        self.assertNotIn("correct", results[0])
        self.assertNotIn("_id", results[0])

    @patch.object(_learn_mod, "get_collection")
    def test_match_pairs_includes_shuffled_right_options(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([MATCH_PAIRS_CH])
        mock_get_col.return_value = col

        results = list_challenges_public(None)

        self.assertIn("rightOptions", results[0])
        right_opts = results[0]["rightOptions"]
        self.assertEqual(sorted(right_opts), sorted(["tree", "water"]))

    @patch.object(_learn_mod, "get_collection")
    def test_returns_empty_list_when_no_challenges(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([])
        mock_get_col.return_value = col

        results = list_challenges_public(None)

        self.assertEqual(results, [])


# ---------------------------------------------------------------------------
# Tests: get_next_challenge_public
# ---------------------------------------------------------------------------

class TestGetNextChallengePublic(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_returns_404_when_no_challenges_exist(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([])
        mock_get_col.return_value = col

        result, status = get_next_challenge_public(None)

        self.assertEqual(status, 404)
        self.assertIn("error", result)

    @patch.object(_learn_mod, "get_collection")
    def test_returns_200_with_sanitized_challenge(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([FILL_BLANK_CH])
        mock_get_col.return_value = col

        result, status = get_next_challenge_public(None)

        self.assertEqual(status, 200)
        self.assertNotIn("answers", result)
        self.assertNotIn("_id", result)

    @patch.object(_learn_mod, "get_collection")
    def test_filters_by_type_when_provided(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([MULTI_CHOICE_CH])
        mock_get_col.return_value = col

        get_next_challenge_public("multiple_choice")

        col.find.assert_called_once_with({"type": "multiple_choice"})


# ---------------------------------------------------------------------------
# Tests: submit_challenge — fill_blank
# ---------------------------------------------------------------------------

class TestSubmitChallengeFillBlank(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_correct_answer_gives_full_xp_and_coins(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "fb1", "type": "fill_blank", "answers": ["tree"], "xp": 20, "coins": 4
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({"challengeId": "fb1", "answer": "tree"})

        self.assertEqual(status, 200)
        self.assertTrue(result["correct"])
        self.assertEqual(result["xpAwarded"], 20)
        self.assertEqual(result["coinsAwarded"], 4)

    @patch.object(_learn_mod, "get_collection")
    def test_wrong_answer_gives_partial_xp(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "fb1", "type": "fill_blank", "answers": ["tree"], "xp": 20, "coins": 4
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({"challengeId": "fb1", "answer": "wrong"})

        self.assertEqual(status, 200)
        self.assertFalse(result["correct"])
        self.assertGreater(result["xpAwarded"], 0)
        self.assertLess(result["xpAwarded"], 20)

    @patch.object(_learn_mod, "get_collection")
    def test_answer_normalized_case_and_whitespace(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "fb1", "type": "fill_blank", "answers": ["tree"], "xp": 20, "coins": 4
        }
        mock_get_col.return_value = col

        result, _ = submit_challenge({"challengeId": "fb1", "answer": "  TREE  "})

        self.assertTrue(result["correct"])

    @patch.object(_learn_mod, "get_collection")
    def test_multiple_accepted_answers(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "fb2", "type": "fill_blank", "answers": ["eight", "8"], "xp": 20, "coins": 4
        }
        mock_get_col.return_value = col

        for answer in ("eight", "8"):
            result, status = submit_challenge({"challengeId": "fb2", "answer": answer})
            self.assertTrue(result["correct"], msg=f"Expected correct for answer '{answer}'")


# ---------------------------------------------------------------------------
# Tests: submit_challenge — multiple_choice
# ---------------------------------------------------------------------------

class TestSubmitChallengeMultipleChoice(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_correct_option_full_reward(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "mc1", "type": "multiple_choice", "correct": ["A"], "xp": 15, "coins": 3
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({"challengeId": "mc1", "answer": "A"})

        self.assertEqual(status, 200)
        self.assertTrue(result["correct"])
        self.assertEqual(result["xpAwarded"], 15)
        self.assertEqual(result["coinsAwarded"], 3)

    @patch.object(_learn_mod, "get_collection")
    def test_wrong_option_partial_reward(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "mc1", "type": "multiple_choice", "correct": ["A"], "xp": 15, "coins": 3
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({"challengeId": "mc1", "answer": "B"})

        self.assertFalse(result["correct"])
        self.assertGreater(result["xpAwarded"], 0)
        self.assertLess(result["xpAwarded"], 15)

    @patch.object(_learn_mod, "get_collection")
    def test_selected_option_key_also_accepted(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "mc1", "type": "multiple_choice", "correct": ["A"], "xp": 15, "coins": 3
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({"challengeId": "mc1", "selectedOption": "A"})

        self.assertTrue(result["correct"])


# ---------------------------------------------------------------------------
# Tests: submit_challenge — match_pairs
# ---------------------------------------------------------------------------

class TestSubmitChallengeMatchPairs(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_all_correct_pairs_full_reward(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "mp1", "type": "match_pairs",
            "pairs": [{"left": "ගස", "right": "tree"}, {"left": "වතුර", "right": "water"}],
            "xp": 25, "coins": 5,
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({
            "challengeId": "mp1",
            "answer": {"ගස": "tree", "වතුර": "water"},
        })

        self.assertEqual(status, 200)
        self.assertTrue(result["correct"])
        self.assertEqual(result["correctPairs"], 2)
        self.assertEqual(result["totalPairs"], 2)

    @patch.object(_learn_mod, "get_collection")
    def test_partial_pairs_partial_reward(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "mp1", "type": "match_pairs",
            "pairs": [{"left": "ගස", "right": "tree"}, {"left": "වතුර", "right": "water"}],
            "xp": 25, "coins": 5,
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({
            "challengeId": "mp1",
            "answer": {"ගස": "tree", "වතුර": "wrong"},
        })

        self.assertFalse(result["correct"])
        self.assertEqual(result["correctPairs"], 1)
        self.assertEqual(result["totalPairs"], 2)
        self.assertGreater(result["xpAwarded"], 0)

    @patch.object(_learn_mod, "get_collection")
    def test_zero_correct_pairs_zero_reward(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "mp1", "type": "match_pairs",
            "pairs": [{"left": "ගස", "right": "tree"}, {"left": "වතුර", "right": "water"}],
            "xp": 25, "coins": 5,
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({
            "challengeId": "mp1",
            "answer": {"ගස": "wrong1", "වතුර": "wrong2"},
        })

        self.assertFalse(result["correct"])
        self.assertEqual(result["xpAwarded"], 0)
        self.assertEqual(result["coinsAwarded"], 0)


# ---------------------------------------------------------------------------
# Tests: submit_challenge — edge cases
# ---------------------------------------------------------------------------

class TestSubmitChallengeEdgeCases(unittest.TestCase):

    @patch.object(_learn_mod, "get_collection")
    def test_missing_challenge_id_returns_400(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        result, status = submit_challenge({"answer": "tree"})

        self.assertEqual(status, 400)
        self.assertFalse(result["success"])

    @patch.object(_learn_mod, "get_collection")
    def test_unknown_challenge_id_returns_400(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        result, status = submit_challenge({"challengeId": "nonexistent", "answer": "x"})

        self.assertEqual(status, 400)
        self.assertFalse(result["success"])

    @patch.object(_learn_mod, "get_collection")
    def test_unsupported_challenge_type_returns_400(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "id": "xx1", "type": "audio_challenge", "xp": 10, "coins": 2
        }
        mock_get_col.return_value = col

        result, status = submit_challenge({"challengeId": "xx1", "answer": "anything"})

        self.assertEqual(status, 400)
        self.assertFalse(result["correct"])
        self.assertEqual(result["xpAwarded"], 0)


if __name__ == "__main__":
    unittest.main()
