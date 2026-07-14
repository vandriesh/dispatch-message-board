import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@dmb/ui-kit/lib/utils"

/**
 * Measured: 52px tall on the login form, 50px in the filter rail, both with a
 * 2.5px border and no shadow. Inputs are flat in this system — only buttons and
 * raised surfaces carry the offset shadow.
 */
const inputVariants = cva(
  [
    "w-full min-w-0 rounded-none border-[2.5px] border-ink bg-surface font-sans text-[16px]",
    "outline-none transition-colors",
    "placeholder:text-muted-foreground",
    "focus-visible:ring-3 focus-visible:ring-ink/40",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
  ],
  {
    variants: {
      inputSize: {
        default: "h-[52px] px-4",
        sm: "h-[50px] px-[14px]",
      },
    },
    defaultVariants: {
      inputSize: "default",
    },
  }
)

function Input({
  className,
  type,
  inputSize,
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(inputVariants({ inputSize, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }
