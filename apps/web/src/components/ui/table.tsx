import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tabla limpia: encabezado discreto, filas con mucho aire y hover gris claro.
 * Se envuelve en una Card para heredar borde y radio del sistema.
 */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("", className)} {...props} />;
}

export function TBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-border", className)} {...props} />;
}

export function TR({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { interactive?: boolean }) {
  return (
    <tr
      className={cn(
        interactive &&
          "cursor-pointer transition-colors duration-[180ms] ease-out hover:bg-surface-2/60",
        className,
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "border-b border-border px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-2 first:pl-6 last:pr-6",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-4 align-middle first:pl-6 last:pr-6", className)}
      {...props}
    />
  );
}
