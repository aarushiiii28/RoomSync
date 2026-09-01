import React from "react";
import { User, Calendar, Lock, Globe } from "lucide-react";
import { ProfileCreate, GenderEnum } from "@/types/onboarding";
import FormField from "../shared/FormField";
import TextInput from "../shared/TextInput";
import PillGroup, { PillOption } from "../shared/PillGroup";
import OccupationSelect from "../shared/OccupationSelect";

interface StepPersonalInfoProps {
  data: ProfileCreate;
  onChange: (updated: Partial<ProfileCreate>) => void;
  errors: Record<string, string>;
}

const GENDER_OPTIONS: PillOption<GenderEnum>[] = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non_binary", label: "Non-Binary" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function countWords(text: string): number {
  const trimmed = text ? text.trim() : "";
  if (!trimmed) return 0;
  // Split by whitespace and only count tokens that contain at least one alphanumeric character
  return trimmed.split(/\s+/).filter(word => /[a-zA-Z0-9]/.test(word)).length;
}

export default function StepPersonalInfo({
  data,
  onChange,
  errors,
}: StepPersonalInfoProps) {
  const bioWords = countWords(data.bio || "");
  const expWords = countWords(data.roommate_expectations || "");

  return (
    <div className="space-y-5">
      {/* First and Last Name Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name" required error={errors.first_name}>
          <TextInput
            icon={<User size={16} />}
            placeholder="First name"
            value={data.first_name}
            onChange={(e) => onChange({ first_name: e.target.value })}
            hasError={Boolean(errors.first_name)}
            autoComplete="given-name"
          />
        </FormField>

        <FormField label="Last Name" required error={errors.last_name}>
          <TextInput
            icon={<User size={16} />}
            placeholder="Last name"
            value={data.last_name}
            onChange={(e) => onChange({ last_name: e.target.value })}
            hasError={Boolean(errors.last_name)}
            autoComplete="family-name"
          />
        </FormField>
      </div>

      {/* Date of Birth & Occupation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
        <FormField
          label="Date of Birth"
          required
          description="Must be at least 18 years old"
          error={errors.date_of_birth}
        >
          <TextInput
            type="date"
            icon={<Calendar size={16} />}
            value={data.date_of_birth}
            onChange={(e) => onChange({ date_of_birth: e.target.value })}
            hasError={Boolean(errors.date_of_birth)}
            max={
              new Date(
                new Date().getFullYear() - 18,
                new Date().getMonth(),
                new Date().getDate()
              )
                .toISOString()
                .split("T")[0]
            }
          />
        </FormField>

        <FormField
          label="Occupation"
          required
          description="What you do for work or study"
          error={errors.occupation}
        >
          <OccupationSelect
            value={data.occupation}
            onChange={(occupation) => onChange({ occupation })}
            hasError={Boolean(errors.occupation)}
          />
        </FormField>
      </div>

      {/* Gender Selection */}
      <FormField label="Gender" required error={errors.gender}>
        <PillGroup<GenderEnum>
          options={GENDER_OPTIONS}
          value={data.gender}
          onChange={(gender) => onChange({ gender })}
          columns={4}
        />
      </FormField>

      {/* Section 1: Bio (Public, 4–20 words) */}
      <FormField
        label="Bio"
        required
        description="Visible to everyone on your public profile (4–20 words)."
        error={errors.bio}
      >
        <div className="relative">
          <textarea
            rows={3}
            placeholder="e.g. Software engineer who enjoys quiet weeknights, cooking on weekends, and keeping shared spaces clean."
            value={data.bio || ""}
            onChange={(e) => onChange({ bio: e.target.value })}
            className={`
              w-full
              p-3.5
              rounded-lg
              bg-white
              border
              ${errors.bio ? "border-red-400 focus:border-red-500" : "border-[#EBD6CF] focus:border-[#494F66]"}
              text-[#2D3246]
              text-[14px]
              placeholder:text-[#A6ACBE]
              outline-none
              shadow-xs
              transition-all duration-200
              resize-none
            `}
          />
          <div className="flex items-center justify-between mt-1 px-0.5">
            <span className="text-[11px] text-[#7E849B] flex items-center gap-1">
              <Globe size={12} className="text-[#7E849B]" /> Public profile
            </span>
            <span
              className={`text-[11px] font-medium ${
                bioWords === 0
                  ? "text-[#7E849B]"
                  : bioWords >= 4 && bioWords <= 20
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {bioWords} / 4–20 words
              {bioWords >= 4 && bioWords <= 20 ? " ✓" : ""}
            </span>
          </div>
        </div>
      </FormField>

      {/* Section 2: Roommate Expectations (Private & Confidential, 20–250 words) */}
      <FormField
        label="What are your expectations from the roommate?"
        required
        description="Private & confidential — used by our AI to calculate your compatibility score and to generate a short, private explanation of your match for the other person. Your original answers are never shown as written."
        error={errors.roommate_expectations}
      >
        <div className="relative">
          <textarea
            rows={4}
            placeholder="e.g. Looking for a clean and respectful roommate who values quiet hours after 10 PM on weekdays, communicates openly about chore distribution, and is mindful of shared spaces..."
            value={data.roommate_expectations || ""}
            onChange={(e) => onChange({ roommate_expectations: e.target.value })}
            className={`
              w-full
              p-3.5
              rounded-lg
              bg-white
              border
              ${
                errors.roommate_expectations
                  ? "border-red-400 focus:border-red-500"
                  : "border-[#EBD6CF] focus:border-[#494F66]"
              }
              text-[#2D3246]
              text-[14px]
              placeholder:text-[#A6ACBE]
              outline-none
              shadow-xs
              transition-all duration-200
              resize-none
            `}
          />
          <div className="flex items-center justify-between mt-1 px-0.5">
            <span className="text-[11px] text-[#7E849B] flex items-center gap-1">
              <Lock size={12} className="text-emerald-600" /> Private & confidential (only for matching)
            </span>
            <span
              className={`text-[11px] font-medium ${
                expWords === 0
                  ? "text-[#7E849B]"
                  : expWords >= 5 && expWords <= 250
                  ? "text-emerald-600"
                  : "text-amber-600"
              }`}
            >
              {expWords} / 5–250 words
              {expWords >= 5 && expWords <= 250 ? " ✓" : ""}
            </span>
          </div>
        </div>
      </FormField>
    </div>
  );
}

