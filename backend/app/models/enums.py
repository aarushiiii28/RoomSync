"""
Domain enums for Phase 2 models.

All enums inherit from (str, enum.Enum) so that:
  - Values serialise to plain strings (JSON / Pydantic compatible).
  - PostgreSQL native ENUM types are created with predictable names.

Naming convention: the PostgreSQL type name is the lower-cased class name,
e.g. GenderEnum → genderenum, CleanlinessLevel → cleanlinesslevel.
"""
import enum


class GenderEnum(str, enum.Enum):
    """Biological / self-identified gender of a user."""

    male = "male"
    female = "female"
    non_binary = "non_binary"
    prefer_not_to_say = "prefer_not_to_say"


class GenderPreference(str, enum.Enum):
    """Preferred gender of a prospective roommate."""

    male = "male"
    female = "female"
    non_binary = "non_binary"
    any = "any"


class CleanlinessLevel(str, enum.Enum):
    """How tidy a user keeps shared living spaces."""

    very_clean = "very_clean"
    clean = "clean"
    moderate = "moderate"
    relaxed = "relaxed"


class ImportanceLevel(str, enum.Enum):
    """How important a habit, trait, or responsibility is to the user."""

    not_important = "not_important"
    slightly_important = "slightly_important"
    important = "important"
    very_important = "very_important"


class ToleranceLevel(str, enum.Enum):
    """Comfort / tolerance level toward a roommate's habit."""

    not_comfortable = "not_comfortable"
    slightly_comfortable = "slightly_comfortable"
    comfortable = "comfortable"
    very_comfortable = "very_comfortable"


class SmokingHabit(str, enum.Enum):
    """User's smoking behaviour."""

    never = "never"
    occasionally = "occasionally"
    regularly = "regularly"


class DrinkingHabit(str, enum.Enum):
    """User's alcohol consumption behaviour."""

    never = "never"
    occasionally = "occasionally"
    regularly = "regularly"


class PetOwnership(str, enum.Enum):
    """Whether the user currently keeps pets."""

    has_pets = "has_pets"
    no_pets = "no_pets"


class FrequencyLevel(str, enum.Enum):
    """Generic frequency scale used for guests, cooking, and parties."""

    never = "never"
    rarely = "rarely"
    sometimes = "sometimes"
    often = "often"
    always = "always"


class FitnessLevel(str, enum.Enum):
    """How regularly the user exercises."""

    never = "never"
    rarely = "rarely"
    sometimes = "sometimes"
    often = "often"
    daily = "daily"


class SleepSchedule(str, enum.Enum):
    """Preferred sleep / wake pattern."""

    early_bird = "early_bird"
    night_owl = "night_owl"
    flexible = "flexible"


class AccommodationType(str, enum.Enum):
    """Type of accommodation preferred by the user."""

    pg = "pg"
    flat = "flat"
    apartment = "apartment"
    house = "house"
    co_living = "co_living"
    other = "other"


class RoomType(str, enum.Enum):
    """Room occupancy preference."""

    private = "private"
    shared = "shared"


class MoveInTimeframe(str, enum.Enum):
    """Approximate move-in timeframe for roommate search."""

    within_1_month = "within_1_month"
    one_to_three_months = "one_to_three_months"
    three_to_six_months = "three_to_six_months"
    six_to_twelve_months = "six_to_twelve_months"
    not_sure = "not_sure"


class LeaseDuration(str, enum.Enum):
    """Preferred duration of lease."""

    one_month = "1_month"
    three_months = "3_months"
    six_months = "6_months"
    twelve_months = "12_months"
    flexible = "flexible"


# ---------------------------------------------------------------------------
# Roommate Compatibility & Personality Preference Enums
# ---------------------------------------------------------------------------


class SocialStyle(str, enum.Enum):
    """Preferred social dynamic with a roommate."""

    very_private = "very_private"
    somewhat_private = "somewhat_private"
    balanced = "balanced"
    very_social = "very_social"


class PersonalSpacePreference(str, enum.Enum):
    """Preferred amount of personal space at home."""

    a_lot = "a_lot"
    moderate = "moderate"
    comfortable_sharing = "comfortable_sharing"


class CommunicationStyle(str, enum.Enum):
    """Preferred communication style with a roommate."""

    mostly_independent = "mostly_independent"
    occasional_checkins = "occasional_checkins"
    open_communication = "open_communication"
    very_communicative = "very_communicative"


class HouseholdResponsibilityPreference(str, enum.Enum):
    """Preference for managing shared household chores and responsibilities."""

    mostly_separate = "mostly_separate"
    flexible = "flexible"
    shared_equally = "shared_equally"
    clearly_divided = "clearly_divided"


class MessageStatus(str, enum.Enum):
    """Delivery status of a chat message."""

    sent = "sent"
    delivered = "delivered"
    read = "read"
