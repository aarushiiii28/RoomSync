# Phase 1 — Auth models
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.email_verification import EmailVerification

# Phase 2 — User Profile & Onboarding models
from app.models.user_profile import UserProfile
from app.models.location import Location
from app.models.lifestyle_profile import LifestyleProfile
from app.models.roommate_preference import RoommatePreference
from app.models.accommodation_preference import AccommodationPreference

# Phase 3 — Chat models
from app.models.chat import Conversation, Message