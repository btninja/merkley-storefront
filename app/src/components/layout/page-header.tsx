import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    // gap-4 on desktop keeps the description and the action buttons
    // from touching when the description wraps close to the button
    // (e.g. long copy on /cuenta/empresas). min-w-0 on the text column
    // lets the description wrap instead of forcing the row to grow,
    // and shrink-0 on the action column keeps the button(s) at their
    // natural width.
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-2 shrink-0 sm:self-center">
          {children}
        </div>
      )}
    </div>
  );
}
