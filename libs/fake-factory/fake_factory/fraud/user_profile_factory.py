import queue
import random
import threading
from datetime import datetime
from typing import Any

from fake_factory.base_factory import BaseFakeFactory
from faker import Faker


class UserProfileFactory(BaseFakeFactory):
    _user_id_queue: queue.Queue[int] = None
    _user_id_lock = threading.Lock()

    def __init__(self, user_id_min: int = 1000, user_id_max: int = 9999) -> None:
        self.faker = Faker()
        with UserProfileFactory._user_id_lock:
            if UserProfileFactory._user_id_queue is None:
                UserProfileFactory._user_id_queue = queue.Queue()
                for uid in range(user_id_min, user_id_max + 1):
                    UserProfileFactory._user_id_queue.put(uid)

    def generate(self) -> dict[str, Any]:
        user_id = self._get_unique_user_id()
        if user_id is None:
            return None
        profile = self._generate_base_profile(user_id)
        profile["risk_level"] = self._determine_risk_level(profile)
        return profile

    def _get_unique_user_id(self) -> int:
        """Get a unique user_id from the queue."""
        try:
            return UserProfileFactory._user_id_queue.get_nowait()
        except queue.Empty:
            return None

    def _generate_base_profile(self, user_id: int) -> dict[str, Any]:
        """Generate a base user profile."""
        profile = {
            "user_id": user_id,
            "name": self.faker.name(),
            "email": self.faker.email(),
            "phone": self.faker.phone_number(),
            "date_of_birth": self.faker.date_of_birth(
                minimum_age=18, maximum_age=90
            ).isoformat(),
            "address": self.faker.address().replace("\n", ", "),
            "country": self.faker.country_code(),
            "signup_date": self.faker.date_time_between(
                start_date="-2y", end_date="now"
            ).isoformat(),
            "credit_score": round(
                self.faker.pyfloat(min_value=300, max_value=850, right_digits=2), 2
            ),
        }
        return profile

    def _determine_risk_level(self, profile: dict[str, Any]) -> str:
        """Determine the risk level based on the user profile."""
        credit_score = profile["credit_score"]
        if credit_score >= 700:
            risk_level = "low"
        elif credit_score >= 500:
            risk_level = "medium"
        else:
            risk_level = "high"

        # High risk countries
        high_risk_countries = {"NG", "IR", "SY", "KP"}
        if profile["country"] in high_risk_countries and random.random() < 0.5:
            risk_level = "high"

        # Registered in the last 30 days
        signup_date = datetime.fromisoformat(profile["signup_date"])
        if (datetime.now() - signup_date).days < 30:
            if risk_level == "low":
                risk_level = "medium"
            elif risk_level == "medium":
                risk_level = "high"

        # Baseline to introduce some randomness
        if random.random() < 0.01:
            risk_level = "high"

        return risk_level
