"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Compass, ChevronDown, Check } from "lucide-react";
import { getStatesForCountry } from "@/constants/locations";

interface StateSelectProps {
  country?: string;
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export default function StateSelect({
  country = "India",
  value,
  onChange,
  hasError = false,
  disabled = false,
  placeholder = "Select or type state...",
}: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const availableStates = useMemo(() => {
    return getStatesForCountry(country);
  }, [country]);

  // Filter states based on input value
  const filteredStates = useMemo(() => {
    if (!value.trim()) {
      return availableStates;
    }
    const query = value.toLowerCase().trim();
    return availableStates.filter((state) =>
      state.toLowerCase().includes(query)
    );
  }, [value, availableStates]);

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
    if (disabled) return;
    const text = e.target.value;
    onChange(text);
    setHighlightedIndex(0);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleSelect = (state: string) => {
    onChange(state);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredStates.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (isOpen) {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredStates.length - 1
        );
      }
    } else if (e.key === "Enter") {
      if (isOpen && filteredStates.length > 0) {
        e.preventDefault();
        const selected = filteredStates[highlightedIndex] || filteredStates[0];
        if (selected) {
          handleSelect(selected);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const isFieldDisabled = disabled || !country;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Direct-typeable Autocomplete Input */}
      <div className="relative w-full">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-none">
          <Compass size={16} />
        </span>

        <input
          type="text"
          disabled={isFieldDisabled}
          value={value}
          onChange={handleInputChange}
          onFocus={() => !isFieldDisabled && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={isFieldDisabled ? "Select country first..." : placeholder}
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
          {filteredStates.length > 0 ? (
            filteredStates.map((st, index) => {
              const isSelected = value.toLowerCase() === st.toLowerCase();
              const isHighlighted = index === highlightedIndex;

              return (
                <button
                  key={st}
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(st)}
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
                  <span className="truncate">{st}</span>
                  {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                </button>
              );
            })
          ) : (
            <p className="text-center py-3 text-[13px] text-[#8E95AF]">
              No matching state found for {country}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
