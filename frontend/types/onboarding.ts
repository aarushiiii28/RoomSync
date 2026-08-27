// ---------------------------------------------------------------------------
// Domain Enums (String-Union types matching backend PostgreSQL ENUMs)
// ---------------------------------------------------------------------------

export type GenderEnum = "male" | "female" | "non_binary" | "prefer_not_to_say";

export type GenderPreference = "male" | "female" | "non_binary" | "any";

export type CleanlinessLevel = "very_clean" | "clean" | "moderate" | "relaxed";

export type ImportanceLevel =
  | "not_important"
  | "slightly_important"
  | "important"
  | "very_important";

export type ToleranceLevel =
  | "not_comfortable"
  | "slightly_comfortable"
  | "comfortable"
  | "very_comfortable";

export type SmokingHabit = "never" | "occasionally" | "regularly";

export type DrinkingHabit = "never" | "occasionally" | "regularly";

export type PetOwnership = "has_pets" | "no_pets";

export type FrequencyLevel = "never" | "rarely" | "sometimes" | "often" | "always";

export type FitnessLevel = "never" | "rarely" | "sometimes" | "often" | "daily";

export type SleepSchedule = "early_bird" | "night_owl" | "flexible";

export type AccommodationType = "pg" | "flat" | "apartment" | "house" | "co_living" | "other";

export type RoomType = "private" | "shared";

export type MoveInTimeframe =
  | "within_1_month"
  | "one_to_three_months"
  | "three_to_six_months"
  | "six_to_twelve_months"
  | "not_sure";

export type LeaseDuration = "1_month" | "3_months" | "6_months" | "12_months" | "flexible";

export type SocialStyle =
  | "very_private"
  | "somewhat_private"
  | "balanced"
  | "very_social";

export type PersonalSpacePreference =
  | "a_lot"
  | "moderate"
  | "comfortable_sharing";

export type CommunicationStyle =
  | "mostly_independent"
  | "occasional_checkins"
  | "open_communication"
  | "very_communicative";

export type HouseholdResponsibilityPreference =
  | "mostly_separate"
  | "flexible"
  | "shared_equally"
  | "clearly_divided";

export type DealBreakerOption =
  | "loud_noise"
  | "poor_communication"
  | "unreliable_payments"
  | "lack_of_boundaries"
  | "lack_of_privacy"
  | "frequent_visitors"
  | "other";

// ---------------------------------------------------------------------------
// Profile Schemas
// ---------------------------------------------------------------------------

export interface ProfileCreate {
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO format: YYYY-MM-DD
  gender: GenderEnum;
  occupation: string;
  bio: string;
  roommate_expectations: string;
  profile_photo_url?: string | null;
}

export interface ProfileResponse {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: GenderEnum;
  occupation: string;
  bio: string | null;
  roommate_expectations?: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
}


// ---------------------------------------------------------------------------
// Location Schemas
// ---------------------------------------------------------------------------

export interface LocationCreate {
  country: string;
  state: string;
  city: string;
  locality: string;
  pincode: string;
  latitude: number | string;
  longitude: number | string;
}

