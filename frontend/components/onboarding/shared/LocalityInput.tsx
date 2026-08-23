"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Building2, Check } from "lucide-react";
import { getLocalitiesForCity } from "@/constants/locations";

interface LocalityInputProps {
  city?: string;
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function LocalityInput({
  city = "",
  value,
  onChange,
  hasError = false,
  disabled = false,
  placeholder = "e.g. Koramangala / Andheri West",
}: LocalityInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const cityLocalities = useMemo(() => {
    if (!city.trim()) return [];
    return getLocalitiesForCity(city);
  }, [city]);

  const filteredLocalities = useMemo(() => {
    if (!cityLocalities.length) return [];
    if (!value.trim()) return cityLocalities;
    const query = value.toLowerCase().trim();
    return cityLocalities.filter((loc) => loc.toLowerCase().includes(query));
  }, [value, cityLocalities]);

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
    if (!isOpen && cityLocalities.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelect = (locality: string) => {
    onChange(locality);
    setIsOpen(false);
  };

  const isFieldDisabled = disabled || !city.trim();

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative w-full">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-none">
          <Building2 size={16} />
        </span>

        <input
          type="text"
          disabled={isFieldDisabled}
          value={value}
          onChange={handleInputChange}
          onFocus={() => !isFieldDisabled && cityLocalities.length > 0 && setIsOpen(true)}
          placeholder={isFieldDisabled ? "Select city first..." : placeholder}
          className={`
            w-full
            h-11
            pl-10
            pr-4
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
      </div>

      {isOpen && !isFieldDisabled && filteredLocalities.length > 0 && (
        <div
          ref={listRef}
          className="
            absolute
            top-full
            left-0
            right-0
            mt-1.5
            max-h-56
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
          <div className="px-3 py-1.5 text-[11px] font-bold text-[#8E95AF] uppercase tracking-wider">
            Popular Neighborhoods in {city}
          </div>
          {filteredLocalities.map((loc, index) => {
            const isSelected = value.toLowerCase() === loc.toLowerCase();
            const isHighlighted = index === highlightedIndex;

            return (
              <button
                key={loc}
                type="button"
                onMouseEnter={() => setHighlightedIndex(index)}
                onClick={() => handleSelect(loc)}
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
                <span className="truncate">{loc}</span>
                {isSelected && <Check size={14} className="shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
