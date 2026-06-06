import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-4",
        month_caption: "text-center",
        month: "space-y-4",
        caption: "relative flex items-center justify-center",
        caption_label: "text-sm font-semibold capitalize",
        nav: "absolute inset-x-0 flex justify-between",
        nav_button: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "h-8 w-8 rounded-full bg-background p-0 shadow-sm hover:bg-accent"
        ),
        nav_button_previous: "ml-1",
        nav_button_next: "mr-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between",
        head_cell: "w-9 text-muted-foreground text-center text-xs font-medium",
        row: "flex w-full justify-between mt-2",
        cell: "relative h-9 w-9 text-center text-sm flex items-center justify-center rounded-md",
        day: cn("h-9 w-9 p-0 rounded-md hover:bg-[#7C3BED] hover:text-white"),
        selected: "bg-[#7C3BED] text-white hover:bg-[#7C3BED]",
        // day_selected:
        //   "bg-primary text-primary-foreground hover:bg-[#7C3BED] hover:text-primary-foreground",
        day_today: "border border-primary text-primary",
        day_outside: "text-muted-foreground opacity-40",
        day_disabled: "opacity-30",
        day_range_middle: "bg-accent text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />;
          }

          return <ChevronRight className="h-4 w-4" />;
        },
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
