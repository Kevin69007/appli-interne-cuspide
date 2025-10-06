
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  heading,
  text,
  children,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between pb-8", className)} {...props}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold leading-tight tracking-tighter">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}
