import React from "react";
import { Check, IndianRupee } from "lucide-react";
import {
  PreferenceCreate,
  GenderPreference,
  SocialStyle,
  PersonalSpacePreference,
  CommunicationStyle,
  ImportanceLevel,
  HouseholdResponsibilityPreference,
} from "@/types/onboarding";
import FormField from "../shared/FormField";
import TextInput from "../shared/TextInput";
import PillGroup, { PillOption } from "../shared/PillGroup";
import RadioGroup, { RadioOption } from "../shared/RadioGroup";

interface StepPreferencesProps {
  data: PreferenceCreate;
  onChange: (updated: Partial<PreferenceCreate>) => void;
  errors: Record<string, string>;
}

const GENDER_PREF_OPTIONS: PillOption<GenderPreference>[] = [
  { value: "any", label: "Any Gender" },
  { value: "female", label: "Female Only" },
  { value: "male", label: "Male Only" },
  { value: "non_binary", label: "Non-Binary" },
];

const SOCIAL_STYLE_OPTIONS: RadioOption<SocialStyle>[] = [
  { value: "very_private", label: "Very private" },
  { value: "somewhat_private", label: "Somewhat private" },
  { value: "balanced", label: "Balanced" },
  { value: "very_social", label: "Very social" },
];

const PERSONAL_SPACE_OPTIONS: RadioOption<PersonalSpacePreference>[] = [
  { value: "a_lot", label: "A lot of personal space" },
  { value: "moderate", label: "Moderate personal space" },
  { value: "comfortable_sharing", label: "Comfortable sharing space" },
];

const COMMUNICATION_STYLE_OPTIONS: RadioOption<CommunicationStyle>[] = [
  { value: "mostly_independent", label: "Mostly independent" },
  { value: "occasional_checkins", label: "Occasional check-ins" },
  { value: "open_communication", label: "Open communication" },
  { value: "very_communicative", label: "Very communicative" },
];

const IMPORTANCE_OPTIONS: RadioOption<ImportanceLevel>[] = [
  { value: "not_important", label: "Not important" },
  { value: "slightly_important", label: "Slightly important" },
  { value: "important", label: "Important" },
  { value: "very_important", label: "Very important" },
];

const HOUSEHOLD_RESPONSIBILITY_OPTIONS: RadioOption<HouseholdResponsibilityPreference>[] =
  [
    { value: "mostly_separate", label: "Mostly separate" },
    { value: "flexible", label: "Flexible / as needed" },
    { value: "shared_equally", label: "Shared equally" },
    { value: "clearly_divided", label: "Clearly divided responsibilities" },
  ];

const DEAL_BREAKER_OPTIONS = [
  { value: "loud_noise", label: "Frequent loud noise & disturbances" },
  {
    value: "poor_communication",
    label: "Poor communication / avoids discussing issues",
  },
  {
    value: "unreliable_payments",
    label: "Unreliable with rent & shared expenses",
  },
  {
    value: "lack_of_boundaries",
    label: "Lack of personal boundaries or respect for belongings",
  },
  {
    value: "lack_of_privacy",
    label: "Disregard for quiet hours or personal privacy",
  },
  {
    value: "frequent_visitors",
    label: "Frequent or unannounced overnight guests",
  },
  { value: "smoking", label: "Smoking inside the room or shared spaces" },
  { value: "drinking", label: "Frequent drinking in shared living spaces" },
  { value: "pets", label: "Pets in shared living spaces" },
  { value: "untidy_living", label: "Extremely messy or untidy habits" },
  { value: "other", label: "Other" },
];

