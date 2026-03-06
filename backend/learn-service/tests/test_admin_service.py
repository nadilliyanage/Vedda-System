"""
Unit tests for admin_service.

MongoDB, user_stats_service, and Flask's g are all stubbed.
Tests run without a live database or Flask application context.
"""

import sys
import types
import pathlib
import unittest
from unittest.mock import MagicMock, patch
from bson import ObjectId

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
sys.modules["app.config"]           = types.ModuleType("app.config")
sys.modules["app.routes"]           = _pkg("app.routes", _app_dir + "/routes")
sys.modules["app.ml"]               = _pkg("app.ml", _app_dir + "/ml")
sys.modules["app.ml.predictor"]     = types.ModuleType("app.ml.predictor")
sys.modules["app.ml.model_classes"] = types.ModuleType("app.ml.model_classes")

# app.db.mongo stub — avoids live MongoDB connection
_mongo_mod = types.ModuleType("app.db.mongo")
_mongo_mod.get_collection = MagicMock()
sys.modules["app.db.mongo"] = _mongo_mod

# app.services.user_stats_service stub — avoids ML model loading
_uss_mod = types.ModuleType("app.services.user_stats_service")
_uss_mod.get_completed_exercise_ids = MagicMock(return_value=[])
_uss_mod.get_completed_challenge_ids = MagicMock(return_value=[])
sys.modules["app.services.user_stats_service"] = _uss_mod

# ---------------------------------------------------------------------------
# Add service root to sys.path.
# Replace flask.g (a Werkzeug LocalProxy) with a plain MagicMock BEFORE
# importing admin_service, so its module-level 'g' reference is mockable.
# ---------------------------------------------------------------------------
sys.path.insert(0, _svc_root)

import flask as _flask_module  # noqa: E402
_flask_module.g = MagicMock()   # replace LocalProxy — safe outside app context

from app.services.admin_service import (  # noqa: E402
    admin_list_challenges,
    admin_create_challenge,
    admin_get_challenge,
    admin_update_challenge,
    admin_delete_challenge,
    admin_list_categories,
    admin_create_category,
    admin_get_category,
    admin_update_category,
    admin_delete_category,
    admin_list_lessons,
    admin_create_lesson,
    admin_get_lesson,
    admin_update_lesson,
    admin_delete_lesson,
    admin_list_exercises,
    admin_create_exercise,
    admin_get_exercise,
    admin_update_exercise,
    admin_delete_exercise,
)
import app.services.admin_service as _admin_mod  # noqa: E402 — kept for patch.object


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _fresh_col():
    """Return a fresh MagicMock mimicking a MongoDB collection."""
    col = MagicMock()
    col.find_one.return_value = None
    col.find.return_value = iter([])
    col.insert_one.return_value = MagicMock(inserted_id=ObjectId())
    update_result = MagicMock()
    update_result.modified_count = 1
    col.update_one.return_value = update_result
    delete_result = MagicMock()
    delete_result.deleted_count = 1
    col.delete_one.return_value = delete_result
    return col


def _mock_user(user_id="user123"):
    """Return a mock flask.g with a current_user set."""
    mock_g = MagicMock()
    mock_g.current_user = MagicMock()
    mock_g.current_user.id = user_id
    return mock_g


# ---------------------------------------------------------------------------
# Tests: admin_list_challenges
# ---------------------------------------------------------------------------

