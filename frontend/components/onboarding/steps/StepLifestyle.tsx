import React from "react";
import {
  Moon,
  Sun,
  Music,
  Laptop,
  Clock,
} from "lucide-react";
import {
  LifestyleCreate,
  CleanlinessLevel,
  ImportanceLevel,
  ToleranceLevel,
  SmokingHabit,
  DrinkingHabit,
  PetOwnership,
  FrequencyLevel,
  FitnessLevel,
} from "@/types/onboarding";
import FormField from "../shared/FormField";
import TextInput from "../shared/TextInput";
import RadioGroup, { RadioOption } from "../shared/RadioGroup";
import ToggleSwitch from "../shared/ToggleSwitch";

interface StepLifestyleProps {
  data: LifestyleCreate;
  onChange: (updated: Partial<LifestyleCreate>) => void;
  errors: Record<string, string>;
}

const SCHEDULE_CONSISTENCY_OPTIONS: RadioOption<number>[] = [
  { value: 1, label: "Very unpredictable (irregular hours)" },
  { value: 2, label: "Somewhat flexible" },
  { value: 3, label: "Moderately consistent" },
  { value: 4, label: "Very consistent (routine-oriented)" },
  { value: 5, label: "Extremely consistent / strict daily routine" },
];

const STUDY_HOURS_OPTIONS: RadioOption<number>[] = [
  { value: 1, label: "Less than 1 hour / day" },
  { value: 2, label: "1 – 2 hours / day" },
  { value: 3, label: "2 – 3 hours / day" },
  { value: 4, label: "3 – 4 hours / day" },
  { value: 5, label: "4 – 5 hours / day" },
  { value: 6, label: "5 – 6 hours / day" },
  { value: 7, label: "6+ hours / full-time study or work" },
];

const NOISE_TOLERANCE_OPTIONS: RadioOption<number>[] = [
  { value: 1, label: "I can sleep & study through most noise" },
  { value: 2, label: "Slightly sensitive to loud sounds" },
  { value: 3, label: "Moderately sensitive (need standard quiet hours)" },
  { value: 4, label: "Very sensitive (easily disturbed by noise)" },
  { value: 5, label: "I need a very quiet environment" },
];

const CLEANLINESS_OPTIONS: RadioOption<CleanlinessLevel>[] = [
  { value: "relaxed", label: "Very relaxed / casual" },
  { value: "moderate", label: "Moderate (tidy when necessary)" },
  { value: "clean", label: "Tidy & organized" },
  { value: "very_clean", label: "Extremely tidy & spotless" },
];

const IMPORTANCE_OPTIONS: RadioOption<ImportanceLevel>[] = [
  { value: "not_important", label: "Not important" },
  { value: "slightly_important", label: "Slightly important" },
  { value: "important", label: "Important" },
  { value: "very_important", label: "Very important" },
];

const PRIVACY_PREFERENCE_OPTIONS: RadioOption<number>[] = [
  { value: 1, label: "Prefer a highly social / open environment" },
  { value: 2, label: "Enjoy sharing space and interacting frequently" },
  { value: 3, label: "Balanced — mix of social time and solitude" },
  { value: 4, label: "Prefer a mostly private routine" },
  { value: 5, label: "Love lots of personal space and quiet solitude" },
];

const TALKATIVENESS_OPTIONS: RadioOption<number>[] = [
  { value: 1, label: "Very quiet / mostly independent" },
  { value: 2, label: "Usually quiet, prefer minimal small talk" },
  { value: 3, label: "Balanced / moderate conversationalist" },
  { value: 4, label: "Quite talkative and friendly" },
  { value: 5, label: "Very social / love chatting and connecting regularly" },
];

const FRIENDSHIP_EXPECTATION_OPTIONS: RadioOption<number>[] = [
  { value: 1, label: "Purely roommates / completely independent lives" },
  { value: 2, label: "Friendly and polite, but keep personal space" },
  { value: 3, label: "Friendly, casual hanging out occasionally" },
  { value: 4, label: "Good friends who share meals and activities" },
  { value: 5, label: "Close / best friends who do most things together" },
];

