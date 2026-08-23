"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Sparkles, AlertCircle } from "lucide-react";

import { OnboardingCreate, OnboardingPartialUpdate } from "@/types/onboarding";
import {
  getMyOnboarding,
  savePartialOnboarding,
  submitOnboarding,
} from "@/services/onboarding";

import StepProgress, { StepInfo } from "./StepProgress";
import StepPersonalInfo from "./steps/StepPersonalInfo";
import StepLocation from "./steps/StepLocation";
import StepAccommodation from "./steps/StepAccommodation";
import StepLifestyle from "./steps/StepLifestyle";
import StepPreferences from "./steps/StepPreferences";
import {
  isValidCountry,
  isValidState,
  isValidCity,
  findStateForCity,
  validatePincodeForState,
} from "@/constants/locations";

const WIZARD_STEPS: StepInfo[] = [
  { number: 1, title: "Personal profile", shortTitle: "Personal" },
  { number: 2, title: "Living location", shortTitle: "Location" },
  { number: 3, title: "Accommodation", shortTitle: "Housing" },
  { number: 4, title: "Lifestyle habits", shortTitle: "Lifestyle" },
  { number: 5, title: "Roommate match", shortTitle: "Roommate" },
];

const STEP_HEADINGS: Record<number, { title: string; subtitle: string }> = {
  1: {
    title: "Yay, let's find your match! Give us the basics about you.",
    subtitle: "Tell us a little about yourself so we can find compatible roommates for you.",
  },
  2: {
    title: "Where are you looking to stay?",
    subtitle: "Choose the location where you're looking for accommodation. We'll match you with people looking for accommodation in the same area.",
  },
  3: {
    title: "Your comfort space. Pick your housing preferences.",
    subtitle: "Choose your desired accommodation type, occupancy, and monthly budget.",
  },
  4: {
    title: "Daily vibes & lifestyle. How do you like to live?",
    subtitle: "Matching your sleep schedule, habits, and cleanliness makes the best chemistry.",
  },
  5: {
    title: "Your ideal roommate",
    subtitle:
      "Tell us what matters most to you in the person you'll share your space with.",
  },
};

const INITIAL_FORM_STATE: OnboardingCreate = {
  profile: {
    first_name: "",
    last_name: "",
    date_of_birth: "",
    gender: "female",
    occupation: "",
    bio: "",
    profile_photo_url: null,
  },
  location: {
    country: "India",
    state: "",
    city: "",
    locality: "",
    pincode: "",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  accommodation: {
    accommodation_type: "flat",
    room_type: "private",
    move_in_timeframe: "within_1_month",
    lease_duration: "6_months",
    budget_min: 5000,
    budget_max: 15000,
  },
  lifestyle: {
    sleep_time: "23:00",
    wake_time: "07:00",
    schedule_consistency: 3,
    study_hours: 3,
    noise_sleep_tolerance: 3,
    cleanliness: "clean",
    cleanliness_score: 4,
    cleanliness_importance: "important",
    privacy_preference: 3,
    talkativeness: 3,
    friendship_expectation: 3,
    gaming_hours: 0,
    smoking: "never",
    smoking_tolerance: "not_comfortable",
    drinking: "never",
    drinking_tolerance: "comfortable",
    pets: "no_pets",
    pet_tolerance: "comfortable",
    guest_frequency: "sometimes",
    guest_tolerance: "comfortable",
    cooking: "sometimes",
    cooking_tolerance: "comfortable",
    party_frequency: "rarely",
    party_tolerance: "comfortable",
    fitness: "sometimes",
    music: false,
    work_from_home: false,
  },
  preferences: {
    preferred_gender: "any",
    min_age: 18,
    max_age: 35,
    budget_min: 5000,
    budget_max: 15000,
    social_style: "balanced",
    personal_space: "moderate",
    communication_style: "open_communication",
    issue_handling_importance: "important",
    household_responsibilities: "shared_equally",
    financial_responsibility: "very_important",
    deal_breakers: [],
    deal_breaker_other: null,
    smoking_tolerance: "not_comfortable",
    drinking_tolerance: "comfortable",
    pet_tolerance: "comfortable",
    cleanliness_requirement: "clean",
    preferred_sleep_schedule: "flexible",
  },
};

export default function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const noticeParam = searchParams.get("notice");

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<OnboardingCreate>(INITIAL_FORM_STATE);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [savingExit, setSavingExit] = useState<boolean>(false);
  const [saveExitSuccess, setSaveExitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load Existing Profile Progress
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const existing = await getMyOnboarding();
        if (existing && isMounted) {
          setFormData({
            profile: existing.profile
              ? {
                  first_name: existing.profile.first_name || "",
                  last_name: existing.profile.last_name || "",
                  date_of_birth: existing.profile.date_of_birth || "",
                  gender: existing.profile.gender || "female",
                  occupation: existing.profile.occupation || "",
                  bio: existing.profile.bio || "",
                  profile_photo_url: existing.profile.profile_photo_url || null,
                }
              : INITIAL_FORM_STATE.profile,
            location: existing.location
              ? {
                  country: existing.location.country || "India",
                  state: existing.location.state || "",
                  city: existing.location.city || "",
                  locality: existing.location.locality || "",
                  pincode: existing.location.pincode || "",
                  latitude: Number(existing.location.latitude) || 12.9716,
                  longitude: Number(existing.location.longitude) || 77.5946,
                }
              : INITIAL_FORM_STATE.location,
            accommodation: existing.accommodation
              ? {
                  accommodation_type:
                    existing.accommodation.accommodation_type || "flat",
                  room_type: existing.accommodation.room_type || "private",
                  move_in_timeframe:
                    existing.accommodation.move_in_timeframe || "within_1_month",
                  lease_duration:
                    existing.accommodation.lease_duration || "6_months",
                  budget_min: Number(existing.accommodation.budget_min) || 5000,
                  budget_max: Number(existing.accommodation.budget_max) || 15000,
                }
              : INITIAL_FORM_STATE.accommodation,
            lifestyle: existing.lifestyle
              ? {
                  sleep_time: existing.lifestyle.sleep_time || "23:00",
                  wake_time: existing.lifestyle.wake_time || "07:00",
                  schedule_consistency:
                    Number(existing.lifestyle.schedule_consistency) || 3,
                  study_hours: Number(existing.lifestyle.study_hours) || 3,
                  noise_sleep_tolerance:
                    Number(existing.lifestyle.noise_sleep_tolerance) || 3,
                  cleanliness: existing.lifestyle.cleanliness || "clean",
                  cleanliness_score:
                    Number(existing.lifestyle.cleanliness_score) || 3,
                  cleanliness_importance:
                    existing.lifestyle.cleanliness_importance || "important",
                  privacy_preference:
                    Number(existing.lifestyle.privacy_preference) || 3,
                  talkativeness: Number(existing.lifestyle.talkativeness) || 3,
                  friendship_expectation:
                    Number(existing.lifestyle.friendship_expectation) || 3,
                  gaming_hours:
                    existing.lifestyle.gaming_hours !== undefined
                      ? Number(existing.lifestyle.gaming_hours)
                      : 0,
                  smoking: existing.lifestyle.smoking || "never",
                  smoking_tolerance:
                    existing.lifestyle.smoking_tolerance || "not_comfortable",
                  drinking: existing.lifestyle.drinking || "never",
                  drinking_tolerance:
                    existing.lifestyle.drinking_tolerance || "comfortable",
                  pets: existing.lifestyle.pets || "no_pets",
                  pet_tolerance:
                    existing.lifestyle.pet_tolerance || "comfortable",
                  guest_frequency:
                    existing.lifestyle.guest_frequency || "sometimes",
                  guest_tolerance:
                    existing.lifestyle.guest_tolerance || "comfortable",
                  cooking: existing.lifestyle.cooking || "sometimes",
                  cooking_tolerance:
                    existing.lifestyle.cooking_tolerance || "comfortable",
                  party_frequency:
                    existing.lifestyle.party_frequency || "rarely",
                  party_tolerance:
                    existing.lifestyle.party_tolerance || "comfortable",
                  fitness: existing.lifestyle.fitness || "sometimes",
                  music: Boolean(existing.lifestyle.music),
                  work_from_home: Boolean(existing.lifestyle.work_from_home),
                }
              : INITIAL_FORM_STATE.lifestyle,
            preferences: existing.preferences
              ? {
                  preferred_gender:
                    existing.preferences.preferred_gender || "any",
                  min_age: Number(existing.preferences.min_age) || 18,
                  max_age: Number(existing.preferences.max_age) || 35,
                  budget_min: Number(existing.preferences.budget_min) || 5000,
                  budget_max: Number(existing.preferences.budget_max) || 15000,
                  social_style:
                    existing.preferences.social_style || "balanced",
                  personal_space:
                    existing.preferences.personal_space || "moderate",
                  communication_style:
                    existing.preferences.communication_style ||
                    "open_communication",
                  issue_handling_importance:
                    existing.preferences.issue_handling_importance || "important",
                  household_responsibilities:
                    existing.preferences.household_responsibilities ||
                    "shared_equally",
                  financial_responsibility:
                    existing.preferences.financial_responsibility ||
                    "very_important",
                  deal_breakers: Array.isArray(
                    existing.preferences.deal_breakers
                  )
                    ? existing.preferences.deal_breakers
                    : [],
                  deal_breaker_other:
                    existing.preferences.deal_breaker_other || null,
                  smoking_tolerance:
                    existing.preferences.smoking_tolerance || "not_comfortable",
                  drinking_tolerance:
                    existing.preferences.drinking_tolerance || "comfortable",
                  pet_tolerance:
                    existing.preferences.pet_tolerance || "comfortable",
                  cleanliness_requirement:
                    existing.preferences.cleanliness_requirement || "clean",
                  preferred_sleep_schedule:
                    existing.preferences.preferred_sleep_schedule || "flexible",
                }
              : INITIAL_FORM_STATE.preferences,
          });

          // Resume from the first incomplete step
          if (!existing.profile?.first_name) {
            setCurrentStep(1);
          } else if (!existing.location?.city) {
            setCurrentStep(2);
          } else if (!existing.accommodation?.move_in_timeframe) {
            setCurrentStep(3);
          } else if (!existing.lifestyle?.sleep_time) {
            setCurrentStep(4);
          } else if (!existing.preferences?.min_age) {
            setCurrentStep(5);
          } else {
            setCurrentStep(1);
          }
        }
      } catch {
        // 404 means the user has not started profile yet — expected for new users.
      } finally {
        if (isMounted) {
          setLoadingInitial(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Validation per step
  // ---------------------------------------------------------------------------
  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.profile.first_name.trim()) {
        errors.first_name = "First name is required.";
      }
      if (!formData.profile.last_name.trim()) {
        errors.last_name = "Last name is required.";
      }
      if (!formData.profile.date_of_birth) {
        errors.date_of_birth = "Date of birth is required.";
      } else {
        const birthDate = new Date(formData.profile.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
          monthDiff < 0 ||
          (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }
        if (isNaN(age) || age < 18) {
          errors.date_of_birth =
            "You must be at least 18 years old to create a roommate profile.";
        }
      }
      if (!formData.profile.occupation.trim()) {
        errors.occupation = "Occupation is required.";
      }
    } else if (step === 2) {
      const country = formData.location.country.trim();
      const state = formData.location.state.trim();
      const city = formData.location.city.trim();
      const locality = formData.location.locality.trim();
      const pincode = formData.location.pincode.trim();

      if (!country) {
        errors.country = "Please select a country.";
      } else if (!isValidCountry(country)) {
        errors.country = `'${country}' is not a supported country. Currently supported: India.`;
      }

      if (!state) {
        errors.state = "Please select a state or union territory.";
      } else if (country && !isValidState(country, state)) {
        errors.state = `Please select a valid state or union territory for ${country}.`;
      }

      if (!city) {
        errors.city = state
          ? `Please select a city within ${state}.`
          : "Please select a city.";
      } else if (country && state && !isValidCity(country, state, city)) {
        const actualStates = findStateForCity(country, city);
        if (actualStates.length > 0) {
          errors.city = `${city} is not a city in ${state}. ${city} is located in ${actualStates.join(", ")}.`;
        } else {
          errors.city = `'${city}' is not a valid city for ${state}. Please select a city within ${state}.`;
        }
      }

      if (!locality) {
        errors.locality = "Locality / Neighborhood is required.";
      } else if (locality.length < 2) {
        errors.locality = "Locality must be at least 2 characters long.";
      }

      if (!pincode) {
        errors.pincode = "Postal / PIN code is required.";
      } else {
        const pinCheck = validatePincodeForState(state, pincode);
        if (!pinCheck.isValid) {
          errors.pincode =
            pinCheck.error || "PIN code must contain exactly 6 digits.";
        }
      }
    } else if (step === 3) {
      if (!formData.accommodation.move_in_timeframe) {
        errors.move_in_timeframe = "Expected move-in timeframe is required.";
      }
      const bMin = Number(formData.accommodation.budget_min);
      const bMax = Number(formData.accommodation.budget_max);
      if (isNaN(bMin) || bMin < 0) {
        errors.budget_min = "Min budget must be non-negative.";
      }
      if (isNaN(bMax) || bMax < 0) {
        errors.budget_max = "Max budget must be non-negative.";
      }
      if (bMin > bMax) {
        errors.budget_min = "Min budget cannot exceed Max budget.";
      }
    } else if (step === 4) {
      if (!formData.lifestyle.sleep_time) {
        errors.sleep_time = "Sleep time is required.";
      }
      if (!formData.lifestyle.wake_time) {
        errors.wake_time = "Wake time is required.";
      }
      if (!formData.lifestyle.schedule_consistency) {
        errors.schedule_consistency = "Schedule consistency is required.";
      }
      if (!formData.lifestyle.study_hours) {
        errors.study_hours = "Study / work hours are required.";
      }
      if (!formData.lifestyle.noise_sleep_tolerance) {
        errors.noise_sleep_tolerance = "Noise sensitivity level is required.";
      }
      if (!formData.lifestyle.cleanliness) {
        errors.cleanliness = "Cleanliness level is required.";
      }
      if (!formData.lifestyle.privacy_preference) {
        errors.privacy_preference = "Personal privacy preference is required.";
      }
      if (!formData.lifestyle.talkativeness) {
        errors.talkativeness = "Talkativeness level is required.";
      }
      if (!formData.lifestyle.friendship_expectation) {
        errors.friendship_expectation = "Friendship expectation is required.";
      }
      if (
        formData.lifestyle.gaming_hours === undefined ||
        formData.lifestyle.gaming_hours === null
      ) {
        errors.gaming_hours = "Gaming hours are required.";
      }
    } else if (step === 5) {
      const minAge = Number(formData.preferences.min_age);
      const maxAge = Number(formData.preferences.max_age);
      if (isNaN(minAge) || minAge < 13) {
        errors.min_age = "Min age must be at least 13.";
      }
      if (isNaN(maxAge) || maxAge > 100) {
        errors.max_age = "Max age must be 100 or less.";
      }
      if (minAge > maxAge) {
        errors.min_age = "Min age cannot exceed Max age.";
      }

      const bMin = Number(formData.preferences.budget_min);
      const bMax = Number(formData.preferences.budget_max);
      if (isNaN(bMin) || bMin < 0) {
        errors.budget_min = "Min budget must be non-negative.";
      }
      if (isNaN(bMax) || bMax < 0) {
        errors.budget_max = "Max budget must be non-negative.";
      }
      if (bMin > bMax) {
        errors.budget_min = "Min budget cannot exceed Max budget.";
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ---------------------------------------------------------------------------
  // Navigation handlers
  // ---------------------------------------------------------------------------
  const handleContinue = () => {
    if (validateStep(currentStep)) {
      setStepErrors({});
      setSubmitError(null);
      if (currentStep < 5) {
        setCurrentStep((prev) => prev + 1);
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    } else {
      setSubmitError(
        "Please complete the required fields in this step before continuing."
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setStepErrors({});
      setSubmitError(null);
      setCurrentStep((prev) => prev - 1);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Save and Exit (Partial Save)
  // ---------------------------------------------------------------------------
  const handleSaveAndExit = async () => {
    setSubmitError(null);
    setSavingExit(true);

    try {
      // Build a partial location that only sends fields with actual values
      // This ensures the backend's LocationUpdate never sees empty strings
      // which would fail min_length=1 field validators.
      const loc = formData.location;
      const partialLocation: Partial<typeof loc> = {};
      if (loc.country?.trim()) partialLocation.country = loc.country;
      if (loc.state?.trim()) partialLocation.state = loc.state;
      if (loc.city?.trim()) partialLocation.city = loc.city;
      if (loc.locality?.trim()) partialLocation.locality = loc.locality;
      if (loc.pincode?.trim()) partialLocation.pincode = loc.pincode;
      if (loc.latitude !== undefined) partialLocation.latitude = loc.latitude;
      if (loc.longitude !== undefined) partialLocation.longitude = loc.longitude;

      const partialPayload: OnboardingPartialUpdate = {
        profile: formData.profile,
        location: Object.keys(partialLocation).length > 0 ? partialLocation : undefined,
        accommodation: formData.accommodation,
        lifestyle: formData.lifestyle,
        preferences: formData.preferences,
      };

      await savePartialOnboarding(partialPayload);

      setSaveExitSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 500);
    } catch {
      setSubmitError("Couldn't save your progress. Please try again.");
      setSavingExit(false);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // ---------------------------------------------------------------------------
  // Final Complete Profile Submission
  // ---------------------------------------------------------------------------
  const handleSubmit = async () => {
    // 1. Validate all steps 1 through 5 to ensure full completeness
    for (let step = 1; step <= 5; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        setSubmitError(
          "Please complete all required fields before completing your profile."
        );
        if (typeof window !== "undefined") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      await submitOnboarding(formData);
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { detail?: string | Array<{ msg?: string }> } };
      };
      const detail = errorObj?.response?.data?.detail;
      if (typeof detail === "string") {
        setSubmitError(detail);
      } else if (Array.isArray(detail) && detail.length > 0) {
        setSubmitError(detail[0]?.msg || "Validation error in submitted data.");
      } else {
        setSubmitError("Failed to save profile data. Please check your inputs.");
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-[#494F66] animate-spin" />
        <p className="text-sm text-[#8b92a5]">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1040px] mx-auto my-auto">
      {/* Split Card Container */}
      <div className="rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[620px] bg-[#F8ECE8]">
        {/* Left Sidebar (Dark Slate Theme #494F66) */}
        <div className="w-full md:w-[280px] lg:w-[310px] bg-[#494F66] p-8 sm:p-9 flex flex-col justify-between shrink-0 select-none">
          <div>
            {/* RoomSync Logo + Brand */}
            <Link href="/" className="flex items-center gap-3.5 group">
              <div className="w-10 h-10 rounded-full bg-[#F6D7CF] flex items-center justify-center p-2 shadow-xs transition-transform group-hover:scale-105">
                <Image
                  src="/logos/roomsync_logo.svg"
                  alt="RoomSync"
                  width={20}
                  height={20}
                  priority
                />
              </div>
              <span className="font-sans text-[15px] font-bold text-white tracking-widest uppercase">
                RoomSync
              </span>
            </Link>

            {/* Sidebar Heading */}
            <div className="mt-8">
              <h2 className="font-serif text-[22px] sm:text-[24px] font-medium text-white tracking-tight leading-tight">
                Complete your roommate profile.
              </h2>
              <p className="text-[#A6ACBE] text-[13px] font-medium mt-2 leading-relaxed">
                Step-by-step matchmaking setup to find someone you&apos;ll love
                living with.
              </p>
            </div>

            {/* Step Progress Vertical Indicator */}
            <div className="mt-8 sm:mt-10">
              <StepProgress steps={WIZARD_STEPS} currentStep={currentStep} />
            </div>
          </div>

          {/* Bottom Security / Privacy Badge */}
          <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2.5 text-[#A6ACBE] text-[11px] font-medium">
            <Sparkles size={14} className="text-[#F6D7CF] shrink-0" />
            <span>Your preferences remain private & secure.</span>
          </div>
        </div>

        {/* Right Main Form Area */}
        <div className="flex-1 flex flex-col justify-between bg-[#F8ECE8]">
          <div className="p-7 sm:p-9 lg:p-11 flex-1 flex flex-col justify-between">
            {/* Top Step Title & Subtitle */}
            <div>
              {/* Notice Banner (e.g. redirected from protected dashboard) */}
              {noticeParam === "incomplete" && (
                <div className="mb-4 p-3.5 rounded-xl bg-[#F6D7CF]/40 border border-[#E5ADA2] text-[#2D3246] text-[13px] flex items-center gap-2.5">
                  <Sparkles size={16} className="shrink-0 text-[#D97870]" />
                  <span>
                    Please complete your profile first to unlock your RoomSync
                    dashboard and roommate matches.
                  </span>
                </div>
              )}

              {/* Submit / Save Error Banner */}
              {submitError && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center gap-2.5">
                  <AlertCircle size={16} className="shrink-0 text-red-500" />
                  <span>{submitError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <h1 className="font-serif text-[22px] sm:text-[25px] font-normal text-[#2D3246] tracking-tight leading-snug">
                  {STEP_HEADINGS[currentStep]?.title}
                </h1>
                <p className="text-[13px] text-[#494F66] font-medium leading-relaxed max-w-xl">
                  {STEP_HEADINGS[currentStep]?.subtitle}
                </p>
              </div>
            </div>

            {/* Step Form Content with Animated Transition */}
            <div className="my-6 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {currentStep === 1 && (
                    <StepPersonalInfo
                      data={formData.profile}
                      onChange={(profile) =>
                        setFormData((prev) => ({
                          ...prev,
                          profile: { ...prev.profile, ...profile },
                        }))
                      }
                      errors={stepErrors}
                    />
                  )}

                  {currentStep === 2 && (
                    <StepLocation
                      data={formData.location}
                      onChange={(location) =>
                        setFormData((prev) => ({
                          ...prev,
                          location: { ...prev.location, ...location },
                        }))
                      }
                      errors={stepErrors}
                    />
                  )}

                  {currentStep === 3 && (
                    <StepAccommodation
                      data={formData.accommodation}
                      onChange={(accommodation) =>
                        setFormData((prev) => ({
                          ...prev,
                          accommodation: {
                            ...prev.accommodation,
                            ...accommodation,
                          },
                        }))
                      }
                      errors={stepErrors}
                    />
                  )}

                  {currentStep === 4 && (
                    <StepLifestyle
                      data={formData.lifestyle}
                      onChange={(lifestyle) =>
                        setFormData((prev) => ({
                          ...prev,
                          lifestyle: { ...prev.lifestyle, ...lifestyle },
                        }))
                      }
                      errors={stepErrors}
                    />
                  )}

                  {currentStep === 5 && (
                    <StepPreferences
                      data={formData.preferences}
                      onChange={(preferences) =>
                        setFormData((prev) => ({
                          ...prev,
                          preferences: { ...prev.preferences, ...preferences },
                        }))
                      }
                      errors={stepErrors}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* White Bottom Action Bar */}
          <div className="px-7 sm:px-9 lg:px-11 py-5 bg-white border-t border-[#EBD6CF] flex items-center justify-between gap-4">
            {/* Left side actions: Save and exit on far left, Back directly to its right on steps 2-5 */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={savingExit || submitting}
                onClick={handleSaveAndExit}
                className="
                  px-7 sm:px-8 py-2.5
                  rounded-full
                  border-2 border-[#8E95AF]
                  bg-white
                  text-[#494F66]
                  text-[14px]
                  font-semibold
                  hover:bg-[#F8ECE8]
                  transition-all duration-200
                  disabled:opacity-60
                  disabled:cursor-not-allowed
                  cursor-pointer
                  inline-flex items-center justify-center gap-2
                  select-none
                "
              >
                {savingExit ? (
                  <>
                    <Loader2 size={15} className="animate-spin text-[#494F66]" />
                    <span>Saving...</span>
                  </>
                ) : saveExitSuccess ? (
                  <>
                    <Check size={15} className="text-emerald-600" />
                    <span className="text-emerald-700 font-medium">Progress saved</span>
                  </>
                ) : (
                  "Save and exit"
                )}
              </button>

              {currentStep > 1 && (
                <button
                  type="button"
                  disabled={submitting || savingExit}
                  onClick={handleBack}
                  className="
                    px-7 sm:px-8 py-2.5
                    rounded-full
                    border-2 border-[#8E95AF]
                    bg-white
                    text-[#494F66]
                    text-[14px]
                    font-semibold
                    hover:bg-[#F8ECE8]
                    transition-all duration-200
                    disabled:opacity-40
                    disabled:cursor-not-allowed
                    cursor-pointer
                  "
                >
                  Back
                </button>
              )}
            </div>

            {/* Right side action: Next / Complete Profile */}
            <div>
              {currentStep < 5 ? (
                <button
                  type="button"
                  disabled={savingExit}
                  onClick={handleContinue}
                  className="
                    px-9 py-2.5
                    rounded-full
                    bg-[#494F66]
                    hover:bg-[#3D4359]
                    text-white
                    text-[14px]
                    font-semibold
                    shadow-md
                    active:scale-[0.98]
                    transition-all duration-200
                    cursor-pointer
                    disabled:opacity-60
                  "
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting || savingExit}
                  onClick={handleSubmit}
                  className="
                    flex items-center gap-2
                    px-9 py-2.5
                    rounded-full
                    bg-[#494F66]
                    hover:bg-[#3D4359]
                    text-white
                    text-[14px]
                    font-semibold
                    shadow-md
                    active:scale-[0.98]
                    transition-all duration-200
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                    cursor-pointer
                  "
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Complete Profile</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
