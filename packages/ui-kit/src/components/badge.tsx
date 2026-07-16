import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@dmb/ui-kit/lib/utils"

// The tag chip. `default` is the selected state, `outline` the resting one —
// the accent fill is the only thing distinguishing them.
const badgeVariants = cva(
  [
    "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1",
    "rounded-none border-2 border-ink bg-clip-padding",
    "font-mono font-bold tracking-[0.06em] whitespace-nowrap uppercase",
    "transition-colors focus-visible:ring-3 focus-visible:ring-ink/40",
    "[&>svg]:pointer-events-none [&>svg]:size-3!",
  ],
  {
    variants: {
      variant: {
        // Selected / active tag.
        default: "bg-primary text-primary-foreground",
        // Resting tag.
        outline: "bg-surface text-foreground",
        muted: "bg-page text-muted-foreground",
      },
      size: {
        default: "px-[10px] py-[5px] text-[12px]",
        sm: "px-[9px] py-[5px] text-[11px]",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant,
  size,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant, size }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
