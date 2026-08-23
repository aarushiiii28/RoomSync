import React from "react";

interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  description?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

export default function FormField({
  label,
  required,
  optional,
  description,
  error,
  children,
  className = "",
  labelClassName = "",
  descriptionClassName = "",
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          className={
            labelClassName ||
            "text-[13px] font-semibold text-[#686E85] tracking-tight"
          }
        >
          {label}
          {required && <span className="text-[#D97870] ml-1">*</span>}
        </label>
        {optional && (
          <span className="text-[11px] text-[#9AA0B6] uppercase tracking-wider font-semibold">
            Optional
          </span>
        )}
      </div>

      {description && (
        <p
          className={
            descriptionClassName ||
            "text-[12.5px] text-[#6B7288] leading-normal"
          }
        >
          {description}
        </p>
      )}

      {children}

      {error && (
        <p className="text-[12px] text-red-500 mt-1 font-medium">{error}</p>
      )}
    </div>
  );
}
