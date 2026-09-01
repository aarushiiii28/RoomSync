"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronDown, Check, X } from "lucide-react";
import { SUPPORTED_COUNTRIES } from "@/constants/locations";

interface CountrySelectProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  disabled?: boolean;
}

export default function CountrySelect({
  value,
  onChange,
  hasError = false,
  disabled = false,
}: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSelect = (country: string) => {
    onChange(country);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`
          w-full
          h-11
          pl-10
          pr-10
          rounded-lg
          bg-white
          border
          text-left
          flex items-center justify-between
          ${
            hasError
              ? "border-red-400 ring-1 ring-red-400"
              : isOpen
              ? "border-[#494F66] ring-1 ring-[#494F66]/20"
              : "border-[#EBD6CF]"
          }
          ${disabled ? "opacity-60 bg-gray-50 cursor-not-allowed" : "cursor-pointer"}
          text-[#2D3246]
          text-[14px]
          outline-none
          shadow-xs
          transition-all duration-200
        `}
      >
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-none">
          <Globe size={16} />
        </span>

        <span className={value ? "font-medium text-[#2D3246]" : "text-[#A6ACBE]"}>
          {value || "Select Country..."}
        </span>

        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-auto">
          {value && !disabled ? (
            <button
              type="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
                setIsOpen(true);
              }}
              className="text-[#7E849B] hover:text-[#D97870] transition-colors cursor-pointer bg-white"
            >
              <X size={16} />
            </button>
          ) : (
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </span>
      </button>

      {isOpen && !disabled && (
        <div
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
          {SUPPORTED_COUNTRIES.map((country) => {
            const isSelected = value.toLowerCase() === country.toLowerCase();

            return (
              <button
                key={country}
                type="button"
                onClick={() => handleSelect(country)}
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
                      : "text-[#494F66] hover:bg-[#F8ECE8]"
                  }
                `}
              >
                <span className="truncate">{country}</span>
                {isSelected && <Check size={14} className="shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