const GAMING_HOURS_OPTIONS: RadioOption<number>[] = [
  { value: 0, label: "0 hours (I don't play video games)" },
  { value: 1, label: "Less than 1 hour / day" },
  { value: 2, label: "1 – 2 hours / day" },
  { value: 3, label: "2 – 3 hours / day" },
  { value: 4, label: "3 – 4 hours / day" },
  { value: 5, label: "4 – 6 hours / day" },
  { value: 8, label: "6+ hours / heavy gamer" },
];

const TOLERANCE_OPTIONS: RadioOption<ToleranceLevel>[] = [
  { value: "not_comfortable", label: "Not comfortable" },
  { value: "slightly_comfortable", label: "Slightly comfortable" },
  { value: "comfortable", label: "Comfortable" },
  { value: "very_comfortable", label: "Very comfortable" },
];

const FREQUENCY_OPTIONS: RadioOption<FrequencyLevel>[] = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "Sometimes" },
  { value: "often", label: "Often" },
  { value: "always", label: "Always" },
];

const SMOKING_OPTIONS: RadioOption<SmokingHabit>[] = [
  { value: "never", label: "Non-smoker / Never" },
  { value: "occasionally", label: "Social / Occasionally" },
  { value: "regularly", label: "Regularly" },
];

const DRINKING_OPTIONS: RadioOption<DrinkingHabit>[] = [
  { value: "never", label: "Never" },
  { value: "occasionally", label: "Occasionally" },
  { value: "regularly", label: "Regularly" },
];

const PET_OPTIONS: RadioOption<PetOwnership>[] = [
  { value: "no_pets", label: "No pets" },
  { value: "has_pets", label: "Have pets" },
];

const FITNESS_OPTIONS: RadioOption<FitnessLevel>[] = [
  { value: "never", label: "Never" },
  { value: "rarely", label: "Rarely" },
  { value: "sometimes", label: "1-2x / week" },
  { value: "often", label: "3-4x / week" },
  { value: "daily", label: "Daily" },
];

export default function StepLifestyle({
  data,
  onChange,
  errors,
}: StepLifestyleProps) {
  const handleCleanlinessChange = (cleanliness: CleanlinessLevel) => {
    let score = 3;
    if (cleanliness === "relaxed") score = 1;
    else if (cleanliness === "moderate") score = 2;
    else if (cleanliness === "clean") score = 4;
    else if (cleanliness === "very_clean") score = 5;

    onChange({ cleanliness, cleanliness_score: score });
  };

  return (
    <div className="space-y-8">
      {/* ===================================================================== */}
      {/* 1. DAILY ROUTINE                                                      */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Daily Routine
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-4">
          <h3 className="text-[14px] font-bold text-[#2D3246] flex items-center gap-2">
            <Clock size={16} className="text-[#686E85]" />
            Sleep & Wake Schedule
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Sleep Time"
              required
              labelClassName="text-[13.5px] font-semibold text-[#2D3246]"
              error={errors.sleep_time}
            >
              <TextInput
                type="time"
                icon={<Moon size={15} />}
                value={data.sleep_time}
                onChange={(e) => onChange({ sleep_time: e.target.value })}
                hasError={Boolean(errors.sleep_time)}
              />
            </FormField>

            <FormField
              label="Wake Time"
              required
              labelClassName="text-[13.5px] font-semibold text-[#2D3246]"
              error={errors.wake_time}
            >
              <TextInput
                type="time"
                icon={<Sun size={15} />}
                value={data.wake_time}
                onChange={(e) => onChange({ wake_time: e.target.value })}
                hasError={Boolean(errors.wake_time)}
              />
            </FormField>
          </div>

          <div className="pt-2 border-t border-[#F0E4E0]">
            <FormField
              label="How consistent is your daily routine?"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="How similar is your routine from day to day?"
              error={errors.schedule_consistency}
            >
              <RadioGroup<number>
                name="schedule_consistency"
                options={SCHEDULE_CONSISTENCY_OPTIONS}
                value={data.schedule_consistency || 3}
                onChange={(schedule_consistency) =>
                  onChange({ schedule_consistency })
                }
              />
            </FormField>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. STUDY / WORK ROUTINE                                               */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Study / Work Routine
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-5">
          {/* Study Hours */}
          <FormField
            label="Daily Study / Work Hours"
            required
            labelClassName="text-[14px] font-bold text-[#2D3246] flex items-center gap-2"
            descriptionClassName="text-[12.5px] text-[#555B70]"
            description="How many hours do you usually spend studying or working each day?"
            error={errors.study_hours}
          >
            <div className="pt-1">
              <RadioGroup<number>
                name="study_hours"
                options={STUDY_HOURS_OPTIONS}
                value={data.study_hours || 3}
                onChange={(study_hours) => onChange({ study_hours })}
              />
            </div>
          </FormField>

          {/* Noise Tolerance */}
          <div className="pt-3 border-t border-[#F0E4E0]">
            <FormField
              label="Quiet Time & Noise Sensitivity"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246] flex items-center gap-2"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="How sensitive are you to noise and activity when sleeping or working at home?"
              error={errors.noise_sleep_tolerance}
            >
              <div className="pt-1">
                <RadioGroup<number>
                  name="noise_sleep_tolerance"
                  options={NOISE_TOLERANCE_OPTIONS}
                  value={data.noise_sleep_tolerance || 3}
                  onChange={(noise_sleep_tolerance) =>
                    onChange({ noise_sleep_tolerance })
                  }
                />
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. CLEANLINESS                                                        */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Cleanliness
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-4">
          <FormField
            label="Shared-space cleanliness"
            required
            labelClassName="text-[14px] font-bold text-[#2D3246] flex items-center gap-2"
            descriptionClassName="text-[12.5px] text-[#555B70]"
            description="What level of cleanliness do you maintain in shared living spaces?"
            error={errors.cleanliness}
          >
            <div className="pt-1">
              <RadioGroup<CleanlinessLevel>
                name="cleanliness"
                options={CLEANLINESS_OPTIONS}
                value={data.cleanliness}
                onChange={handleCleanlinessChange}
              />
            </div>
          </FormField>

          <div className="pt-3 border-t border-[#F0E4E0]">
            <FormField
              label="How important is a similar level of cleanliness in your roommate?"
              labelClassName="text-[13.5px] font-semibold text-[#3D435A]"
              error={errors.cleanliness_importance}
            >
              <div className="pt-1">
                <RadioGroup<ImportanceLevel>
                  name="cleanliness_importance"
                  options={IMPORTANCE_OPTIONS}
                  value={data.cleanliness_importance}
                  onChange={(cleanliness_importance) =>
                    onChange({ cleanliness_importance })
                  }
                />
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. SOCIAL LIFE & SHARED LIVING                                        */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Social Life & Living
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-5">
          {/* Guests */}
          <div className="space-y-3">
            <FormField
              label="Guests & visitors"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="How often do you usually have guests over?"
              error={errors.guest_frequency}
            >
              <div className="pt-1">
                <RadioGroup<FrequencyLevel>
                  name="guest_frequency"
                  options={FREQUENCY_OPTIONS}
                  value={data.guest_frequency}
                  onChange={(guest_frequency) => onChange({ guest_frequency })}
                />
              </div>
            </FormField>

            <div className="pl-0.5 pt-1">
              <FormField
                label="How comfortable are you with a roommate having guests over?"
                labelClassName="text-[13px] font-semibold text-[#3D435A]"
                error={errors.guest_tolerance}
              >
                <RadioGroup<ToleranceLevel>
                  name="guest_tolerance"
                  options={TOLERANCE_OPTIONS}
                  value={data.guest_tolerance}
                  onChange={(guest_tolerance) => onChange({ guest_tolerance })}
                />
              </FormField>
            </div>
          </div>

          {/* Social Gatherings / Parties */}
          <div className="pt-3 border-t border-[#F0E4E0] space-y-3">
            <FormField
              label="Social gatherings & parties"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="How often do you host gatherings or parties at home?"
              error={errors.party_frequency}
            >
              <div className="pt-1">
                <RadioGroup<FrequencyLevel>
                  name="party_frequency"
                  options={FREQUENCY_OPTIONS}
                  value={data.party_frequency}
                  onChange={(party_frequency) => onChange({ party_frequency })}
                />
              </div>
            </FormField>

            <div className="pl-0.5 pt-1">
              <FormField
                label="How comfortable are you with a roommate hosting social gatherings?"
                labelClassName="text-[13px] font-semibold text-[#3D435A]"
                error={errors.party_tolerance}
              >
                <RadioGroup<ToleranceLevel>
                  name="party_tolerance"
                  options={TOLERANCE_OPTIONS}
                  value={data.party_tolerance}
                  onChange={(party_tolerance) => onChange({ party_tolerance })}
                />
              </FormField>
            </div>
          </div>

          {/* Cooking */}
          <div className="pt-3 border-t border-[#F0E4E0] space-y-3">
            <FormField
              label="Cooking at home"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="How often do you usually cook at home?"
              error={errors.cooking}
            >
              <div className="pt-1">
                <RadioGroup<FrequencyLevel>
                  name="cooking"
                  options={FREQUENCY_OPTIONS}
                  value={data.cooking}
                  onChange={(cooking) => onChange({ cooking })}
                />
              </div>
            </FormField>

            <div className="pl-0.5 pt-1">
              <FormField
                label="How comfortable are you with a roommate cooking frequently?"
                labelClassName="text-[13px] font-semibold text-[#3D435A]"
                error={errors.cooking_tolerance}
              >
                <RadioGroup<ToleranceLevel>
                  name="cooking_tolerance"
                  options={TOLERANCE_OPTIONS}
                  value={data.cooking_tolerance}
                  onChange={(cooking_tolerance) =>
                    onChange({ cooking_tolerance })
                  }
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 5. PERSONAL SPACE & SOCIAL DYNAMIC (ML Core Features)                 */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Personal Space & Social Dynamic
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-5">
          {/* Privacy Preference */}
          <FormField
            label="Personal Privacy & Space"
            required
            labelClassName="text-[14px] font-bold text-[#2D3246] flex items-center gap-2"
            descriptionClassName="text-[12.5px] text-[#555B70]"
            description="How much personal space and solitude do you prefer at home?"
            error={errors.privacy_preference}
          >
            <div className="pt-1">
              <RadioGroup<number>
                name="privacy_preference"
                options={PRIVACY_PREFERENCE_OPTIONS}
                value={data.privacy_preference || 3}
                onChange={(privacy_preference) =>
                  onChange({ privacy_preference })
                }
              />
            </div>
          </FormField>

          {/* Talkativeness */}
          <div className="pt-3 border-t border-[#F0E4E0]">
            <FormField
              label="Communication & Talkativeness"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246] flex items-center gap-2"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="How social and talkative are you at home?"
              error={errors.talkativeness}
            >
              <div className="pt-1">
                <RadioGroup<number>
                  name="talkativeness"
                  options={TALKATIVENESS_OPTIONS}
                  value={data.talkativeness || 3}
                  onChange={(talkativeness) => onChange({ talkativeness })}
                />
              </div>
            </FormField>
          </div>

          {/* Friendship Expectation */}
          <div className="pt-3 border-t border-[#F0E4E0]">
            <FormField
              label="Roommate Friendship Expectation"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246] flex items-center gap-2"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="What kind of connection or dynamic do you hope to build with your roommate?"
              error={errors.friendship_expectation}
            >
              <div className="pt-1">
                <RadioGroup<number>
                  name="friendship_expectation"
                  options={FRIENDSHIP_EXPECTATION_OPTIONS}
                  value={data.friendship_expectation || 3}
                  onChange={(friendship_expectation) =>
                    onChange({ friendship_expectation })
                  }
                />
              </div>
            </FormField>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 6. GAMING & ENTERTAINMENT (ML Core Feature)                           */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Gaming & Entertainment
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-4">
          <FormField
            label="Daily Video Gaming Time"
            required
            labelClassName="text-[14px] font-bold text-[#2D3246] flex items-center gap-2"
            descriptionClassName="text-[12.5px] text-[#555B70]"
            description="How many hours do you usually spend playing video games each day?"
            error={errors.gaming_hours}
          >
            <div className="pt-1">
              <RadioGroup<number>
                name="gaming_hours"
                options={GAMING_HOURS_OPTIONS}
                value={data.gaming_hours ?? 0}
                onChange={(gaming_hours) => onChange({ gaming_hours })}
              />
            </div>
          </FormField>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 7. PERSONAL HABITS                                                    */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Personal Habits & Routines
          </h2>
        </div>

        <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-5">
          {/* Smoking */}
          <div className="space-y-3">
            <FormField
              label="Smoking"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="Your smoking habits"
              error={errors.smoking}
            >
              <div className="pt-1">
                <RadioGroup<SmokingHabit>
                  name="smoking"
                  options={SMOKING_OPTIONS}
                  value={data.smoking}
                  onChange={(smoking) => onChange({ smoking })}
                />
              </div>
            </FormField>

            <div className="pl-0.5 pt-1">
              <FormField
                label="How comfortable are you with a roommate who smokes?"
                labelClassName="text-[13px] font-semibold text-[#3D435A]"
                error={errors.smoking_tolerance}
              >
                <RadioGroup<ToleranceLevel>
                  name="smoking_tolerance"
                  options={TOLERANCE_OPTIONS}
                  value={data.smoking_tolerance}
                  onChange={(smoking_tolerance) =>
                    onChange({ smoking_tolerance })
                  }
                />
              </FormField>
            </div>
          </div>

          {/* Drinking */}
          <div className="pt-3 border-t border-[#F0E4E0] space-y-3">
            <FormField
              label="Drinking"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="Your drinking habits"
              error={errors.drinking}
            >
              <div className="pt-1">
                <RadioGroup<DrinkingHabit>
                  name="drinking"
                  options={DRINKING_OPTIONS}
                  value={data.drinking}
                  onChange={(drinking) => onChange({ drinking })}
                />
              </div>
            </FormField>

            <div className="pl-0.5 pt-1">
              <FormField
                label="How comfortable are you with a roommate who drinks?"
                labelClassName="text-[13px] font-semibold text-[#3D435A]"
                error={errors.drinking_tolerance}
              >
                <RadioGroup<ToleranceLevel>
                  name="drinking_tolerance"
                  options={TOLERANCE_OPTIONS}
                  value={data.drinking_tolerance}
                  onChange={(drinking_tolerance) =>
                    onChange({ drinking_tolerance })
                  }
                />
              </FormField>
            </div>
          </div>

          {/* Pets */}
          <div className="pt-3 border-t border-[#F0E4E0] space-y-3">
            <FormField
              label="Pets"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="Your pet situation"
              error={errors.pets}
            >
              <div className="pt-1">
                <RadioGroup<PetOwnership>
                  name="pets"
                  options={PET_OPTIONS}
                  value={data.pets}
                  onChange={(pets) => onChange({ pets })}
                />
              </div>
            </FormField>

            <div className="pl-0.5 pt-1">
              <FormField
                label="How comfortable are you with a roommate who has pets?"
                labelClassName="text-[13px] font-semibold text-[#3D435A]"
                error={errors.pet_tolerance}
              >
                <RadioGroup<ToleranceLevel>
                  name="pet_tolerance"
                  options={TOLERANCE_OPTIONS}
                  value={data.pet_tolerance}
                  onChange={(pet_tolerance) => onChange({ pet_tolerance })}
                />
              </FormField>
            </div>
          </div>

          {/* Fitness */}
          <div className="pt-3 border-t border-[#F0E4E0]">
            <FormField
              label="Fitness & Exercise"
              required
              labelClassName="text-[14px] font-bold text-[#2D3246]"
              descriptionClassName="text-[12.5px] text-[#555B70]"
              description="How often do you work out or exercise?"
              error={errors.fitness}
            >
              <div className="pt-1">
                <RadioGroup<FitnessLevel>
                  name="fitness"
                  options={FITNESS_OPTIONS}
                  value={data.fitness}
                  onChange={(fitness) => onChange({ fitness })}
                />
              </div>
            </FormField>
          </div>

          {/* Boolean Toggles */}
          <div className="pt-3 border-t border-[#F0E4E0]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ToggleSwitch
                icon={<Music size={16} />}
                label="Music at Home"
                description="Frequently play audio/music aloud without headphones"
                checked={data.music}
                onChange={(music) => onChange({ music })}
              />

              <ToggleSwitch
                icon={<Laptop size={16} />}
                label="Remote / Work From Home"
                description="Spend weekdays working remotely from the room"
                checked={data.work_from_home}
                onChange={(work_from_home) => onChange({ work_from_home })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