class TestAdminListChallenges(unittest.TestCase):

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_challenge_ids")
    def test_sorted_ascending_by_challenge_number(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(), "id": "ch2", "challengeNumber": 2, "type": "CHALLENGE"},
            {"_id": ObjectId(), "id": "ch1", "challengeNumber": 1, "type": "CHALLENGE"},
        ]
        mock_get_col.return_value = col

        result = admin_list_challenges("user1")

        self.assertEqual(result[0]["challengeNumber"], 1)
        self.assertEqual(result[1]["challengeNumber"], 2)

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_challenge_ids")
    def test_first_challenge_always_enabled(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(), "id": "ch1", "challengeNumber": 1, "type": "CHALLENGE"},
        ]
        mock_get_col.return_value = col

        result = admin_list_challenges("user1")

        self.assertTrue(result[0]["isEnabled"])

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_challenge_ids")
    def test_second_challenge_enabled_when_first_completed(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        oid1 = str(ObjectId())
        mock_completed.return_value = [oid1]
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(oid1), "id": "ch1", "challengeNumber": 1, "type": "CHALLENGE"},
            {"_id": ObjectId(),      "id": "ch2", "challengeNumber": 2, "type": "CHALLENGE"},
        ]
        mock_get_col.return_value = col

        result = admin_list_challenges("user1")

        self.assertTrue(result[1]["isEnabled"])

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_challenge_ids")
    def test_second_challenge_disabled_when_first_not_completed(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(), "id": "ch1", "challengeNumber": 1, "type": "CHALLENGE"},
            {"_id": ObjectId(), "id": "ch2", "challengeNumber": 2, "type": "CHALLENGE"},
        ]
        mock_get_col.return_value = col

        result = admin_list_challenges("user1")

        self.assertFalse(result[1]["isEnabled"])

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_challenge_ids")
    def test_object_ids_converted_to_strings(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(), "id": "ch1", "challengeNumber": 1, "type": "CHALLENGE"},
        ]
        mock_get_col.return_value = col

        result = admin_list_challenges("user1")

        self.assertIsInstance(result[0]["_id"], str)

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_challenge_ids")
    def test_completed_flag_set_correctly(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        oid = str(ObjectId())
        mock_completed.return_value = [oid]
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(oid), "id": "ch1", "challengeNumber": 1, "type": "CHALLENGE"},
        ]
        mock_get_col.return_value = col

        result = admin_list_challenges("user1")

        self.assertTrue(result[0]["isCompleted"])


# ---------------------------------------------------------------------------
# Tests: admin_create_challenge
# ---------------------------------------------------------------------------

