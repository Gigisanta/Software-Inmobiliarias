"use client";

import * as React from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const inputBase = [
  "h-10 w-full rounded-xl border border-border bg-surface px-3.5 text-sm text-foreground",
  "placeholder:text-muted-2",
  "transition-[border-color,box-shadow] duration-[180ms] ease-out",
  "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
].join(" ");

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(inputBase, className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputBase, "h-auto min-h-20 resize-none py-2.5 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onValueChange: (value: string) => void;
}

/** Búsqueda con ícono y botón de limpiar. */
export function SearchInput({ value, onValueChange, className, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
      <input
        type="text"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(inputBase, "pl-10 pr-9")}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onValueChange("")}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted-2 transition-colors duration-[180ms] hover:bg-surface-2 hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

/** Select nativo estilizado (accesible y liviano). */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  ...props
}: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(inputBase, "appearance-none pr-9", value === "" && "text-muted-2")}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-2" />
    </div>
  );
}

/** Campo con etiqueta superior. */
export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
