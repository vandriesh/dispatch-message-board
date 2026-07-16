"use client"

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@dmb/ui-kit/lib/utils"

/**
 * A square initial tile, not a circle. Stock shadcn paints a `rounded-full`
 * ring via an `::after` pseudo-element that survives `rounded-none` on the
 * root — it had to be removed in the kit, not overridden at the call site.
 */
const avatarVariants = cva(
  [
    "group/avatar relative flex shrink-0 items-center justify-center overflow-hidden",
    "rounded-none border-[2.5px] border-ink select-none",
  ],
  {
    variants: {
      variant: {
        /** Someone else. */
        surface: "bg-surface",
        /** The signed-in user — the design tints their own avatar with the accent. */
        accent: "bg-primary",
      },
      size: {
        sm: "size-8 text-[14px]",
        default: "size-[38px] text-[16px]",
        lg: "size-11 text-[18px]",
      },
    },
    defaultVariants: {
      variant: "surface",
      size: "default",
    },
  }
)

function Avatar({
  className,
  variant,
  size = "default",
  ...props
}: AvatarPrimitive.Root.Props & VariantProps<typeof avatarVariants>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      data-size={size}
      className={cn(avatarVariants({ variant, size, className }))}
      {...props}
    />
  )
}

function AvatarImage({ className, ...props }: AvatarPrimitive.Image.Props) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full rounded-none object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }: AvatarPrimitive.Fallback.Props) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-none",
        "font-sans font-bold text-foreground uppercase leading-none",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center",
        "rounded-none border-2 border-ink bg-primary text-primary-foreground select-none",
        "group-data-[size=sm]/avatar:size-2.5 group-data-[size=default]/avatar:size-3 group-data-[size=lg]/avatar:size-3.5",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn("group/avatar-group flex -space-x-2", className)}
      {...props}
    />
  )
}

function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-[38px] shrink-0 items-center justify-center",
        "rounded-none border-[2.5px] border-ink bg-page font-sans text-[14px] font-bold",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  avatarVariants,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarBadge,
}