class TestAdminCreateChallenge(unittest.TestCase):

    def _valid_data(self):
        return {
            "id": "ch1",
            "lessonId": "lesson1",
            "categoryId": "cat1",
            "challengeNumber": 1,
            "question": "What is this?",
        }

    @patch.object(_admin_mod, "get_collection")
    def test_creates_with_valid_data(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_create_challenge(self._valid_data())

        self.assertEqual(status, 201)
        self.assertTrue(response["success"])
        col.insert_one.assert_called_once()

    @patch.object(_admin_mod, "get_collection")
    def test_sets_type_to_challenge_on_insert(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        admin_create_challenge(self._valid_data())

        inserted = col.insert_one.call_args[0][0]
        self.assertEqual(inserted["type"], "CHALLENGE")

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_missing_required_fields(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        response, status = admin_create_challenge({"id": "ch1"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_duplicate_id(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {"id": "ch1", "type": "CHALLENGE"}
        mock_get_col.return_value = col

        response, status = admin_create_challenge(self._valid_data())

        self.assertEqual(status, 400)
        self.assertIn("already exists", response["error"])


# ---------------------------------------------------------------------------
# Tests: admin_get_challenge
# ---------------------------------------------------------------------------

class TestAdminGetChallenge(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_returns_challenge_when_found(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {"id": "ch1", "type": "CHALLENGE", "challengeNumber": 1}
        mock_get_col.return_value = col

        response, status = admin_get_challenge("ch1")

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])
        self.assertIn("challenge", response)

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_get_challenge("nonexistent")

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_update_challenge
# ---------------------------------------------------------------------------

class TestAdminUpdateChallenge(unittest.TestCase):

    def _valid_update(self):
        return {
            "lessonId": "lesson1",
            "categoryId": "cat1",
            "challengeNumber": 1,
            "question": "Updated question?",
        }

    @patch.object(_admin_mod, "get_collection")
    def test_updates_successfully(self, mock_get_col):
        col = _fresh_col()
        col.update_one.return_value = MagicMock(modified_count=1)
        mock_get_col.return_value = col

        response, status = admin_update_challenge("ch1", self._valid_update())

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_strips_protected_fields_from_update(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        data = {**self._valid_update(), "id": "ch1", "_id": "some_id", "type": "OTHER"}
        admin_update_challenge("ch1", data)

        update_doc = col.update_one.call_args[0][1]["$set"]
        self.assertNotIn("id", update_doc)
        self.assertNotIn("_id", update_doc)
        self.assertNotIn("type", update_doc)

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_missing_required_fields(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        response, status = admin_update_challenge("ch1", {"lessonId": "l1"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_delete_challenge
# ---------------------------------------------------------------------------

class TestAdminDeleteChallenge(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_deletes_successfully(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=1)
        mock_get_col.return_value = col

        response, status = admin_delete_challenge("ch1")

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=0)
        mock_get_col.return_value = col

        response, status = admin_delete_challenge("nonexistent")

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_list_categories
# ---------------------------------------------------------------------------

class TestAdminListCategories(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_returns_serialized_list(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(), "id": "cat1", "name": "Animals"},
            {"_id": ObjectId(), "id": "cat2", "name": "Nature"},
        ]
        mock_get_col.return_value = col

        result = admin_list_categories()

        self.assertEqual(len(result), 2)
        for item in result:
            self.assertIsInstance(item["_id"], str)

    @patch.object(_admin_mod, "get_collection")
    def test_returns_empty_list_when_no_categories(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = iter([])
        mock_get_col.return_value = col

        result = admin_list_categories()

        self.assertEqual(result, [])


# ---------------------------------------------------------------------------
# Tests: admin_create_category
# ---------------------------------------------------------------------------

class TestAdminCreateCategory(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_creates_with_valid_data(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_create_category({"id": "cat1", "name": "Animals"})

        self.assertEqual(status, 201)
        self.assertTrue(response["success"])
        col.insert_one.assert_called_once()

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_when_id_missing(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        response, status = admin_create_category({"name": "Animals"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_when_name_missing(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        response, status = admin_create_category({"id": "cat1"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_duplicate_id(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {"id": "cat1", "name": "Existing"}
        mock_get_col.return_value = col

        response, status = admin_create_category({"id": "cat1", "name": "New"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_get_category
# ---------------------------------------------------------------------------

class TestAdminGetCategory(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_returns_category_when_found(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {"_id": ObjectId(), "id": "cat1", "name": "Animals"}
        mock_get_col.return_value = col

        response, status = admin_get_category("cat1")

        self.assertEqual(status, 200)
        self.assertIsInstance(response["_id"], str)

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_get_category("nonexistent")

        self.assertEqual(status, 404)
        self.assertIn("error", response)


# ---------------------------------------------------------------------------
# Tests: admin_update_category
# ---------------------------------------------------------------------------

class TestAdminUpdateCategory(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_updates_successfully(self, mock_get_col):
        oid = ObjectId()
        col = _fresh_col()
        col.find_one.return_value = {"_id": oid, "name": "Old Name"}
        col.update_one.return_value = MagicMock(modified_count=1)
        mock_get_col.return_value = col

        response, status = admin_update_category(str(oid), {"name": "New Name"})

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        oid = ObjectId()
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_update_category(str(oid), {"name": "X"})

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_strips_id_field_before_update(self, mock_get_col):
        oid = ObjectId()
        col = _fresh_col()
        col.find_one.return_value = {"_id": oid}
        mock_get_col.return_value = col

        admin_update_category(str(oid), {"_id": "should_be_removed", "name": "X"})

        update_doc = col.update_one.call_args[0][1]["$set"]
        self.assertNotIn("_id", update_doc)


# ---------------------------------------------------------------------------
# Tests: admin_delete_category
# ---------------------------------------------------------------------------

class TestAdminDeleteCategory(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_deletes_successfully(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=1)
        mock_get_col.return_value = col

        response, status = admin_delete_category("cat1")

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=0)
        mock_get_col.return_value = col

        response, status = admin_delete_category("nonexistent")

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_list_lessons
# ---------------------------------------------------------------------------

class TestAdminListLessons(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_returns_serialized_list(self, mock_get_col):
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(), "id": "l1", "topic": "Colors", "categoryId": "cat1"},
        ]
        mock_get_col.return_value = col

        result = admin_list_lessons()

        self.assertEqual(len(result), 1)
        self.assertIsInstance(result[0]["_id"], str)


# ---------------------------------------------------------------------------
# Tests: admin_create_lesson
# ---------------------------------------------------------------------------

class TestAdminCreateLesson(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_creates_with_valid_data(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_create_lesson({
            "id": "l1", "topic": "Colors", "categoryId": "cat1"
        })

        self.assertEqual(status, 201)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_missing_required_fields(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        for incomplete in [
            {"topic": "T", "categoryId": "c"},    # missing id
            {"id": "l1", "categoryId": "c"},       # missing topic
            {"id": "l1", "topic": "T"},            # missing categoryId
        ]:
            response, status = admin_create_lesson(incomplete)
            self.assertEqual(status, 400, msg=f"Expected 400 for {incomplete}")

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_duplicate_id(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {"id": "l1"}
        mock_get_col.return_value = col

        response, status = admin_create_lesson({"id": "l1", "topic": "T", "categoryId": "c"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_get_lesson
# ---------------------------------------------------------------------------

class TestAdminGetLesson(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_returns_lesson_when_found(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {"_id": ObjectId(), "id": "l1", "topic": "Colors"}
        mock_get_col.return_value = col

        response, status = admin_get_lesson("l1")

        self.assertEqual(status, 200)
        self.assertIsInstance(response["_id"], str)

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_get_lesson("nonexistent")

        self.assertEqual(status, 404)
        self.assertIn("error", response)


# ---------------------------------------------------------------------------
# Tests: admin_update_lesson
# ---------------------------------------------------------------------------

class TestAdminUpdateLesson(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_updates_successfully(self, mock_get_col):
        oid = ObjectId()
        col = _fresh_col()
        col.find_one.return_value = {"_id": oid, "topic": "Old Topic"}
        col.update_one.return_value = MagicMock(modified_count=1)
        mock_get_col.return_value = col

        response, status = admin_update_lesson(str(oid), {"topic": "New Topic"})

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        oid = ObjectId()
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_update_lesson(str(oid), {"topic": "X"})

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_strips_id_field_before_update(self, mock_get_col):
        oid = ObjectId()
        col = _fresh_col()
        col.find_one.return_value = {"_id": oid}
        mock_get_col.return_value = col

        admin_update_lesson(str(oid), {"_id": "should_be_stripped", "topic": "T"})

        update_doc = col.update_one.call_args[0][1]["$set"]
        self.assertNotIn("_id", update_doc)


# ---------------------------------------------------------------------------
# Tests: admin_delete_lesson
# ---------------------------------------------------------------------------

class TestAdminDeleteLesson(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_deletes_successfully(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=1)
        mock_get_col.return_value = col

        response, status = admin_delete_lesson("l1")

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=0)
        mock_get_col.return_value = col

        response, status = admin_delete_lesson("nonexistent")

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_list_exercises
# ---------------------------------------------------------------------------

class TestAdminListExercises(unittest.TestCase):

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_exercise_ids")
    def test_marks_completed_when_in_completed_ids(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        oid = ObjectId()
        mock_completed.return_value = [str(oid)]
        col = _fresh_col()
        col.find.return_value = [
            {"_id": oid, "id": "ex1", "type": "MANUAL", "exerciseNumber": 1},
        ]
        mock_get_col.return_value = col

        result = admin_list_exercises()

        self.assertEqual(len(result), 1)
        self.assertTrue(result[0]["completed"])
        self.assertIsInstance(result[0]["_id"], str)

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_exercise_ids")
    def test_marks_not_completed_when_not_in_completed_ids(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        col = _fresh_col()
        col.find.return_value = [
            {"_id": ObjectId(), "id": "ex1", "type": "MANUAL"},
        ]
        mock_get_col.return_value = col

        result = admin_list_exercises()

        self.assertFalse(result[0]["completed"])

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_exercise_ids")
    def test_queries_only_manual_exercises(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        col = _fresh_col()
        col.find.return_value = iter([])
        mock_get_col.return_value = col

        admin_list_exercises()

        col.find.assert_called_once_with({"type": "MANUAL"})


# ---------------------------------------------------------------------------
# Tests: admin_create_exercise
# ---------------------------------------------------------------------------

class TestAdminCreateExercise(unittest.TestCase):

    def _valid_data(self):
        return {
            "id": "ex1",
            "lessonId": "lesson1",
            "categoryId": "cat1",
            "exerciseNumber": 1,
            "question": "What is this?",
        }

    @patch.object(_admin_mod, "get_collection")
    def test_creates_with_valid_data(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_create_exercise(self._valid_data())

        self.assertEqual(status, 201)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_sets_type_to_manual(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        admin_create_exercise(self._valid_data())

        inserted = col.insert_one.call_args[0][0]
        self.assertEqual(inserted["type"], "MANUAL")

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_missing_required_fields(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        response, status = admin_create_exercise({"id": "ex1"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_duplicate_id(self, mock_get_col):
        col = _fresh_col()
        col.find_one.return_value = {"id": "ex1"}
        mock_get_col.return_value = col

        response, status = admin_create_exercise(self._valid_data())

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_get_exercise
# ---------------------------------------------------------------------------

class TestAdminGetExercise(unittest.TestCase):

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_exercise_ids")
    def test_returns_exercise_when_found(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        oid = ObjectId()
        col = _fresh_col()
        col.find_one.return_value = {"_id": oid, "id": "ex1", "type": "MANUAL"}
        mock_get_col.return_value = col

        response, status = admin_get_exercise("ex1")

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])
        self.assertIsInstance(response["exercise"]["_id"], str)

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_exercise_ids")
    def test_returns_404_when_not_found(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        mock_completed.return_value = []
        col = _fresh_col()
        col.find_one.return_value = None
        mock_get_col.return_value = col

        response, status = admin_get_exercise("nonexistent")

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])

    @patch.object(_admin_mod, "g")
    @patch.object(_admin_mod, "get_collection")
    @patch.object(_admin_mod, "get_completed_exercise_ids")
    def test_completed_flag_set_when_in_completed_list(self, mock_completed, mock_get_col, mock_g):
        mock_g.current_user = MagicMock(id="user1")
        oid = ObjectId()
        mock_completed.return_value = [str(oid)]
        col = _fresh_col()
        col.find_one.return_value = {"_id": oid, "id": "ex1", "type": "MANUAL"}
        mock_get_col.return_value = col

        response, _ = admin_get_exercise("ex1")

        self.assertTrue(response["exercise"]["completed"])


# ---------------------------------------------------------------------------
# Tests: admin_update_exercise
# ---------------------------------------------------------------------------

class TestAdminUpdateExercise(unittest.TestCase):

    def _valid_update(self):
        return {
            "lessonId": "lesson1",
            "categoryId": "cat1",
            "exerciseNumber": 1,
            "question": "Updated question?",
        }

    @patch.object(_admin_mod, "get_collection")
    def test_updates_successfully(self, mock_get_col):
        col = _fresh_col()
        col.update_one.return_value = MagicMock(modified_count=1)
        mock_get_col.return_value = col

        response, status = admin_update_exercise("ex1", self._valid_update())

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_strips_protected_fields_from_update(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        data = {**self._valid_update(), "id": "ex1", "_id": "some_id"}
        admin_update_exercise("ex1", data)

        update_doc = col.update_one.call_args[0][1]["$set"]
        self.assertNotIn("id", update_doc)
        self.assertNotIn("_id", update_doc)

    @patch.object(_admin_mod, "get_collection")
    def test_returns_400_on_missing_required_fields(self, mock_get_col):
        col = _fresh_col()
        mock_get_col.return_value = col

        response, status = admin_update_exercise("ex1", {"lessonId": "l1"})

        self.assertEqual(status, 400)
        self.assertFalse(response["success"])


# ---------------------------------------------------------------------------
# Tests: admin_delete_exercise
# ---------------------------------------------------------------------------

class TestAdminDeleteExercise(unittest.TestCase):

    @patch.object(_admin_mod, "get_collection")
    def test_deletes_successfully(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=1)
        mock_get_col.return_value = col

        response, status = admin_delete_exercise("ex1")

        self.assertEqual(status, 200)
        self.assertTrue(response["success"])

    @patch.object(_admin_mod, "get_collection")
    def test_returns_404_when_not_found(self, mock_get_col):
        col = _fresh_col()
        col.delete_one.return_value = MagicMock(deleted_count=0)
        mock_get_col.return_value = col

        response, status = admin_delete_exercise("nonexistent")

        self.assertEqual(status, 404)
        self.assertFalse(response["success"])


if __name__ == "__main__":
    unittest.main()
