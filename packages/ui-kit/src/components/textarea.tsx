import * as React from "react"

import { cn } from "@dmb/ui-kit/lib/utils"

/**
 * The composer ("What's happening?"). Flat like the inputs — 2.5px border, no
 * shadow. `field-sizing-content` lets it grow with the message instead of
 * scrolling inside a fixed box, which matters when the cap is 240 characters.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-[84px] w-full rounded-none border-[2.5px] border-ink bg-surface px-4 py-3",
        "font-sans text-[16px] outline-none transition-colors resize-none",
        "placeholder:text-muted-foreground",
        "focus-visible:ring-3 focus-visible:ring-ink/40",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
