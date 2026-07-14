"use client"

import * as React from "react"

import { cn } from "@dmb/ui-kit/lib/utils"

/**
 * Field labels in this design are typeset like machine output: Space Mono, bold,
 * uppercase, widely tracked — EMAIL, PASSWORD, TAG, USER, DATE. The uppercasing
 * is done here rather than in the copy, so callers pass normal strings.
 */
function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 font-mono text-[11px] leading-none font-bold tracking-[0.12em] uppercase select-none",
        "group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50",
        "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
