"use client"

/**
 * components/ui/confirm-dialog.tsx
 * Replaces browser confirm() which is:
 *   - Blocked by many mobile browsers and all PWAs
 *   - Not styleable
 *   - Blocks the main thread
 *
 * Usage:
 *   const { confirm, ConfirmDialog } = useConfirm()
 *   const ok = await confirm({ title: "Remove habit?", body: "..." })
 *   if (ok) { ... }
 *   return <><ConfirmDialog /></>
 */

import { useState, useCallback, useRef } from "react"

type ConfirmOptions = {
  title:       string
  body:        string
  confirmLabel?: string   // default "Confirm"
  cancelLabel?:  string   // default "Cancel"
  danger?:       boolean  // true = confirm button is red
}

type ResolverFn = (value: boolean) => void

export function useConfirm() {
  const [open,    setOpen]    = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolverRef = useRef<ResolverFn | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setOpen(true)
      resolverRef.current = resolve
    })
  }, [])

  function resolve(value: boolean) {
    setOpen(false)
    resolverRef.current?.(value)
    resolverRef.current = null
  }

  function ConfirmDialog() {
    if (!open || !options) return null

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-50 animate-fade-in"
          style={{ background: "rgba(24,20,15,.4)", backdropFilter: "blur(4px)" }}
          onClick={() => resolve(false)}
        />
        {/* Dialog */}
        <div
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-scale-in"
          style={{
            background:   "var(--s1)",
            border:       "0.5px solid var(--s3)",
            borderRadius: "var(--r-xl)",
            boxShadow:    "var(--sh-xl)",
            padding:      "28px",
            width:        "min(400px, calc(100vw - 48px))",
          }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-body"
        >
          <h2
            id="confirm-title"
            style={{
              fontFamily:   "var(--font-display)",
              fontSize:     "20px",
              color:        "var(--ink)",
              marginBottom: "10px",
            }}
          >
            {options.title}
          </h2>
          <p id="confirm-body" className="type-body" style={{ marginBottom: "24px" }}>
            {options.body}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => resolve(false)}
              className="btn btn-secondary"
            >
              {options.cancelLabel ?? "Cancel"}
            </button>
            <button
              onClick={() => resolve(true)}
              className="btn"
              style={{
                background:   options.danger ? "var(--danger)" : "var(--ink)",
                color:        "white",
                padding:      "10px 20px",
                borderRadius: "var(--r-md)",
                fontWeight:   "500",
                fontSize:     "13px",
              }}
            >
              {options.confirmLabel ?? "Confirm"}
            </button>
          </div>
        </div>
      </>
    )
  }

  return { confirm, ConfirmDialog }
}
