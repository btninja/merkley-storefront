import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "sm" | "lg" | "full";
}

export function Container({ className, size = "default", ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "sm" && "max-w-3xl",
        size === "default" && "max-w-7xl",
        size === "lg" && "max-w-[1400px]",
        size === "full" && "max-w-full",
        className
      )}
      {...props}
    />
  );
}
