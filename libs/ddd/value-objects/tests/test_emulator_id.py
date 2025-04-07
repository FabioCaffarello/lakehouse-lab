import unittest
import uuid

from value_objects.emulator_id import EmulationID  # Adjust the import path if necessary


class TestEmulationID(unittest.TestCase):
    def test_generate_creates_valid_uuid(self):
        emu_id = EmulationID.generate()
        self.assertIsInstance(emu_id, EmulationID)
        # Verify that the generated value is a valid UUID.
        try:
            uuid.UUID(emu_id.value)
        except ValueError:
            self.fail("Generated EmulationID is not a valid UUID.")

    def test_valid_uuid_initialization(self):
        valid_uuid = str(uuid.uuid4())
        emu_id = EmulationID(value=valid_uuid)
        self.assertEqual(emu_id.value, valid_uuid)

    def test_invalid_uuid_initialization(self):
        invalid_uuid = "invalid-uuid-string"
        with self.assertRaises(ValueError):
            EmulationID(value=invalid_uuid)


if __name__ == "__main__":
    unittest.main()
