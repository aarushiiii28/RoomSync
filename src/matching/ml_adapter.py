"""
RoomSync ML Adapter Module.

Bridges the backend domain models (SQLAlchemy ORM models, Pydantic schemas, or dictionaries)
and the ML model inference pipeline.

Transforms user/profile/lifestyle/preference records into the canonical student dictionary
expected by `src.features.feature_engineering.create_pairwise_features()`.
"""

from datetime import date, datetime, time
from typing import Any, Dict, List, Optional, Set, Tuple, Union
import enum

from src.features.feature_engineering import STUDENT_FIELD_DEFAULTS


def _extract_val(obj: Any, attr: str, default: Any = None) -> Any:
    """Safely extract an attribute or dictionary key, unwrapping Enums if present."""
    val = default
    if obj is None:
        return default

    if isinstance(obj, dict):
        val = obj.get(attr, default)
    elif hasattr(obj, attr):
        val = getattr(obj, attr, default)
        if val is None:
            val = default

    # Unwrap Enum instances to their string/int values
    if isinstance(val, enum.Enum):
        val = val.value

    return val


def _parse_time_to_hours(val: Any, default_hour: float = 21.0) -> float:
    """
    Deterministically convert a time representation into a numeric 24-hour float.
    
    Examples:
        time(23, 30) -> 23.5
        "23:00"      -> 23.0
        "07:30:00"   -> 7.5
        22           -> 22.0
    """
    if val is None:
        return default_hour

    if isinstance(val, time):
        return round(val.hour + (val.minute / 60.0), 2)

    if isinstance(val, datetime):
        return round(val.hour + (val.minute / 60.0), 2)

    if isinstance(val, (int, float)):
        return float(val)

    if isinstance(val, str):
        val_str = val.strip()
        if ":" in val_str:
            parts = val_str.split(":")
            try:
                hour = float(parts[0])
                minute = float(parts[1]) if len(parts) > 1 else 0.0
                return round(hour + (minute / 60.0), 2)
            except ValueError:
                return default_hour
        try:
            return float(val_str)
        except ValueError:
            return default_hour

    return default_hour


def _map_frequency_level(val: Any, default: int = 2) -> int:
    """Map FrequencyLevel enum/string ('never'..'always') to 1-5 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {
        "never": 1,
        "rarely": 2,
        "sometimes": 3,
        "often": 4,
        "always": 5,
    }
    return mapping.get(str(val).lower(), default)


def _map_fitness_level(val: Any, default: int = 2) -> int:
    """Map FitnessLevel enum/string to 0-4 integer scale matching gym_frequency."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {
        "never": 0,
        "rarely": 1,
        "sometimes": 2,
        "often": 3,
        "daily": 4,
    }
    return mapping.get(str(val).lower(), default)


def _map_smoking_habit(val: Any, default: int = 0) -> int:
    """Map SmokingHabit to 0-2 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {"never": 0, "occasionally": 1, "regularly": 2}
    return mapping.get(str(val).lower(), default)


def _map_drinking_habit(val: Any, default: int = 0) -> int:
    """Map DrinkingHabit to 0-2 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {"never": 0, "occasionally": 1, "regularly": 2}
    return mapping.get(str(val).lower(), default)


def _map_importance_level(val: Any, default: int = 4) -> int:
    """Map ImportanceLevel to 1-5 integer scale."""
    if val is None:
        return default
    if isinstance(val, (int, float)):
        return int(val)
    mapping = {
        "not_important": 1,
        "slightly_important": 2,
        "important": 4,
        "very_important": 5,
    }
    return mapping.get(str(val).lower(), default)


def _derive_lifestyle_type(
    sleep_time: float,
    study_hours: int,
    gaming_hours: int,
    cleanliness_score: int,
    talkativeness: int,
    guest_frequency: int,
    fitness_level: str,
    schedule_consistency: int,
    privacy_preference: int,
) -> str:
    """
    Deterministically classify a student into one of the canonical lifestyle archetypes
    matching the training distribution:
    ['average', 'clean_freak', 'disciplined', 'fitness_focused', 'gamer', 'night_owl', 'social', 'introvert']
    """
    # 1. Night Owl (sleep time past midnight / very early morning)
    if sleep_time >= 24.0 or sleep_time <= 4.0:
        return "night_owl"

    # 2. Gamer (heavy gaming hours)
    if gaming_hours >= 4:
        return "gamer"

    # 3. Clean Freak (cleanliness score 5)
    if cleanliness_score >= 5:
        return "clean_freak"

    # 4. Fitness Focused (regular gym/exercise)
    if str(fitness_level).lower() in ("often", "daily", "4"):
        return "fitness_focused"

    # 5. Social (high talkativeness and frequent guests)
    if talkativeness >= 4 and guest_frequency >= 4:
        return "social"

    # 6. Disciplined (high study hours and strict schedule)
    if study_hours >= 5 and schedule_consistency >= 4:
        return "disciplined"

    # 7. Introvert (high privacy, low talkativeness)
    if privacy_preference >= 4 and talkativeness <= 2:
        return "introvert"

    return "average"


