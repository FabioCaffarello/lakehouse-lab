import queue
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

from fake_factory.fraud.user_profile_factory import UserProfileFactory


class TestUserProfileFactory(unittest.TestCase):
    def setUp(self):
        UserProfileFactory._user_id_queue = queue.Queue()
        for uid in range(1000, 1010):
            UserProfileFactory._user_id_queue.put(uid)
        self.factory = UserProfileFactory(user_id_min=1000, user_id_max=1010)

    def test_get_unique_user_id(self):
        ids = []
        for _ in range(11):  # One more than available
            uid = self.factory._get_unique_user_id()
            ids.append(uid)
        self.assertIsNone(ids[-1])
        for uid in ids[:-1]:
            self.assertTrue(1000 <= uid <= 1010)

    def test_generate_base_profile(self):
        user_id = 1001
        profile = self.factory._generate_base_profile(user_id)
        expected_keys = [
            "user_id",
            "name",
            "email",
            "phone",
            "date_of_birth",
            "address",
            "country",
            "signup_date",
            "credit_score",
        ]
        for key in expected_keys:
            self.assertIn(key, profile)
        self.assertEqual(profile["user_id"], user_id)
        try:
            datetime.fromisoformat(profile["date_of_birth"])
            datetime.fromisoformat(profile["signup_date"])
        except ValueError:
            self.fail("Date fields are not in a valid ISO format.")

    @patch("random.random", return_value=1.0)
    def test_determine_risk_level_normal(self, mock_random):
        old_date = (datetime.now() - timedelta(days=60)).isoformat()
        profile_low = {"credit_score": 750, "country": "US", "signup_date": old_date}
        profile_medium = {"credit_score": 600, "country": "US", "signup_date": old_date}
        profile_high = {"credit_score": 400, "country": "US", "signup_date": old_date}
        self.assertEqual(self.factory._determine_risk_level(profile_low), "low")
        self.assertEqual(self.factory._determine_risk_level(profile_medium), "medium")
        self.assertEqual(self.factory._determine_risk_level(profile_high), "high")

    @patch("random.random")
    def test_determine_risk_level_signup_recent(self, mock_random):
        recent_date = (datetime.now() - timedelta(days=10)).isoformat()
        profile_low = {"credit_score": 750, "country": "US", "signup_date": recent_date}
        profile_medium = {
            "credit_score": 600,
            "country": "US",
            "signup_date": recent_date,
        }
        mock_random.side_effect = [
            1.0,
            1.0,
        ]
        self.assertEqual(self.factory._determine_risk_level(profile_low), "medium")
        self.assertEqual(self.factory._determine_risk_level(profile_medium), "high")

    @patch("random.random")
    def test_determine_risk_level_high_country(self, mock_random):
        old_date = (datetime.now() - timedelta(days=60)).isoformat()
        profile = {"credit_score": 750, "country": "NG", "signup_date": old_date}
        mock_random.side_effect = [0.0, 1.0, 1.0]
        self.assertEqual(self.factory._determine_risk_level(profile), "high")

    @patch.object(UserProfileFactory, "_get_unique_user_id", return_value=None)
    def test_generate_returns_none_when_no_user_id(self, mock_get_uid):
        profile = self.factory.generate()
        self.assertIsNone(profile)

    def test_generate_returns_profile(self):
        profile = self.factory.generate()
        self.assertIsNotNone(profile)
        expected_keys = [
            "user_id",
            "name",
            "email",
            "phone",
            "date_of_birth",
            "address",
            "country",
            "signup_date",
            "credit_score",
            "risk_level",
        ]
        for key in expected_keys:
            self.assertIn(key, profile)


if __name__ == "__main__":
    unittest.main()
