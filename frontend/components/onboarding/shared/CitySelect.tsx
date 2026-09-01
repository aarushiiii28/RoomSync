"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { MapPin, ChevronDown, Check, X } from "lucide-react";
import { getCitiesForState } from "@/constants/locations";

interface CitySelectProps {
  country?: string;
  state?: string;
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function CitySelect({
  country = "India",
  state = "",
  value,
  onChange,
  hasError = false,
  disabled = false,
  placeholder = "Select or type city...",
}: CitySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Available cities strictly for the chosen country & state
  const availableCities = useMemo(() => {
    if (!state.trim()) return [];
    return getCitiesForState(country, state);
  }, [country, state]);

  // Filter cities based on input query
  const filteredCities = useMemo(() => {
    if (!value.trim()) {
      return availableCities;
    }
    const query = value.toLowerCase().trim();
    return availableCities.filter((city) =>
      city.toLowerCase().includes(query)
    );
  }, [value, availableCities]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFieldDisabled) return;
    const text = e.target.value;
    onChange(text);
    setHighlightedIndex(0);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isFieldDisabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredCities.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCities.length - 1
        );
      }
    } else if (e.key === "Enter") {
      if (isOpen && filteredCities.length > 0) {
        e.preventDefault();
        const selected = filteredCities[highlightedIndex] || filteredCities[0];
        if (selected) {
          handleSelect(selected);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const isFieldDisabled = disabled || !state.trim();

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Direct-typeable Autocomplete Input */}
      <div className="relative w-full">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-none">
          <MapPin size={16} />
        </span>

        <input
          type="text"
          disabled={isFieldDisabled}
          value={value}
          onChange={handleInputChange}
          onFocus={() => !isFieldDisabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isFieldDisabled ? "Select state first..." : placeholder}
          className={`
            w-full
            h-11
            pl-10
            pr-10
            rounded-lg
            bg-white
            border
            ${
              hasError
                ? "border-red-400 ring-1 ring-red-400"
                : isOpen
                ? "border-[#494F66] ring-1 ring-[#494F66]/20"
                : "border-[#EBD6CF]"
            }
            ${
              isFieldDisabled
                ? "opacity-60 bg-gray-50 cursor-not-allowed text-[#8E95AF]"
                : "text-[#2D3246]"
            }
            text-[14px]
            placeholder:text-[#A6ACBE]
            outline-none
            shadow-xs
            transition-all duration-200
          `}
        />

        {value && !isFieldDisabled ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setIsOpen(true);
            }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] hover:text-[#D97870] transition-colors cursor-pointer bg-white"
          >
            <X size={16} />
          </button>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            disabled={isFieldDisabled}
            onClick={() => !isFieldDisabled && setIsOpen((prev) => !prev)}
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] ${
              isFieldDisabled
                ? "cursor-not-allowed opacity-50"
                : "hover:text-[#2D3246] transition-colors cursor-pointer"
            }`}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && !isFieldDisabled && (
        <div
          ref={listRef}
          className="
            absolute
            top-full
            left-0
            right-0
            mt-1.5
            max-h-60
            rounded-xl
            bg-white
            border border-[#EBD6CF]
            shadow-[0_12px_36px_rgba(0,0,0,0.15)]
            overflow-y-auto
            z-50
            p-1.5
            space-y-0.5
            animate-in fade-in slide-in-from-top-1
            duration-150
          "
        >
          {filteredCities.length > 0 ? (
            filteredCities.map((city, index) => {
              const isSelected = value.toLowerCase() === city.toLowerCase();
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={city}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(city)}
                  className={`
                    w-full
                    flex items-center justify-between
                    px-3 py-2
                    rounded-lg
                    text-left
                    text-[13px]
                    transition-colors
                    cursor-pointer
                    ${
                      isSelected
                        ? "bg-[#E5ADA2] text-[#2D3246] font-semibold"
                        : isHighlighted
                        ? "bg-[#F8ECE8] text-[#2D3246]"
                        : "text-[#494F66] hover:bg-[#F8ECE8]"
                    }
                  `}
                >
                  <span className="truncate">{city}</span>
                  {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                </button>
              );
            })
          ) : (
            <p className="text-center py-3 text-[13px] text-[#8E95AF]">
              No matching city found in {state}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
