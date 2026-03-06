"""
Unit tests for user_stats_service.

MongoDB is fully stubbed; the ML predictor is mocked.
Tests run without a live database or Flask application context.
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
sys.modules["app.ml"]               = _pkg("app.ml", _app_dir + "/ml")
sys.modules["app.services"]         = _pkg("app.services", _app_dir + "/services")
sys.modules["app.config"]           = types.ModuleType("app.config")
sys.modules["app.routes"]           = _pkg("app.routes", _app_dir + "/routes")
sys.modules["app.ml.model_classes"] = types.ModuleType("app.ml.model_classes")

# app.db.mongo stub — avoids live MongoDB connection
_mongo_mod = types.ModuleType("app.db.mongo")
_mongo_mod.get_collection = MagicMock()
sys.modules["app.db.mongo"] = _mongo_mod

# app.ml.predictor stub — avoids loading joblib model files
_predictor_mod = types.ModuleType("app.ml.predictor")
_predictor_mod.classify_mistake = MagicMock(return_value="spelling_error")
sys.modules["app.ml.predictor"] = _predictor_mod

# ---------------------------------------------------------------------------
# Add service root to sys.path, then import the real UserAttempt dataclass
# and the module under test
# ---------------------------------------------------------------------------
sys.path.insert(0, _svc_root)

from app.models.user_attempt_model import UserAttempt  # noqa: E402

_attempt_mod = types.ModuleType("app.models.user_attempt_model")
_attempt_mod.UserAttempt = UserAttempt
sys.modules["app.models.user_attempt_model"] = _attempt_mod

from app.services.user_stats_service import (  # noqa: E402
    update_user_stats,
    save_user_attempt,
    get_user_attempts,
    get_completed_exercise_ids,
    get_completed_challenge_ids,
    get_weak_skills_and_errors,
    get_leaderboard,
    add_user_attempt,
    add_user_attempt_and_update_stat,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fresh_col():
    """Return a fresh MagicMock mimicking a MongoDB collection."""
    col = MagicMock()
    col.find_one.return_value = None
    chain = MagicMock()
    chain.sort.return_value = chain
    chain.limit.return_value = []
    col.find.return_value = chain
    col.insert_one.return_value = MagicMock(inserted_id="fake_id")
    col.update_one.return_value = MagicMock(modified_count=0)
    col.distinct.return_value = []
    return col


# ---------------------------------------------------------------------------
# Tests: update_user_stats
# ---------------------------------------------------------------------------

class TestUpdateUserStats(unittest.TestCase):

    @patch("app.services.user_stats_service.get_collection")
    def test_creates_new_doc_for_new_user(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        update_user_stats("user1", ["vocabulary"], True, None, "general", 10)

        col.update_one.assert_called_once()
        doc = col.update_one.call_args[0][1]["$set"]
        self.assertEqual(doc["user_id"], "user1")
        self.assertEqual(doc["overall"]["total_attempts"], 1)
        self.assertEqual(doc["overall"]["total_correct"], 1)
        self.assertEqual(doc["overall"]["overall_accuracy"], 1.0)
        self.assertEqual(doc["total_points"], 10)

    @patch("app.services.user_stats_service.get_collection")
    def test_increments_existing_stats(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "user_id": "user1",
            "skill_stats": {},
            "error_stats": {},
            "total_points": 5,
            "overall": {"total_attempts": 2, "total_correct": 1, "overall_accuracy": 0.5},
            "overall_general": {"total_attempts": 2, "total_correct": 1, "overall_accuracy": 0.5},
            "overall_challenge": {"total_attempts": 0, "total_correct": 0, "overall_accuracy": 0.0},
        }
        mock_get_col.return_value = col

        update_user_stats("user1", [], False, "grammar_error", "general", 0)

        doc = col.update_one.call_args[0][1]["$set"]
        self.assertEqual(doc["overall"]["total_attempts"], 3)
        self.assertEqual(doc["overall"]["total_correct"], 1)
        self.assertAlmostEqual(doc["overall"]["overall_accuracy"], round(1 / 3, 2))
        self.assertEqual(doc["error_stats"].get("grammar_error"), 1)
        self.assertEqual(doc["total_points"], 5)  # not changed on wrong answer

    @patch("app.services.user_stats_service.get_collection")
    def test_skill_stats_created_for_each_tag(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        update_user_stats("user1", ["pronunciation", "vocabulary"], False, "spelling_error")

        doc = col.update_one.call_args[0][1]["$set"]
        for tag in ("pronunciation", "vocabulary"):
            self.assertIn(tag, doc["skill_stats"])
            self.assertEqual(doc["skill_stats"][tag]["attempts"], 1)
            self.assertEqual(doc["skill_stats"][tag]["wrong"], 1)
            self.assertEqual(doc["skill_stats"][tag]["accuracy"], 0.0)

    @patch("app.services.user_stats_service.get_collection")
    def test_skill_accuracy_computed_correctly(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {
            "user_id": "user1",
            "skill_stats": {
                "vocabulary": {"attempts": 4, "correct": 2, "wrong": 2, "accuracy": 0.5}
            },
            "error_stats": {},
            "total_points": 0,
            "overall": {"total_attempts": 4, "total_correct": 2, "overall_accuracy": 0.5},
            "overall_general": {"total_attempts": 4, "total_correct": 2, "overall_accuracy": 0.5},
            "overall_challenge": {"total_attempts": 0, "total_correct": 0, "overall_accuracy": 0.0},
        }
        mock_get_col.return_value = col

        update_user_stats("user1", ["vocabulary"], True, None, "general", 5)

        doc = col.update_one.call_args[0][1]["$set"]
        vocab = doc["skill_stats"]["vocabulary"]
        self.assertEqual(vocab["attempts"], 5)
        self.assertEqual(vocab["correct"], 3)
        self.assertAlmostEqual(vocab["accuracy"], round(3 / 5, 2))

    @patch("app.services.user_stats_service.get_collection")
    def test_challenge_type_updates_overall_challenge(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        update_user_stats("user1", [], True, None, "challenge", 5)

        doc = col.update_one.call_args[0][1]["$set"]
        self.assertEqual(doc["overall_challenge"]["total_attempts"], 1)
        self.assertEqual(doc["overall_challenge"]["total_correct"], 1)
        self.assertEqual(doc["overall_general"]["total_attempts"], 0)

    @patch("app.services.user_stats_service.get_collection")
    def test_points_not_added_when_incorrect(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        update_user_stats("user1", [], False, None, "general", 100)

        doc = col.update_one.call_args[0][1]["$set"]
        self.assertEqual(doc["total_points"], 0)

    @patch("app.services.user_stats_service.get_collection")
    def test_upsert_flag_passed(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        update_user_stats("user1", [], True, None)

        _, kwargs = col.update_one.call_args
        self.assertTrue(kwargs.get("upsert", False))


# ---------------------------------------------------------------------------
# Tests: save_user_attempt
# ---------------------------------------------------------------------------

class TestSaveUserAttempt(unittest.TestCase):

    @patch("app.services.user_stats_service.get_collection")
    def test_inserts_correct_fields(self, mock_get_col):
        col = _fresh_col()
        col.insert_one.return_value = MagicMock(inserted_id="id123")
        mock_get_col.return_value = col

        result = save_user_attempt("user1", "ex42", ["vocab"], True, None, "general")

        inserted = col.insert_one.call_args[0][0]
        self.assertEqual(inserted["user_id"], "user1")
        self.assertEqual(inserted["exercise_id"], "ex42")
        self.assertEqual(inserted["skill_tags"], ["vocab"])
        self.assertTrue(inserted["is_correct"])
        self.assertEqual(inserted["attempt_type"], "general")
        self.assertIn("timestamp", inserted)
        self.assertIn("_id", result)

    @patch("app.services.user_stats_service.get_collection")
    def test_returns_dict_with_stringified_id(self, mock_get_col):
        col = _fresh_col()
        col.insert_one.return_value = MagicMock(inserted_id="object_id_999")
        mock_get_col.return_value = col

        result = save_user_attempt("u", "e", [], False)

        self.assertIsInstance(result["_id"], str)
        self.assertEqual(result["_id"], "object_id_999")

    @patch("app.services.user_stats_service.get_collection")
    def test_default_attempt_type_is_general(self, mock_get_col):
        col = _fresh_col()
        col.insert_one.return_value = MagicMock(inserted_id="id1")
        mock_get_col.return_value = col

        save_user_attempt("u", "e", [], True)

        inserted = col.insert_one.call_args[0][0]
        self.assertEqual(inserted["attempt_type"], "general")


# ---------------------------------------------------------------------------
# Tests: get_user_attempts
# ---------------------------------------------------------------------------

class TestGetUserAttempts(unittest.TestCase):

    @patch("app.services.user_stats_service.get_collection")
    def test_returns_string_ids(self, mock_get_col):
        from bson import ObjectId
        col = _fresh_col()
        chain = MagicMock()
        chain.sort.return_value = chain
        chain.limit.return_value = [
            {"_id": ObjectId(), "user_id": "user1", "exercise_id": "ex1",
             "skill_tags": [], "is_correct": True, "attempt_type": "general",
             "timestamp": datetime.utcnow()},
            {"_id": ObjectId(), "user_id": "user1", "exercise_id": "ex2",
             "skill_tags": [], "is_correct": False, "attempt_type": "general",
             "timestamp": datetime.utcnow()},
        ]
        col.find.return_value = chain
        mock_get_col.return_value = col

        results = get_user_attempts("user1", limit=10)

        self.assertEqual(len(results), 2)
        for r in results:
            self.assertIsInstance(r["_id"], str)

    @patch("app.services.user_stats_service.get_collection")
    def test_filters_by_user_id(self, mock_get_col):
        col = _fresh_col()
        chain = MagicMock()
        chain.sort.return_value = chain
        chain.limit.return_value = []
        col.find.return_value = chain
        mock_get_col.return_value = col

        get_user_attempts("target_user")

        col.find.assert_called_once_with({"user_id": "target_user"})

    @patch("app.services.user_stats_service.get_collection")
    def test_returns_empty_list_when_no_attempts(self, mock_get_col):
        col = _fresh_col()
        chain = MagicMock()
        chain.sort.return_value = chain
        chain.limit.return_value = []
        col.find.return_value = chain
        mock_get_col.return_value = col

        results = get_user_attempts("user_no_attempts")

        self.assertEqual(results, [])


# ---------------------------------------------------------------------------
# Tests: get_completed_exercise_ids / get_completed_challenge_ids
# ---------------------------------------------------------------------------

class TestGetCompletedIds(unittest.TestCase):

    @patch("app.services.user_stats_service.get_collection")
    def test_exercise_ids_returns_distinct_results(self, mock_get_col):
        col = _fresh_col()
        col.distinct.return_value = ["ex1", "ex2", "ex3"]
        mock_get_col.return_value = col

        result = get_completed_exercise_ids("user1")

        self.assertEqual(result, ["ex1", "ex2", "ex3"])
        call_args = col.distinct.call_args[0]
        self.assertEqual(call_args[0], "exercise_id")

    @patch("app.services.user_stats_service.get_collection")
    def test_exercise_ids_queries_general_attempts(self, mock_get_col):
        col = _fresh_col()
        col.distinct.return_value = []
        mock_get_col.return_value = col

        get_completed_exercise_ids("user1")

        query = col.distinct.call_args[0][1]
        self.assertTrue(query["is_correct"])
        self.assertIn("$in", query["attempt_type"])

    @patch("app.services.user_stats_service.get_collection")
    def test_challenge_ids_filters_by_challenge_type(self, mock_get_col):
        col = _fresh_col()
        col.distinct.return_value = ["ch1", "ch2"]
        mock_get_col.return_value = col

        result = get_completed_challenge_ids("user1")

        self.assertEqual(result, ["ch1", "ch2"])
        query = col.distinct.call_args[0][1]
        self.assertEqual(query["attempt_type"], "challenge")

    @patch("app.services.user_stats_service.get_collection")
    def test_returns_empty_when_none_completed(self, mock_get_col):
        col = _fresh_col()
        col.distinct.return_value = []
        mock_get_col.return_value = col

        result = get_completed_exercise_ids("user1")

        self.assertEqual(result, [])


# ---------------------------------------------------------------------------
# Tests: get_weak_skills_and_errors
# ---------------------------------------------------------------------------

class TestGetWeakSkillsAndErrors(unittest.TestCase):

    def _stats(self, skill_data, error_data=None):
        return {
            "skill_stats": {
                skill: {
                    "attempts": d["attempts"],
                    "correct": d["correct"],
                    "wrong": d["attempts"] - d["correct"],
                    "accuracy": round(d["correct"] / d["attempts"], 2),
                }
                for skill, d in skill_data.items()
            },
            "error_stats": error_data or {},
        }

    def test_identifies_weak_skill_below_threshold(self):
        stats = self._stats({
            "vocabulary":   {"attempts": 10, "correct": 4},   # 0.4 → weak
            "pronunciation": {"attempts": 10, "correct": 8},  # 0.8 → ok
        })
        weak, _ = get_weak_skills_and_errors(stats)
        self.assertIn("vocabulary", weak)
        self.assertNotIn("pronunciation", weak)

    def test_skips_skills_below_min_attempts(self):
        stats = self._stats({"grammar": {"attempts": 3, "correct": 0}})
        weak, _ = get_weak_skills_and_errors(stats)
        self.assertEqual(weak, [])

    def test_skill_exactly_at_threshold_not_weak(self):
        stats = self._stats({"vocab": {"attempts": 10, "correct": 6}})  # accuracy = 0.6
        weak, _ = get_weak_skills_and_errors(stats)
        self.assertNotIn("vocab", weak)

    def test_returns_top_two_error_types(self):
        stats = self._stats({}, {
            "spelling_error": 5,
            "grammar_error": 3,
            "pronunciation_error": 1,
        })
        _, top_errors = get_weak_skills_and_errors(stats)
        self.assertEqual(len(top_errors), 2)
        self.assertEqual(top_errors[0], "spelling_error")
        self.assertEqual(top_errors[1], "grammar_error")

    def test_fewer_than_two_errors_returns_all(self):
        stats = self._stats({}, {"spelling_error": 2})
        _, top_errors = get_weak_skills_and_errors(stats)
        self.assertEqual(top_errors, ["spelling_error"])

    def test_empty_stats_returns_empty(self):
        weak, errors = get_weak_skills_and_errors({"skill_stats": {}, "error_stats": {}})
        self.assertEqual(weak, [])
        self.assertEqual(errors, [])


# ---------------------------------------------------------------------------
# Tests: get_leaderboard
# ---------------------------------------------------------------------------

class TestGetLeaderboard(unittest.TestCase):

    @patch("app.services.user_stats_service.get_collection")
    def test_leaderboard_ranks_and_flags_current_user(self, mock_get_col):
        from bson import ObjectId
        uid1, uid2 = str(ObjectId()), str(ObjectId())

        stats_col = _fresh_col()
        users_col = _fresh_col()
        mock_get_col.side_effect = lambda name: stats_col if name == "user_stats" else users_col

        chain = MagicMock()
        chain.sort.return_value = [
            {"user_id": uid1, "total_points": 100},
            {"user_id": uid2, "total_points": 50},
        ]
        stats_col.find.return_value = chain
        users_col.find.return_value = [
            {"_id": ObjectId(uid1), "username": "Alice"},
            {"_id": ObjectId(uid2), "username": "Bob"},
        ]

        board = get_leaderboard(current_user_id=uid1)

        self.assertEqual(len(board), 2)
        self.assertEqual(board[0]["name"], "Alice")
        self.assertEqual(board[0]["rank"], 1)
        self.assertEqual(board[0]["totalPoints"], 100)
        self.assertTrue(board[0]["is_current_user"])
        self.assertEqual(board[1]["rank"], 2)
        self.assertFalse(board[1]["is_current_user"])

    @patch("app.services.user_stats_service.get_collection")
    def test_unknown_user_gets_unknown_name(self, mock_get_col):
        from bson import ObjectId
        uid = str(ObjectId())

        stats_col = _fresh_col()
        users_col = _fresh_col()
        mock_get_col.side_effect = lambda name: stats_col if name == "user_stats" else users_col

        chain = MagicMock()
        chain.sort.return_value = [{"user_id": uid, "total_points": 10}]
        stats_col.find.return_value = chain
        users_col.find.return_value = []  # no matching user document

        board = get_leaderboard(current_user_id="other_user")

        self.assertEqual(board[0]["name"], "Unknown")

    @patch("app.services.user_stats_service.get_collection")
    def test_empty_stats_returns_empty_board(self, mock_get_col):
        stats_col = _fresh_col()
        users_col = _fresh_col()
        mock_get_col.side_effect = lambda name: stats_col if name == "user_stats" else users_col

        chain = MagicMock()
        chain.sort.return_value = []
        stats_col.find.return_value = chain
        users_col.find.return_value = []

        board = get_leaderboard(current_user_id="user1")

        self.assertEqual(board, [])


# ---------------------------------------------------------------------------
# Tests: add_user_attempt
# ---------------------------------------------------------------------------

class TestAddUserAttempt(unittest.TestCase):

    @patch("app.services.user_stats_service.get_collection")
    @patch("app.services.user_stats_service.classify_mistake")
    def test_classifies_mistake_and_saves(self, mock_classify, mock_get_col):
        mock_classify.return_value = "spelling_error"
        col = _fresh_col()
        col.insert_one.return_value = MagicMock(inserted_id="id1")
        mock_get_col.return_value = col

        result = add_user_attempt(
            user_id="user1",
            exercise_id="ex1",
            skill_tags=["vocab"],
            is_correct=False,
            correct_answer="tree",
            student_answer="trea",
        )

        mock_classify.assert_called_once_with("tree", "trea")
        self.assertEqual(result["error_type"], "spelling_error")
        self.assertIn("_id", result)

    @patch("app.services.user_stats_service.get_collection")
    @patch("app.services.user_stats_service.classify_mistake")
    def test_error_type_stored_from_classifier(self, mock_classify, mock_get_col):
        mock_classify.return_value = None
        col = _fresh_col()
        col.insert_one.return_value = MagicMock(inserted_id="id2")
        mock_get_col.return_value = col

        result = add_user_attempt(
            user_id="user1",
            exercise_id="ex1",
            skill_tags=[],
            is_correct=True,
            correct_answer="tree",
            student_answer="tree",
        )

        self.assertIsNone(result["error_type"])


# ---------------------------------------------------------------------------
# Tests: add_user_attempt_and_update_stat
# ---------------------------------------------------------------------------

class TestAddUserAttemptAndUpdateStat(unittest.TestCase):

    @patch("app.services.user_stats_service.update_user_stats")
    @patch("app.services.user_stats_service.save_user_attempt")
    def test_calls_save_and_update(self, mock_save, mock_update):
        mock_save.return_value = {"_id": "id1", "exercise_id": "ex1"}

        add_user_attempt_and_update_stat(
            user_id="user1",
            exercise_id="ex1",
            skill_tags=["vocab"],
            is_correct=True,
            attempt_type="general",
            points=10,
        )

        mock_save.assert_called_once()
        mock_update.assert_called_once()

    @patch("app.services.user_stats_service.update_user_stats")
    @patch("app.services.user_stats_service.save_user_attempt")
    def test_passes_correct_args_to_save(self, mock_save, mock_update):
        mock_save.return_value = {}

        add_user_attempt_and_update_stat(
            user_id="user1",
            exercise_id="ex42",
            skill_tags=["grammar"],
            is_correct=False,
            error_type="grammar_error",
            attempt_type="challenge",
        )

        save_args = mock_save.call_args[1]
        self.assertEqual(save_args["user_id"], "user1")
        self.assertEqual(save_args["exercise_id"], "ex42")
        self.assertEqual(save_args["attempt_type"], "challenge")
        self.assertEqual(save_args["error_type"], "grammar_error")


if __name__ == "__main__":
    unittest.main()