def build_ml_student(
    profile: Any = None,
    lifestyle: Any = None,
    preference: Any = None,
    accommodation: Any = None,
    location: Any = None,
    student_id: Optional[Union[int, str]] = None,
) -> Tuple[Dict[str, Any], List[str]]:
    """
    Construct the canonical ML student dictionary from backend domain records.

    Parameters:
    -----------
    profile : UserProfile ORM | ProfileResponse | dict, optional
    lifestyle : LifestyleProfile ORM | LifestyleResponse | dict, optional
    preference : RoommatePreference ORM | PreferenceResponse | dict, optional
    accommodation : AccommodationPreference ORM | AccommodationResponse | dict, optional
    location : Location ORM | LocationResponse | dict, optional
    student_id : int | str, optional
        Unique identifier for the student.

    Returns:
    --------
    Tuple[student_dict, defaulted_fields_list]
        student_dict: Exact dictionary of attributes consumed by feature engineering.
        defaulted_fields_list: List of attribute names populated by statistical dataset defaults.
    """
    student: Dict[str, Any] = {}
    defaulted_fields: List[str] = []

    # ------------------------------------------------------------------------
    # 1. Identifier & Demographics (from Profile)
    # ------------------------------------------------------------------------
    sid = student_id or _extract_val(profile, "user_id") or _extract_val(profile, "id", 1)
    # If UUID string, convert or preserve as int hash/representation
    if isinstance(sid, str):
        try:
            student["student_id"] = int(sid)
        except ValueError:
            student["student_id"] = abs(hash(sid)) % 100000
    else:
        student["student_id"] = int(sid or 1)

    raw_gender = _extract_val(profile, "gender")
    if raw_gender:
        student["gender"] = "Female" if str(raw_gender).lower() == "female" else "Male"
    else:
        student["gender"] = STUDENT_FIELD_DEFAULTS["gender"]
        defaulted_fields.append("gender")

    dob = _extract_val(profile, "date_of_birth")
    if isinstance(dob, (date, datetime)):
        today = date.today()
        student["age"] = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    elif isinstance(dob, str) and "-" in dob:
        try:
            parsed_dob = datetime.strptime(dob[:10], "%Y-%m-%d").date()
            today = date.today()
            student["age"] = today.year - parsed_dob.year - ((today.month, today.day) < (parsed_dob.month, parsed_dob.day))
        except ValueError:
            student["age"] = STUDENT_FIELD_DEFAULTS["age"]
            defaulted_fields.append("age")
    else:
        student["age"] = STUDENT_FIELD_DEFAULTS["age"]
        defaulted_fields.append("age")

    # ------------------------------------------------------------------------
    # 2. Sleep & Routine Features (from Lifestyle or combined dict)
    # ------------------------------------------------------------------------
    raw_sleep = _extract_val(lifestyle, "sleep_time") or _extract_val(profile, "sleep_time")
    if raw_sleep is not None:
        student["sleep_time"] = _parse_time_to_hours(raw_sleep, default_hour=21.0)
    else:
        student["sleep_time"] = STUDENT_FIELD_DEFAULTS["sleep_time"]
        defaulted_fields.append("sleep_time")

    raw_wake = _extract_val(lifestyle, "wake_time") or _extract_val(profile, "wake_time")
    if raw_wake is not None:
        student["wake_time"] = _parse_time_to_hours(raw_wake, default_hour=7.0)
    else:
        student["wake_time"] = STUDENT_FIELD_DEFAULTS["wake_time"]
        defaulted_fields.append("wake_time")

    # lights_off_time correlates directly with sleep_time
    student["lights_off_time"] = student["sleep_time"]

    raw_consistency = _extract_val(lifestyle, "schedule_consistency") or _extract_val(profile, "schedule_consistency")
    if raw_consistency is not None:
        student["schedule_consistency"] = int(raw_consistency)
    else:
        student["schedule_consistency"] = STUDENT_FIELD_DEFAULTS["schedule_consistency"]
        defaulted_fields.append("schedule_consistency")

    # ------------------------------------------------------------------------
    # 3. Work & Academic Features (from Lifestyle or combined dict)
    # ------------------------------------------------------------------------
    raw_study = _extract_val(lifestyle, "study_hours") or _extract_val(profile, "study_hours")
    if raw_study is not None:
        student["study_hours"] = int(raw_study)
    else:
        student["study_hours"] = STUDENT_FIELD_DEFAULTS["study_hours"]
        defaulted_fields.append("study_hours")

    # Academic seriousness: derived from study hours (1-7 scale mapped to 1-5)
    student["academic_seriousness"] = min(5, max(1, round(student["study_hours"] * 5.0 / 7.0)))

    # ------------------------------------------------------------------------
    # 4. Cleanliness Features (from Lifestyle or combined dict)
    # ------------------------------------------------------------------------
    raw_clean_score = _extract_val(lifestyle, "cleanliness_score") or _extract_val(profile, "cleanliness_score")
    if raw_clean_score is not None:
        student["cleanliness_score"] = int(raw_clean_score)
    else:
        clean_enum = _extract_val(lifestyle, "cleanliness") or _extract_val(profile, "cleanliness")
        clean_map = {"very_clean": 5, "clean": 4, "moderate": 3, "relaxed": 2}
        if clean_enum and str(clean_enum).lower() in clean_map:
            student["cleanliness_score"] = clean_map[str(clean_enum).lower()]
        else:
            student["cleanliness_score"] = STUDENT_FIELD_DEFAULTS["cleanliness_score"]
            defaulted_fields.append("cleanliness_score")

    # Organization score: correlated with cleanliness score
    student["organization_score"] = student["cleanliness_score"]

    # ------------------------------------------------------------------------
    # 5. Social & Privacy Features (from Lifestyle & Preference)
    # ------------------------------------------------------------------------
    raw_privacy = _extract_val(lifestyle, "privacy_preference") or _extract_val(profile, "privacy_preference")
    if raw_privacy is not None:
        student["privacy_preference"] = int(raw_privacy)
    else:
        student["privacy_preference"] = STUDENT_FIELD_DEFAULTS["privacy_preference"]
        defaulted_fields.append("privacy_preference")

    raw_talk = _extract_val(lifestyle, "talkativeness") or _extract_val(profile, "talkativeness")
    if raw_talk is not None:
        student["talkativeness"] = int(raw_talk)
    else:
        student["talkativeness"] = STUDENT_FIELD_DEFAULTS["talkativeness"]
        defaulted_fields.append("talkativeness")

    raw_friendship = _extract_val(lifestyle, "friendship_expectation") or _extract_val(profile, "friendship_expectation")
    if raw_friendship is not None:
        student["friendship_expectation"] = int(raw_friendship)
    else:
        student["friendship_expectation"] = STUDENT_FIELD_DEFAULTS["friendship_expectation"]
        defaulted_fields.append("friendship_expectation")

    raw_guest_freq = _extract_val(lifestyle, "guest_frequency") or _extract_val(profile, "guest_frequency")
    if raw_guest_freq is not None:
        student["guest_frequency"] = _map_frequency_level(raw_guest_freq)
    else:
        student["guest_frequency"] = STUDENT_FIELD_DEFAULTS["guest_frequency"]
        defaulted_fields.append("guest_frequency")

    # Boundary importance: derived from preference.personal_space if present
    personal_space = _extract_val(preference, "personal_space") or _extract_val(profile, "personal_space")
    space_map = {"a_lot": 5, "moderate": 3, "comfortable_sharing": 2}
    if personal_space and str(personal_space).lower() in space_map:
        student["boundary_importance"] = space_map[str(personal_space).lower()]
    else:
        student["boundary_importance"] = student["privacy_preference"]

    # ------------------------------------------------------------------------
    # 6. Environment, Noise & Habits (from Lifestyle)
    # ------------------------------------------------------------------------
    raw_noise = _extract_val(lifestyle, "noise_sleep_tolerance") or _extract_val(profile, "noise_sleep_tolerance")
    if raw_noise is not None:
        student["noise_sleep_tolerance"] = int(raw_noise)
    else:
        student["noise_sleep_tolerance"] = STUDENT_FIELD_DEFAULTS["noise_sleep_tolerance"]
        defaulted_fields.append("noise_sleep_tolerance")

    raw_gaming = _extract_val(lifestyle, "gaming_hours") or _extract_val(profile, "gaming_hours")
    if raw_gaming is not None:
        student["gaming_hours"] = int(raw_gaming)
    else:
        student["gaming_hours"] = STUDENT_FIELD_DEFAULTS["gaming_hours"]
        defaulted_fields.append("gaming_hours")

    # Music volume: derived from music toggle
    raw_music = _extract_val(lifestyle, "music")
    if raw_music is None:
        raw_music = _extract_val(profile, "music")
    if raw_music is not None:
        if isinstance(raw_music, bool):
            student["music_volume"] = 5 if raw_music else 1
        elif isinstance(raw_music, (int, float)):
            student["music_volume"] = int(raw_music)
        else:
            student["music_volume"] = 4 if str(raw_music).lower() in ("true", "1", "yes") else 1
    else:
        student["music_volume"] = STUDENT_FIELD_DEFAULTS["music_volume"]
        defaulted_fields.append("music_volume")

    raw_fitness = _extract_val(lifestyle, "fitness") or _extract_val(profile, "fitness")
    if raw_fitness is not None:
        student["gym_frequency"] = _map_fitness_level(raw_fitness)
    else:
        student["gym_frequency"] = STUDENT_FIELD_DEFAULTS["gym_frequency"]
        defaulted_fields.append("gym_frequency")

    student["smoking"] = _map_smoking_habit(_extract_val(lifestyle, "smoking") or _extract_val(profile, "smoking"))
    student["drinking"] = _map_drinking_habit(_extract_val(lifestyle, "drinking") or _extract_val(profile, "drinking"))

    # ------------------------------------------------------------------------
    # 7. Personality & Conflict Resolution (from Preference)
    # ------------------------------------------------------------------------
    comm_style = _extract_val(preference, "communication_style") or _extract_val(profile, "communication_style")
    comm_map = {
        "mostly_independent": "Avoid",
        "occasional_checkins": "Avoid",
        "open_communication": "Direct",
        "very_communicative": "Direct",
    }
    if comm_style and str(comm_style).lower() in comm_map:
        student["conflict_style"] = comm_map[str(comm_style).lower()]
    else:
        student["conflict_style"] = STUDENT_FIELD_DEFAULTS["conflict_style"]
        defaulted_fields.append("conflict_style")

    raw_fin = _extract_val(preference, "financial_responsibility") or _extract_val(profile, "financial_responsibility")
    if raw_fin is not None:
        student["expense_responsibility"] = _map_importance_level(raw_fin)
    else:
        student["expense_responsibility"] = STUDENT_FIELD_DEFAULTS["expense_responsibility"]
        defaulted_fields.append("expense_responsibility")

    # ------------------------------------------------------------------------
    # 8. Uncollected Behavioral Attributes (Deterministic Defaults)
    # ------------------------------------------------------------------------
    uncollected_keys = [
        "alarm_count",
        "snooze_frequency",
        "temperature_preference",
        "conflict_tolerance",
        "communication_respect",
        "adaptability",
        "food_smell_tolerance",
        "religious_practice_frequency",
        "room_cleaning_frequency",
        "bathing_frequency",
        "towel_management",
        "phone_call_frequency",
        "negativity_level",
        "punctuality",
        "guest_timing_preference",
        "food_preference",
    ]
    for key in uncollected_keys:
        val = _extract_val(lifestyle, key) or _extract_val(preference, key)
        if val is not None:
            student[key] = val
        else:
            student[key] = STUDENT_FIELD_DEFAULTS[key]
            defaulted_fields.append(key)

    # ------------------------------------------------------------------------
    # 9. Lifestyle Archetype Classification
    # ------------------------------------------------------------------------
    student["lifestyle_type"] = _derive_lifestyle_type(
        sleep_time=student["sleep_time"],
        study_hours=student["study_hours"],
        gaming_hours=student["gaming_hours"],
        cleanliness_score=student["cleanliness_score"],
        talkativeness=student["talkativeness"],
        guest_frequency=student["guest_frequency"],
        fitness_level=_extract_val(lifestyle, "fitness", "never"),
        schedule_consistency=student["schedule_consistency"],
        privacy_preference=student["privacy_preference"],
    )

    return student, defaulted_fields


def build_student_from_user(user: Any) -> Tuple[Dict[str, Any], List[str]]:
    """
    Helper to build canonical student dict from an authenticated User ORM model.
    """
    profile = getattr(user, "profile", None)
    lifestyle = getattr(user, "lifestyle_profile", None)
    preference = getattr(user, "roommate_preference", None)
    accommodation = getattr(user, "accommodation_preference", None)
    location = getattr(user, "location", None)

    return build_ml_student(
        profile=profile,
        lifestyle=lifestyle,
        preference=preference,
        accommodation=accommodation,
        location=location,
        student_id=getattr(user, "id", None),
    )