export interface LocationResponse {
  id: string;
  user_id: string;
  country: string;
  state: string;
  city: string;
  locality: string;
  pincode: string;
  latitude: number | string;
  longitude: number | string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Accommodation Schemas
// ---------------------------------------------------------------------------

export interface AccommodationCreate {
  accommodation_type: AccommodationType;
  room_type: RoomType;
  move_in_timeframe: MoveInTimeframe;
  lease_duration: LeaseDuration;
  budget_min: number | string;
  budget_max: number | string;
}

export interface AccommodationResponse {
  id: string;
  user_id: string;
  accommodation_type: AccommodationType;
  room_type: RoomType;
  move_in_timeframe: MoveInTimeframe;
  lease_duration: LeaseDuration;
  budget_min: number | string;
  budget_max: number | string;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Lifestyle Schemas
// ---------------------------------------------------------------------------

export interface LifestyleCreate {
  sleep_time: string; // HH:MM
  wake_time: string; // HH:MM
  schedule_consistency: number; // 1-5
  study_hours: number; // 1-7
  noise_sleep_tolerance: number; // 1-5
  cleanliness: CleanlinessLevel;
  cleanliness_score: number; // 1-5
  cleanliness_importance: ImportanceLevel;
  privacy_preference: number; // 1-5
  talkativeness: number; // 1-5
  friendship_expectation: number; // 1-5
  gaming_hours: number; // 0-8
  smoking: SmokingHabit;
  smoking_tolerance: ToleranceLevel;
  drinking: DrinkingHabit;
  drinking_tolerance: ToleranceLevel;
  pets: PetOwnership;
  pet_tolerance: ToleranceLevel;
  guest_frequency: FrequencyLevel;
  guest_tolerance: ToleranceLevel;
  cooking: FrequencyLevel;
  cooking_tolerance: ToleranceLevel;
  party_frequency: FrequencyLevel;
  party_tolerance: ToleranceLevel;
  fitness: FitnessLevel;
  music: boolean;
  work_from_home: boolean;
}

export interface LifestyleResponse {
  id: string;
  user_id: string;
  sleep_time: string;
  wake_time: string;
  schedule_consistency: number;
  study_hours: number;
  noise_sleep_tolerance: number;
  cleanliness: CleanlinessLevel;
  cleanliness_score: number;
  cleanliness_importance: ImportanceLevel;
  privacy_preference: number;
  talkativeness: number;
  friendship_expectation: number;
  gaming_hours: number;
  smoking: SmokingHabit;
  smoking_tolerance: ToleranceLevel;
  drinking: DrinkingHabit;
  drinking_tolerance: ToleranceLevel;
  pets: PetOwnership;
  pet_tolerance: ToleranceLevel;
  guest_frequency: FrequencyLevel;
  guest_tolerance: ToleranceLevel;
  cooking: FrequencyLevel;
  cooking_tolerance: ToleranceLevel;
  party_frequency: FrequencyLevel;
  party_tolerance: ToleranceLevel;
  fitness: FitnessLevel;
  music: boolean;
  work_from_home: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Roommate Preference Schemas
// ---------------------------------------------------------------------------

export interface PreferenceCreate {
  preferred_gender: GenderPreference;
  min_age: number;
  max_age: number;
  budget_min: number | string;
  budget_max: number | string;
  social_style: SocialStyle;
  personal_space: PersonalSpacePreference;
  communication_style: CommunicationStyle;
  issue_handling_importance: ImportanceLevel;
  household_responsibilities: HouseholdResponsibilityPreference;
  financial_responsibility: ImportanceLevel;
  deal_breakers: string[];
  deal_breaker_other?: string | null;

  // Legacy fields with defaults for backward-compatibility
  smoking_tolerance?: ToleranceLevel;
  drinking_tolerance?: ToleranceLevel;
  pet_tolerance?: ToleranceLevel;
  cleanliness_requirement?: CleanlinessLevel;
  preferred_sleep_schedule?: SleepSchedule;
}

export interface PreferenceResponse {
  id: string;
  user_id: string;
  preferred_gender: GenderPreference;
  min_age: number;
  max_age: number;
  budget_min: number | string;
  budget_max: number | string;
  social_style: SocialStyle;
  personal_space: PersonalSpacePreference;
  communication_style: CommunicationStyle;
  issue_handling_importance: ImportanceLevel;
  household_responsibilities: HouseholdResponsibilityPreference;
  financial_responsibility: ImportanceLevel;
  deal_breakers: string[];
  deal_breaker_other?: string | null;

  smoking_tolerance: ToleranceLevel;
  drinking_tolerance: ToleranceLevel;
  pet_tolerance: ToleranceLevel;
  cleanliness_requirement: CleanlinessLevel;
  preferred_sleep_schedule: SleepSchedule;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Aggregated Onboarding Schemas
// ---------------------------------------------------------------------------

export interface OnboardingCreate {
  profile: ProfileCreate;
  location: LocationCreate;
  accommodation: AccommodationCreate;
  lifestyle: LifestyleCreate;
  preferences: PreferenceCreate;
}

export interface OnboardingPartialUpdate {
  profile?: Partial<ProfileCreate>;
  location?: Partial<LocationCreate>;
  accommodation?: Partial<AccommodationCreate>;
  lifestyle?: Partial<LifestyleCreate>;
  preferences?: Partial<PreferenceCreate>;
}

export interface OnboardingResponse {
  profile: ProfileResponse;
  location: LocationResponse;
  accommodation: AccommodationResponse;
  lifestyle: LifestyleResponse;
  preferences: PreferenceResponse;
}

export interface OnboardingProgressResponse {
  is_complete: boolean;
  profile: ProfileResponse | null;
  location: LocationResponse | null;
  accommodation: AccommodationResponse | null;
  lifestyle: LifestyleResponse | null;
  preferences: PreferenceResponse | null;
}
