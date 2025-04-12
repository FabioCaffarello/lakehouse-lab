import unittest

from dtos.emulation_dto import EmulationStatusDTO
from usecases.status_emulation import StatusEmulatorUseCase


class DummyRepository:
    def __init__(self, status_mapping):
        """
        :param status_mapping: a dict mapping emulation IDs to status dictionaries.
        """
        self.status_mapping = status_mapping

    def get_status(self, emulation_id: str):
        return self.status_mapping.get(emulation_id)


class TestStatusEmulatorUseCase(unittest.TestCase):
    def setUp(self):
        self.valid_emulation_id = "valid_id"
        self.status_data = {
            "global_status": "running",
            "threads": {"0": "running", "1": "stopped"},
        }
        self.dummy_repo = DummyRepository({self.valid_emulation_id: self.status_data})
        self.use_case = StatusEmulatorUseCase(repository=self.dummy_repo)

    def test_execute_valid(self):
        """
        Test that execute returns an EmulationStatusDTO with the correct details
        when the emulation_id exists in the repository.
        """
        result = self.use_case.execute(self.valid_emulation_id)
        self.assertIsInstance(result, EmulationStatusDTO)
        self.assertEqual(result.id, self.valid_emulation_id)
        self.assertEqual(result.status.global_status, self.status_data["global_status"])
        self.assertEqual(result.status.threads, self.status_data["threads"])

    def test_execute_invalid(self):
        """
        Test that execute raises a ValueError when the emulation_id is not found in the repository.
        """
        invalid_emulation_id = "invalid_id"
        with self.assertRaises(ValueError) as context:
            self.use_case.execute(invalid_emulation_id)
        self.assertEqual(
            str(context.exception), f"Emulation ID {invalid_emulation_id} not found."
        )


if __name__ == "__main__":
    unittest.main()