export default function StepPreferences({
  data,
  onChange,
  errors,
}: StepPreferencesProps) {
  const selectedDealBreakers = Array.isArray(data.deal_breakers)
    ? data.deal_breakers
    : [];

  const handleToggleDealBreaker = (value: string) => {
    let updated: string[];
    if (selectedDealBreakers.includes(value)) {
      updated = selectedDealBreakers.filter((item) => item !== value);
    } else {
      updated = [...selectedDealBreakers, value];
    }
    onChange({ deal_breakers: updated });
  };

  const isOtherSelected = selectedDealBreakers.includes("other");

  return (
    <div className="space-y-8">
      {/* ===================================================================== */}
      {/* 1. PREFERRED ROOMMATE GENDER (Horizontal Pill UI as specified)         */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <FormField
          label="Preferred Roommate Gender"
          required
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="Who would you be comfortable living with?"
          error={errors.preferred_gender}
        >
          <PillGroup<GenderPreference>
            options={GENDER_PREF_OPTIONS}
            value={data.preferred_gender}
            onChange={(preferred_gender) => onChange({ preferred_gender })}
            columns={4}
          />
        </FormField>
      </div>

      {/* ===================================================================== */}
      {/* 2. AGE & BUDGET                                                       */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Age & Budget
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Age Range Card */}
          <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[13.5px] font-semibold text-[#2D3246]">
                Age Range <span className="text-[#D97870]">*</span>
              </label>
              <span className="text-[12px] text-[#494F66] font-bold">
                {data.min_age} – {data.max_age} yrs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Min Age" error={errors.min_age}>
                <TextInput
                  type="number"
                  min={13}
                  max={100}
                  value={data.min_age}
                  onChange={(e) =>
                    onChange({ min_age: parseInt(e.target.value, 10) || 18 })
                  }
                  hasError={Boolean(errors.min_age)}
                />
              </FormField>

              <FormField label="Max Age" error={errors.max_age}>
                <TextInput
                  type="number"
                  min={13}
                  max={100}
                  value={data.max_age}
                  onChange={(e) =>
                    onChange({ max_age: parseInt(e.target.value, 10) || 35 })
                  }
                  hasError={Boolean(errors.max_age)}
                />
              </FormField>
            </div>
          </div>

          {/* Budget Range Card */}
          <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[13.5px] font-semibold text-[#2D3246]">
                Roommate Budget (₹) <span className="text-[#D97870]">*</span>
              </label>
              <span className="text-[12px] text-[#494F66] font-bold">
                ₹{Number(data.budget_min).toLocaleString()} – ₹
                {Number(data.budget_max).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Min (₹)" error={errors.budget_min}>
                <TextInput
                  type="number"
                  min={0}
                  step={500}
                  icon={<IndianRupee size={14} />}
                  value={data.budget_min}
                  onChange={(e) =>
                    onChange({ budget_min: parseFloat(e.target.value) || 0 })
                  }
                  hasError={Boolean(errors.budget_min)}
                />
              </FormField>

              <FormField label="Max (₹)" error={errors.budget_max}>
                <TextInput
                  type="number"
                  min={0}
                  step={500}
                  icon={<IndianRupee size={14} />}
                  value={data.budget_max}
                  onChange={(e) =>
                    onChange({ budget_max: parseFloat(e.target.value) || 0 })
                  }
                  hasError={Boolean(errors.budget_max)}
                />
              </FormField>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. SOCIAL & PERSONAL                                                  */}
      {/* ===================================================================== */}
      <div className="space-y-6">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Social & Personal
          </h2>
        </div>

        {/* Social Style */}
        <FormField
          label="Social Style"
          required
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="What kind of social dynamic would you prefer with your roommate?"
          error={errors.social_style}
        >
          <RadioGroup<SocialStyle>
            name="social_style"
            options={SOCIAL_STYLE_OPTIONS}
            value={data.social_style}
            onChange={(social_style) => onChange({ social_style })}
          />
        </FormField>

        {/* Personal Space */}
        <FormField
          label="Personal Space"
          required
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="How much personal space would you prefer at home?"
          error={errors.personal_space}
        >
          <RadioGroup<PersonalSpacePreference>
            name="personal_space"
            options={PERSONAL_SPACE_OPTIONS}
            value={data.personal_space}
            onChange={(personal_space) => onChange({ personal_space })}
          />
        </FormField>
      </div>

      {/* ===================================================================== */}
      {/* 4. COMMUNICATION                                                      */}
      {/* ===================================================================== */}
      <div className="space-y-6">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Communication
          </h2>
        </div>

        {/* Communication Style */}
        <FormField
          label="Communication Style"
          required
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="How would you prefer to communicate with your roommate?"
          error={errors.communication_style}
        >
          <RadioGroup<CommunicationStyle>
            name="communication_style"
            options={COMMUNICATION_STYLE_OPTIONS}
            value={data.communication_style}
            onChange={(communication_style) => onChange({ communication_style })}
          />
        </FormField>

        {/* Handling Issues */}
        <FormField
          label="Handling Issues"
          required
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="How important is it that your roommate is comfortable discussing problems openly?"
          error={errors.issue_handling_importance}
        >
          <RadioGroup<ImportanceLevel>
            name="issue_handling_importance"
            options={IMPORTANCE_OPTIONS}
            value={data.issue_handling_importance}
            onChange={(issue_handling_importance) =>
              onChange({ issue_handling_importance })
            }
          />
        </FormField>
      </div>

      {/* ===================================================================== */}
      {/* 5. SHARED RESPONSIBILITIES                                            */}
      {/* ===================================================================== */}
      <div className="space-y-6">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Shared Responsibilities
          </h2>
        </div>

        {/* Household Responsibilities */}
        <FormField
          label="Household Responsibilities"
          required
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="How would you prefer to handle shared household responsibilities?"
          error={errors.household_responsibilities}
        >
          <RadioGroup<HouseholdResponsibilityPreference>
            name="household_responsibilities"
            options={HOUSEHOLD_RESPONSIBILITY_OPTIONS}
            value={data.household_responsibilities}
            onChange={(household_responsibilities) =>
              onChange({ household_responsibilities })
            }
          />
        </FormField>

        {/* Financial Responsibility */}
        <FormField
          label="Financial Responsibility"
          required
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="How important is it that your roommate is reliable with shared expenses and payments?"
          error={errors.financial_responsibility}
        >
          <RadioGroup<ImportanceLevel>
            name="financial_responsibility"
            options={IMPORTANCE_OPTIONS}
            value={data.financial_responsibility}
            onChange={(financial_responsibility) =>
              onChange({ financial_responsibility })
            }
          />
        </FormField>
      </div>

      {/* ===================================================================== */}
      {/* 6. DEAL-BREAKERS (Multi-select)                                       */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        <div className="border-b border-[#EBD6CF] pb-2">
          <h2 className="text-[13.5px] font-extrabold uppercase tracking-wider text-[#2D3246]">
            Deal-Breakers
          </h2>
        </div>

        <FormField
          label="Roommate Deal-Breakers"
          optional
          labelClassName="text-[15px] font-bold text-[#2D3246]"
          descriptionClassName="text-[13px] text-[#555B70]"
          description="Are there any situations that would make a roommate unsuitable for you? (Select all that apply)"
          error={errors.deal_breakers}
        >
          <div className="space-y-2.5 pt-1">
            {DEAL_BREAKER_OPTIONS.map((opt) => {
              const isChecked = selectedDealBreakers.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 cursor-pointer select-none group py-1"
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={isChecked}
                    onChange={() => handleToggleDealBreaker(opt.value)}
                  />
                  <div
                    className={`w-[18px] h-[18px] rounded border flex items-center justify-center transition-all ${
                      isChecked
                        ? "border-[#D97870] bg-[#E5ADA2] text-white shadow-xs"
                        : "border-[#B8BDCC] bg-white group-hover:border-[#8E95AF]"
                    }`}
                  >
                    {isChecked && <Check size={13} strokeWidth={3} />}
                  </div>
                  <span
                    className={`text-[13.5px] leading-tight transition-colors ${
                      isChecked
                        ? "text-[#1B1E28] font-semibold"
                        : "text-[#2D3246] group-hover:text-[#1B1E28]"
                    }`}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>

          {isOtherSelected && (
            <div className="pt-2 pl-7">
              <TextInput
                type="text"
                placeholder="Anything else?"
                value={data.deal_breaker_other || ""}
                onChange={(e) =>
                  onChange({ deal_breaker_other: e.target.value })
                }
              />
            </div>
          )}
        </FormField>
      </div>
    </div>
  );
}
