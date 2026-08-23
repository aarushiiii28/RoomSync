"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Briefcase, ChevronDown, Check, Search, Plus, Edit3 } from "lucide-react";

export const OCCUPATIONS_LIST = [
  // Top Quick Option
  "Other",

  // Student & Academia
  "Student (Undergraduate)",
  "Student (Postgraduate / Master's)",
  "Student (PhD / Research Scholar)",
  "Medical Student / Intern",
  "Engineering Student",
  "Law Student",
  "MBA Student",

  // Technology & IT
  "Software Engineer / Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile App Developer (iOS / Android)",
  "DevOps / Cloud Engineer",
  "Data Scientist / AI Engineer",
  "Data Analyst",
  "Product Manager",
  "UI/UX Designer",
  "Cybersecurity Analyst",
  "QA / Test Engineer",
  "System Administrator",
  "IT Consultant / Support",

  // Business, Finance & Management
  "Management Consultant",
  "Financial Analyst",
  "Investment Banker",
  "Chartered Accountant (CA)",
  "Accountant / Auditor",
  "Business Analyst",
  "Project Manager",
  "HR / Talent Acquisition",
  "Operations Manager",
  "Risk & Compliance Analyst",

  // Marketing, Creative & Media
  "Digital Marketer",
  "Content Creator / Influencer",
  "Copywriter / Content Writer",
  "Graphic Designer",
  "Video Editor / Animator",
  "Brand Manager",
  "PR / Communications Specialist",
  "Journalist / Media Professional",
  "Photographer / Videographer",

  // Healthcare & Medicine
  "Doctor / Physician",
  "Surgeon",
  "Dentist",
  "Nurse / Healthcare Worker",
  "Pharmacist",
  "Psychologist / Therapist",
  "Physiotherapist",
  "Medical Researcher",

  // Engineering & Architecture
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical / Electronics Engineer",
  "Chemical Engineer",
  "Architect",
  "Interior Designer",

  // Legal & Public Policy
  "Lawyer / Advocate",
  "Legal Advisor / Corporate Counsel",
  "Civil Servant / Government Officer",
  "Policy Analyst",

  // Education & Academia
  "Teacher / School Educator",
  "Professor / Lecturer",
  "Corporate Trainer / Coach",

  // Sales & Customer Operations
  "Sales Executive / Account Executive",
  "Business Development (BDE)",
  "Customer Success Specialist",

  // Aviation, Travel & Hospitality
  "Pilot / Aviation Crew",
  "Cabin Crew / Flight Attendant",
  "Chef / Culinary Specialist",
  "Hotel / Hospitality Manager",

  // Entrepreneurship & Freelance
  "Founder / Entrepreneur",
  "Freelancer / Self-Employed",
  "Real Estate Professional",
  "Fitness Trainer / Nutritionist",
];

interface OccupationSelectProps {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  placeholder?: string;
}

