import unittest
import uuid
from datetime import datetime
from unittest.mock import patch

from fake_factory.fraud.transaction_factory import TransactionFakeFactory


class TestTransactionFakeFactory(unittest.TestCase):
    def setUp(self):
        self.factory = TransactionFakeFactory()

    def test_mount_compromised_users(self):
        compromised = self.factory._mount_compromised_users()
        self.assertIsInstance(compromised, set)
        self.assertEqual(len(compromised), 50)
        for user_id in compromised:
            self.assertGreaterEqual(user_id, 1000)
            self.assertLessEqual(user_id, 9999)

    def test_mount_high_risk_merchants(self):
        high_risk = self.factory._mount_high_risk_merchants()
        self.assertIsInstance(high_risk, list)
        self.assertListEqual(high_risk, ["QuickCash", "PaydayLoan", "LoanShark"])

    def test_generate_base_transaction(self):
        transaction = self.factory._generate_base_transaction()
        required_keys = [
            "transaction_id",
            "user_id",
            "amount",
            "currency",
            "merchant",
            "timestamp",
            "location",
        ]
        for key in required_keys:
            self.assertIn(key, transaction)
        try:
            uuid.UUID(transaction["transaction_id"])
        except Exception:
            self.fail("transaction_id is not a valid UUID")
        self.assertEqual(transaction["currency"], "USD")
        self.assertIsInstance(transaction["amount"], float)
        try:
            datetime.fromisoformat(transaction["timestamp"])
        except Exception:
            self.fail("timestamp is not in a valid ISO format")

    @patch("random.random", return_value=0.0)
    def test_apply_fraud_rules_account_takeover(self, mock_random):
        transaction = self.factory._generate_base_transaction()
        transaction["user_id"] = next(iter(self.factory.compromised_users))
        transaction["amount"] = 600.0
        result = self.factory._apply_fraud_rules(transaction.copy())
        self.assertEqual(result["is_fraud"], 1)
        self.assertIn(result["merchant"], self.factory._mount_high_risk_merchants())
        self.assertGreaterEqual(result["amount"], 500)
        self.assertLessEqual(result["amount"], 5000)

    @patch("random.random", return_value=0.0)
    def test_apply_fraud_rules_card_testing(self, mock_random):
        transaction = self.factory._generate_base_transaction()
        transaction["user_id"] = 2000  # 2000 % 1000 == 0
        transaction["amount"] = 1.5  # less than 2.0
        result = self.factory._apply_fraud_rules(transaction.copy())
        self.assertEqual(result["is_fraud"], 1)
        self.assertEqual(result["location"], "US")

    def test_generate_with_label_false(self):
        transaction = self.factory.generate(with_label=False)
        self.assertIsNone(transaction["is_fraud"])

    def test_generate_with_label_true(self):
        transaction = self.factory.generate(with_label=True)
        self.assertIn(transaction["is_fraud"], [0, 1])
        for key in [
            "transaction_id",
            "user_id",
            "amount",
            "currency",
            "merchant",
            "timestamp",
            "location",
        ]:
            self.assertIn(key, transaction)


if __name__ == "__main__":
    unittest.main()
