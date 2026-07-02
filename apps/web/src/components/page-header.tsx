import { GradientHeading } from "@/components/ui/gradient-heading";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-accent shadow-lg shadow-black/20">
            {icon}
          </div>
        )}
        <div>
          <GradientHeading variant="light" size="lg">
            {title}
          </GradientHeading>
          {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
