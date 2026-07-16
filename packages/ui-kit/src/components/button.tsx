import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@dmb/ui-kit/lib/utils"

/**
 * Two measured design rules, easy to "tidy up" into being wrong: border width
 * grows with the control (2px → 2.5px → 3px), and the offset shadow only
 * appears at >= 42px — the small controls are deliberately flat.
 */
const buttonVariants = cva(
  [
    "group/button press-brutal inline-flex shrink-0 items-center justify-center gap-2",
    "rounded-none border-ink bg-clip-padding font-mono font-bold whitespace-nowrap",
    "outline-none select-none",
    "focus-visible:ring-3 focus-visible:ring-ink/40",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        outline: "bg-surface text-foreground hover:bg-page",
        ghost: "border-transparent bg-transparent hover:bg-page",
        destructive: "bg-destructive text-white hover:bg-destructive/85",
      },
      size: {
        // EDIT / DELETE — flat, no shadow.
        xs: "h-[34px] border-2 px-3 text-[12px]",
        // LOG OUT — flat.
        sm: "h-[40px] border-[2.5px] px-4 text-[13px]",
        // POST.
        default: "h-[42px] border-[3px] px-[22px] text-[14px] shadow-brutal-sm",
        // LOAD MORE.
        lg: "h-[46px] border-[3px] px-[26px] text-[13px] shadow-brutal-md",
        // LOG IN — the one hero control.
        xl: "h-[56px] border-[3px] px-6 text-[16px] tracking-[0.02em] shadow-brutal-lg",
        icon: "size-[42px] border-[3px] shadow-brutal-sm",
        "icon-sm": "size-[34px] border-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
