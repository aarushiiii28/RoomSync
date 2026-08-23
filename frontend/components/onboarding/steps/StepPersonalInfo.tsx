import React from "react";
import { User, Calendar } from "lucide-react";
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

export default function StepPersonalInfo({
  data,
  onChange,
  errors,
}: StepPersonalInfoProps) {
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

      {/* Short Bio */}
      <FormField
        label="About You"
        optional
        description="A short intro helps potential roommates get to know your vibe."
        error={errors.bio}
      >
        <div className="relative">
          <textarea
            rows={3}
            maxLength={1000}
            placeholder="e.g. Love weekend cooking, quiet weekdays, and working on side projects..."
            value={data.bio || ""}
            onChange={(e) => onChange({ bio: e.target.value })}
            className="
              w-full
              p-3.5
              rounded-lg
              bg-white
              border border-[#EBD6CF]
              text-[#2D3246]
              text-[14px]
              placeholder:text-[#A6ACBE]
              outline-none
              shadow-xs
              transition-all duration-200
              focus:border-[#494F66]
              resize-none
            "
          />
          <div className="flex justify-end mt-1">
            <span className="text-[11px] text-[#7E849B]">
              {(data.bio || "").length}/1000
            </span>
          </div>
        </div>
      </FormField>
    </div>
  );
}
