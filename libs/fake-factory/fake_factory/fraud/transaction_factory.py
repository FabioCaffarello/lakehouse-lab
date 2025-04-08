import random
from datetime import datetime, timedelta, timezone
from typing import Any

from fake_factory.base_factory import BaseFakeFactory
from faker import Faker


class TransactionFakeFactory(BaseFakeFactory):
    """Factory for generating fake transaction data.

    This factory generates transaction records with optional fraud labeling.
    The base transaction is generated first, and then fraud rules can be applied
    to assign a fraud label. This separation allows the raw data to be ingested
    into the feature store and labeling to occur in a later processing stage.
    """

    def __init__(self) -> None:
        self.faker = Faker()
        self.compromised_users = self._mount_compromised_users()
        self.high_risk_merchants = self._mount_high_risk_merchants()

    def _mount_compromised_users(self) -> set[int]:
        """Mounts a set of compromised users.

        Returns:
            set[int]: A set of user_ids considered compromised.
        """
        return set(random.sample(range(1000, 9999), 50))

    def _mount_high_risk_merchants(self) -> list[str]:
        """Mounts a list of high-risk merchants.

        Returns:
            list[str]: A list of merchant names considered high-risk.
        """
        return ["QuickCash", "PaydayLoan", "LoanShark"]

    def _generate_base_transaction(self) -> dict[str, Any]:
        """Generates the base transaction data without applying fraud rules.

        This represents the raw ingestion data for the feature store.

        Returns:
            dict[str, Any]: A dictionary containing raw transaction data.
        """
        transaction = {
            "transaction_id": self.faker.uuid4(),
            "user_id": random.randint(1000, 9999),
            "amount": round(self.faker.pyfloat(min_value=0.01, max_value=10000), 2),
            "currency": "USD",
            "merchant": self.faker.company(),
            "timestamp": (
                datetime.now(timezone.utc)
                + timedelta(seconds=random.randint(-300, 3000))
            ).isoformat(),
            "location": self.faker.country_code(),
        }
        return transaction

    def _apply_fraud_rules(self, transaction: dict[str, Any]) -> dict[str, Any]:
        """Applies fraud rules to the transaction data and sets the fraud label.

        This function applies several conditional rules to determine whether the
        transaction should be labeled as fraudulent and modifies some transaction
        fields accordingly.

        Args:
            transaction (dict[str, Any]): The raw transaction data.

        Returns:
            dict[str, Any]: The transaction data with the fraud label applied.
        """
        is_fraud = 0
        amount = transaction["amount"]
        user_id = transaction["user_id"]
        merchant = transaction["merchant"]

        # Account Takeover: user is compromised and amount > 500 with 30%
        if user_id in self.compromised_users and amount > 500 and random.random() < 0.3:
            is_fraud = 1
            transaction["amount"] = random.uniform(500, 5000)
            transaction["merchant"] = random.choice(self.high_risk_merchants)

        # Card Testing: amount < 2.0 and user_id modulo 1000 equals 0 with 25% chance.
        if (
            not is_fraud
            and amount < 2.0
            and user_id % 1000 == 0
            and random.random() < 0.25
        ):
            is_fraud = 1
            transaction["amount"] = round(random.uniform(0.01, 2), 2)
            transaction["location"] = "US"

        # Merchant Collusion: merchant is high risk and amount > 3000 with 15% chance.
        if (
            not is_fraud
            and merchant in self.high_risk_merchants
            and amount > 3000
            and random.random() < 0.15
        ):
            is_fraud = 1
            transaction["amount"] = random.uniform(300, 1500)

        # Geographical Anomaly: user_id modulo 500 equals 0 with 10% chance.
        if not is_fraud and user_id % 500 == 0 and random.random() < 0.1:
            is_fraud = 1
            transaction["location"] = random.choice(["CN", "GB", "RU"])

        # Baseline random fraud: with a 0.2% chance.
        if not is_fraud and random.random() < 0.002:
            is_fraud = 1
            transaction["amount"] = random.uniform(100, 2000)

        # Ensure that 98.5% of transactions are not fraudulent.
        transaction["is_fraud"] = is_fraud if random.random() < 0.985 else 0

        return transaction

    def generate(self, with_label: bool = True) -> dict[str, Any]:
        """Generates a transaction record.

        Depending on the with_label parameter, this function either applies fraud rules
        to set the is_fraud label or returns raw transaction data without labeling.

        Args:
            with_label (bool, optional): If True, fraud rules will be applied to set the
                                         is_fraud label. If False, the is_fraud field
                                         will be set to None. Defaults to True.

        Returns:
            dict[str, Any]: The generated transaction record.
        """
        transaction = self._generate_base_transaction()
        if with_label:
            transaction = self._apply_fraud_rules(transaction)
        else:
            transaction["is_fraud"] = None
        return transaction
