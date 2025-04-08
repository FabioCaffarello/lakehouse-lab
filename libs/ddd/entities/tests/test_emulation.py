import unittest
import uuid
from datetime import datetime

from entities.emulation import Emulation
from value_objects.emulator_id import EmulationID


class TestEmulation(unittest.TestCase):
    def setUp(self):
        self.timeout = 30
        self.emulator_type = "test_emulator"
        self.emulation = Emulation(
            timeout=self.timeout, emulator_type=self.emulator_type
        )

    def test_emulation_attributes(self):
        self.assertEqual(self.emulation.timeout, self.timeout)
        self.assertEqual(self.emulation.emulator_type, self.emulator_type)
        self.assertIsInstance(self.emulation.id, EmulationID)
        try:
            uuid_obj = uuid.UUID(self.emulation.id.value)
            self.assertIsInstance(uuid_obj, uuid.UUID)
        except ValueError:
            self.fail("Emulation id is not a valid UUID.")

    def test_created_at_timestamp(self):
        self.assertIsInstance(self.emulation.created_at, datetime)
        self.assertLessEqual(self.emulation.created_at, datetime.utcnow())

    def test_to_dict(self):
        emu_dict = self.emulation.to_dict()
        self.assertIn("id", emu_dict)
        self.assertIn("timeout", emu_dict)
        self.assertIn("emulator_type", emu_dict)
        self.assertIn("created_at", emu_dict)
        self.assertEqual(emu_dict["timeout"], self.timeout)
        self.assertEqual(emu_dict["emulator_type"], self.emulator_type)
        try:
            datetime.fromisoformat(emu_dict["created_at"])
        except Exception:
            self.fail("created_at is not a valid ISO format string.")


if __name__ == "__main__":
    unittest.main()