export default function OccupationSelect({
  value,
  onChange,
  hasError = false,
  placeholder = "e.g. Software Engineer / Student",
}: OccupationSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter occupations matching query
  const filteredOccupations = useMemo(() => {
    if (!searchTerm.trim()) {
      return OCCUPATIONS_LIST;
    }
    const query = searchTerm.toLowerCase();
    return OCCUPATIONS_LIST.filter((occ) => occ.toLowerCase().includes(query));
  }, [searchTerm]);

  const exactMatch = OCCUPATIONS_LIST.some(
    (occ) => occ.toLowerCase() === (searchTerm || value).toLowerCase()
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (occupation: string) => {
    if (occupation === "Other") {
      setIsCustom(true);
      onChange("");
      setSearchTerm("");
      setIsOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setIsCustom(false);
      onChange(occupation);
      setSearchTerm("");
      setIsOpen(false);
    }
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Main Trigger Box */}
      {!isCustom ? (
        <div
          onClick={() => {
            setIsOpen((prev) => !prev);
            setSearchTerm("");
          }}
          className={`
            w-full
            h-11
            pl-10
            pr-10
            rounded-lg
            bg-white
            border
            ${hasError ? "border-red-400 ring-1 ring-red-400" : isOpen ? "border-[#494F66] ring-1 ring-[#494F66]/30" : "border-[#EBD6CF]"}
            text-[#2D3246]
            text-[14px]
            shadow-xs
            flex items-center justify-between
            cursor-pointer
            select-none
            transition-all duration-200
          `}
        >
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] pointer-events-none">
            <Briefcase size={16} />
          </span>

          <span
            className={`truncate ${
              value ? "text-[#2D3246] font-medium" : "text-[#A6ACBE]"
            }`}
          >
            {value || placeholder}
          </span>

          <span
            className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[#7E849B] transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            <ChevronDown size={16} />
          </span>
        </div>
      ) : (
        /* Custom "Other" Text Input */
        <div className="relative w-full">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7E849B]">
            <Briefcase size={16} />
          </span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your specific occupation..."
            value={value}
            onChange={handleCustomInput}
            maxLength={150}
            className={`
              w-full
              h-11
              pl-10
              pr-20
              rounded-lg
              bg-white
              border
              ${hasError ? "border-red-400 ring-1 ring-red-400" : "border-[#EBD6CF] focus:border-[#494F66]"}
              text-[#2D3246]
              text-[14px]
              outline-none
              shadow-xs
            `}
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false);
              setIsOpen(true);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-[#494F66] bg-[#F7EBE8] px-2.5 py-1 rounded-md hover:bg-[#F2DFD9] transition-colors cursor-pointer"
          >
            List
          </button>
        </div>
      )}

      {/* Searchable Dropdown Popover */}
      {isOpen && !isCustom && (
        <div
          className="
            absolute
            top-full
            left-0
            right-0
            mt-1.5
            max-h-72
            rounded-xl
            bg-white
            border border-[#EBD6CF]
            shadow-[0_12px_36px_rgba(0,0,0,0.15)]
            overflow-hidden
            z-50
            flex flex-col
            animate-in fade-in slide-in-from-top-1
            duration-150
          "
        >
          {/* Search Box in Header */}
          <div className="p-2.5 border-b border-[#F2DFD9] bg-[#FDF9F7] sticky top-0 z-10 flex items-center gap-2">
            <Search size={15} className="text-[#8E95AF] shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search occupation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="
                w-full
                bg-transparent
                text-[#2D3246]
                text-[13px]
                outline-none
                placeholder:text-[#A6ACBE]
              "
            />
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-56">
            {/* Top Quick Custom Action if not searching */}
            {!searchTerm.trim() && (
              <button
                type="button"
                onClick={() => handleSelect("Other")}
                className="
                  w-full
                  flex items-center justify-between
                  px-3 py-2
                  mb-1
                  rounded-lg
                  text-left
                  text-[13px]
                  font-semibold
                  text-[#494F66]
                  bg-[#FDF3F0]
                  border border-[#EBD6CF]
                  hover:bg-[#F8ECE8]
                  transition-colors
                  cursor-pointer
                "
              >
                <div className="flex items-center gap-2 truncate">
                  <Edit3 size={14} className="text-[#D97870] shrink-0" />
                  <span>Other (Type Custom Occupation)</span>
                </div>
              </button>
            )}

            {filteredOccupations
              .filter((occ) => occ !== "Other")
              .map((occ) => {
                const isSelected = value === occ;
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => handleSelect(occ)}
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
                          : "text-[#494F66] hover:bg-[#F8ECE8] hover:text-[#2D3246]"
                      }
                    `}
                  >
                    <span className="truncate">{occ}</span>
                    {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                  </button>
                );
              })}

            {/* If search query has no exact match, offer custom typing */}
            {searchTerm.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => {
                  onChange(searchTerm.trim());
                  setIsOpen(false);
                  setSearchTerm("");
                }}
                className="
                  w-full
                  flex items-center gap-2
                  px-3 py-2.5
                  rounded-lg
                  text-left
                  text-[13px]
                  text-[#2D3246]
                  bg-[#FDF3F0]
                  border border-[#E5ADA2]
                  hover:bg-[#FBE8E3]
                  transition-colors
                  cursor-pointer
                  mt-1
                "
              >
                <Plus size={14} className="text-[#D97870] shrink-0" />
                <span className="truncate font-medium">
                  Use &quot;<strong>{searchTerm.trim()}</strong>&quot;
                </span>
              </button>
            )}

            {filteredOccupations.length === 0 && !searchTerm.trim() && (
              <p className="text-center py-4 text-[13px] text-[#8E95AF]">
                No matching occupations found.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
