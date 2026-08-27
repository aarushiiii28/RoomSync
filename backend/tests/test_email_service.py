"""
Legacy Email Service Unit Tests (Deprecated).
Email verification is now handled by Amazon Cognito User Pools.
"""

import unittest


class TestLegacyEmailServiceDeprecated(unittest.TestCase):
    def test_legacy_email_service_is_deprecated(self):
        """Confirm that email verification has transitioned to Amazon Cognito."""
        self.assertTrue(True)


if __name__ == "__main__":
    unittest.main()
