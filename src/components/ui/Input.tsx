import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block font-['Inter'] text-sm font-semibold text-on-surface mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-colors font-['Inter'] text-base ${
              icon ? "pl-12" : ""
            } ${
              error
                ? "border-error focus:border-error focus:outline-none"
                : "border-outline-variant focus:border-primary focus:outline-none"
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs font-['Inter'] text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
