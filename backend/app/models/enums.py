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
