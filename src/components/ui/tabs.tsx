import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  scrollable?: boolean;
}

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, scrollable = false, ...props }, ref) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = React.useState({ left: false, right: false });

  React.useEffect(() => {
    if (!scrollable || !scrollRef.current) return;

    const checkScroll = () => {
      const el = scrollRef.current;
      if (!el) return;
      
      setScrollState({
        left: el.scrollLeft > 0,
        right: el.scrollLeft < el.scrollWidth - el.clientWidth - 1,
      });
    };

    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);

    return () => {
      el?.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [scrollable]);

  if (scrollable) {
    return (
      <div
        className={cn(
          "tabs-scroll-wrapper",
          scrollState.left && "scroll-left",
          scrollState.right && "scroll-right"
        )}
      >
        <div ref={scrollRef} className="tabs-scroll-container">
          <TabsPrimitive.List
            ref={ref}
            className={cn(
              "inline-flex h-10 sm:h-9 items-center rounded-lg bg-muted p-1 text-muted-foreground gap-1",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex h-10 sm:h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground flex-wrap gap-1",
        className
      )}
      {...props}
    />
  );
})
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow shrink-0",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
