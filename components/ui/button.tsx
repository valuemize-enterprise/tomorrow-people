"use client"

import { forwardRef, type ButtonHTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "secondary" | "ghost" | "success" | "danger"
type Size    = "sm" | "md" | "lg"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:   "btn btn-primary",
  secondary: "btn btn-secondary",
  ghost:     "btn btn-ghost",
  success:   "btn btn-success",
  danger:    "bg-[var(--danger)] text-white btn rounded-[var(--r-md)] px-5 py-[11px] hover:brightness-110",
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && "btn-full",
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <SpinnerIcon />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)
Button.displayName = "Button"

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}
