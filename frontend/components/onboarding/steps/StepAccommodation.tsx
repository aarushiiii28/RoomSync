import React from "react";
import { IndianRupee } from "lucide-react";
import {
  AccommodationCreate,
  AccommodationType,
  RoomType,
  MoveInTimeframe,
  LeaseDuration,
} from "@/types/onboarding";
import FormField from "../shared/FormField";
import TextInput from "../shared/TextInput";
import PillGroup, { PillOption } from "../shared/PillGroup";

interface StepAccommodationProps {
  data: AccommodationCreate;
  onChange: (updated: Partial<AccommodationCreate>) => void;
  errors: Record<string, string>;
}

const ACCOMMODATION_OPTIONS: PillOption<AccommodationType>[] = [
  { value: "apartment", label: "Apartment" },
  { value: "flat", label: "Flat" },
  { value: "pg", label: "PG / Hostel" },
  { value: "house", label: "Independent House" },
  { value: "other", label: "Other" },
];

const ROOM_TYPE_OPTIONS: PillOption<RoomType>[] = [
  { value: "private", label: "Private Room (Single)" },
  { value: "shared", label: "Shared Room (Double/Triple)" },
];

const TIMEFRAME_OPTIONS: PillOption<MoveInTimeframe>[] = [
  { value: "within_1_month", label: "Within 1 month" },
  { value: "one_to_three_months", label: "1–3 months" },
  { value: "three_to_six_months", label: "3–6 months" },
  { value: "six_to_twelve_months", label: "6–12 months" },
  { value: "not_sure", label: "Not sure yet" },
];

const LEASE_OPTIONS: PillOption<LeaseDuration>[] = [
  { value: "1_month", label: "1 Month" },
  { value: "3_months", label: "3 Months" },
  { value: "6_months", label: "6 Months" },
  { value: "12_months", label: "1 Year+" },
  { value: "flexible", label: "Flexible" },
];

export default function StepAccommodation({
  data,
  onChange,
  errors,
}: StepAccommodationProps) {
  return (
    <div className="space-y-6">
      {/* Accommodation Type */}
      <FormField
        label="Accommodation Type"
        required
        description="What kind of place are you looking for?"
        error={errors.accommodation_type}
      >
        <PillGroup<AccommodationType>
          options={ACCOMMODATION_OPTIONS}
          value={data.accommodation_type}
          onChange={(accommodation_type) => onChange({ accommodation_type })}
          columns={3}
        />
      </FormField>

      {/* Room Type */}
      <FormField
        label="Room Preference"
        required
        description="Do you prefer having your own private bedroom or sharing?"
        error={errors.room_type}
      >
        <PillGroup<RoomType>
          options={ROOM_TYPE_OPTIONS}
          value={data.room_type}
          onChange={(room_type) => onChange({ room_type })}
          columns={2}
        />
      </FormField>


      {/* Budget Range */}
      <div className="p-4 rounded-lg bg-white border border-[#EBD6CF] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[13px] font-semibold text-[#686E85]">
            Monthly Budget Range (₹) <span className="text-[#D97870]">*</span>
          </label>
          <span className="text-[12px] text-[#494F66] font-bold">
            ₹{Number(data.budget_min).toLocaleString()} – ₹
            {Number(data.budget_max).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField label="Min Budget" error={errors.budget_min}>
            <TextInput
              type="number"
              min={0}
              step={500}
              icon={<IndianRupee size={15} />}
              value={data.budget_min}
              onChange={(e) =>
                onChange({ budget_min: parseFloat(e.target.value) || 0 })
              }
              hasError={Boolean(errors.budget_min)}
              placeholder="e.g. 5000"
            />
          </FormField>

          <FormField label="Max Budget" error={errors.budget_max}>
            <TextInput
              type="number"
              min={0}
              step={500}
              icon={<IndianRupee size={15} />}
              value={data.budget_max}
              onChange={(e) =>
                onChange({ budget_max: parseFloat(e.target.value) || 0 })
              }
              hasError={Boolean(errors.budget_max)}
              placeholder="e.g. 15000"
            />
          </FormField>
        </div>
      </div>
    </div>
  );
}
