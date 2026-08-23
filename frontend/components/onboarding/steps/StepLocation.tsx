"use client";

import React from "react";
import { MapPin, Hash } from "lucide-react";
import { LocationCreate } from "@/types/onboarding";
import FormField from "../shared/FormField";
import TextInput from "../shared/TextInput";
import CountrySelect from "../shared/CountrySelect";
import StateSelect from "../shared/StateSelect";
import CitySelect from "../shared/CitySelect";
import LocalityInput from "../shared/LocalityInput";
import {
  isValidCountry,
  isValidState,
  isValidCity,
} from "@/constants/locations";

interface StepLocationProps {
  data: LocationCreate;
  onChange: (updated: Partial<LocationCreate>) => void;
  errors: Record<string, string>;
}

export default function StepLocation({
  data,
  onChange,
  errors,
}: StepLocationProps) {
  // Cascading Reset Handlers
  const handleCountryChange = (country: string) => {
    onChange({
      country,
      state: "",
      city: "",
      locality: "",
      pincode: "",
    });
  };

  const handleStateChange = (state: string) => {
    onChange({
      state,
      city: "",
      locality: "",
      pincode: "",
    });
  };

  const handleCityChange = (city: string) => {
    onChange({
      city,
      locality: "",
      pincode: "",
    });
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Digits only, max 6 chars
    const numericValue = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange({ pincode: numericValue });
  };

  // Geographic Validity Check for Address Summary
  const isCountryValid = isValidCountry(data.country);
  const isStateValid = isCountryValid && isValidState(data.country, data.state);
  const isCityValid = isStateValid && isValidCity(data.country, data.state, data.city);
  const hasValidHierarchy = isCountryValid && isStateValid && isCityValid;

  return (
    <div className="space-y-5">
      {/* Country & State Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Country" required error={errors.country}>
          <CountrySelect
            value={data.country}
            onChange={handleCountryChange}
            hasError={Boolean(errors.country)}
          />
        </FormField>

        <FormField label="State / Province" required error={errors.state}>
          <StateSelect
            country={data.country}
            value={data.state}
            onChange={handleStateChange}
            hasError={Boolean(errors.state)}
            disabled={!data.country}
          />
        </FormField>
      </div>

      {/* City & Locality Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="City" required error={errors.city}>
          <CitySelect
            country={data.country}
            state={data.state}
            value={data.city}
            onChange={handleCityChange}
            hasError={Boolean(errors.city)}
            disabled={!data.state}
          />
        </FormField>

        <FormField
          label="Locality / Neighborhood"
          required
          error={errors.locality}
        >
          <LocalityInput
            city={data.city}
            value={data.locality}
            onChange={(locality) => onChange({ locality })}
            hasError={Boolean(errors.locality)}
            disabled={!data.city}
          />
        </FormField>
      </div>

      {/* Postal / PIN Code */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          label="Postal / PIN Code"
          required
          error={errors.pincode}
        >
          <TextInput
            icon={<Hash size={16} />}
            placeholder="e.g. 560034"
            value={data.pincode}
            onChange={handlePincodeChange}
            hasError={Boolean(errors.pincode)}
            disabled={!data.state}
          />
        </FormField>
      </div>

      {/* Clean Accommodation Search Location Summary Card */}
      <div className="mt-2 p-4 rounded-xl bg-white border border-[#EBD6CF] shadow-xs flex items-start gap-3.5 select-none">
        <div className="w-9 h-9 rounded-full bg-[#F6D7CF] flex items-center justify-center text-[#494F66] shrink-0 mt-0.5">
          <MapPin size={18} className="text-[#D97870]" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-bold text-[#2D3246]">
            {hasValidHierarchy && data.locality.trim()
              ? "Accommodation location"
              : "Your accommodation location"}
          </h4>

          <p className="text-[13px] text-[#494F66] font-medium mt-0.5 truncate">
            {hasValidHierarchy
              ? `${data.locality ? `${data.locality}, ` : ""}${data.city}, ${data.state}`
              : data.state
              ? `Select a city within ${data.state} to continue.`
              : "Select your country, state, and city to continue."}
          </p>

          <p className="text-[11px] text-[#8E95AF] mt-1">
            Choose where you&apos;re looking for accommodation. We&apos;ll match you with people looking in the same area.
          </p>
        </div>
      </div>
    </div>
  );
}
