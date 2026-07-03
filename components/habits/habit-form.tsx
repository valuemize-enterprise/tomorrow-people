"use client"

import { useState, useRef, useEffect } from "react"
import { useCreateHabit } from "@/hooks/use-habits"
import { Button } from "@/components/ui/button"

const STEPS = ["name", "anchor", "minVersion", "enrich"] as const
type Step = (typeof STEPS)[number]

const STEP_COPY: Record<Step, { q: string; hint: string; placeholder: string }> = {
  name: {
    q:           "What do you want to do?",
    hint:        "One simple action.",
    placeholder: "Read, exercise, journal…",
  },
  anchor: {
    q:           "What do you already do every morning?",
    hint:        "We'll attach the new habit right after it.",
    placeholder: "Make coffee, brush teeth, open laptop…",
  },
  minVersion: {
    q:           "What's the smallest version of this?",
    hint:        "On hard days, this is enough to keep the streak alive.",
    placeholder: "",
  },
  enrich: {
    q:           "Make it feel good",
    hint:        "Optional — but these details compound over time.",
    placeholder: "",
  },
}

export function HabitForm({
  anchors = [],
  onComplete,
}: {
  anchors?: string[]
  onComplete: () => void
}) {
  const [step, setStep] = useState<Step>("name")
  const [form, setForm] = useState({
    name: "", anchorHabit: "", minVersion: "",
    attractiveLink: "", cueDescription: "", rewardDescription: "",
  })

  const { createHabit, submitting, errors } = useCreateHabit(onComplete)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when step changes
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [step])

  const idx          = STEPS.indexOf(step)
  const autoMinVer   = form.name ? `${form.name.trim()} for just 2 minutes` : ""
  const copy         = STEP_COPY[step]
  const progress     = ((idx + 1) / STEPS.length) * 100

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  const next = () => { if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]) }
  const prev = () => { if (idx > 0) setStep(STEPS[idx - 1]) }

  const canAdvance =
    (step === "name"   && form.name.trim().length >= 2) ||
    (step === "anchor" && form.anchorHabit.trim().length >= 2) ||
    step === "minVersion" ||
    step === "enrich"

  async function submit() {
    await createHabit({
      name:              form.name,
      anchorHabit:       form.anchorHabit,
      minVersion:        form.minVersion || autoMinVer,
      attractiveLink:    form.attractiveLink  || undefined,
      cueDescription:    form.cueDescription  || undefined,
      rewardDescription: form.rewardDescription || undefined,
    })
  }

  return (
    <div>
      {/* ── Progress bar ────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="progress-track">
          <div
            className="progress-fill progress-fill-accent"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="type-label mt-2" style={{ color: "var(--a)" }}>
          Step {idx + 1} of {STEPS.length}
        </p>
      </div>

      {/* ── Step content ─────────────────────────────────────────── */}
      <div className="animate-fade-up" key={step}>
        {/* Question headline */}
        <h2
          className="mb-1.5 leading-[1.2]"
          style={{
            fontFamily: "var(--font-display)",
            fontSize:   "20px",
            color:      "var(--i1)",
          }}
        >
          {copy.q}
        </h2>
        <p className="type-small mb-5">{copy.hint}</p>

        {/* ── Step: Name ──────────────────────────────────────── */}
        {step === "name" && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canAdvance && next()}
              placeholder={copy.placeholder}
              className="input"
            />
            {errors.name && <FieldError msg={errors.name[0]} />}
          </>
        )}

        {/* ── Step: Anchor ─────────────────────────────────── */}
        {step === "anchor" && (
          <>
            {anchors.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {anchors.map((a) => (
                  <button
                    key={a}
                    onClick={() => set("anchorHabit", a)}
                    className="text-[12px] px-3 py-1.5 transition-all duration-150"
                    style={{
                      borderRadius: "var(--r-sm)",
                      border: `1px solid ${form.anchorHabit === a ? "var(--i1)" : "var(--s3)"}`,
                      background: form.anchorHabit === a ? "var(--i1)" : "var(--s2)",
                      color:   form.anchorHabit === a ? "var(--iv)" : "var(--i2)",
                      fontWeight: form.anchorHabit === a ? "500" : "400",
                    }}
                  >
                    {a}
                  </button>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              value={form.anchorHabit}
              onChange={(e) => set("anchorHabit", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canAdvance && next()}
              placeholder={copy.placeholder}
              className="input"
            />
            {errors.anchorHabit && <FieldError msg={errors.anchorHabit[0]} />}
          </>
        )}

        {/* ── Step: Min version ────────────────────────────── */}
        {step === "minVersion" && (
          <>
            <input
              ref={inputRef}
              type="text"
              value={form.minVersion || autoMinVer}
              onChange={(e) => set("minVersion", e.target.value)}
              className="input"
            />
            <p className="type-small mt-2">
              Pre-filled based on your habit name. Edit freely.
            </p>
          </>
        )}

        {/* ── Step: Enrich ────────────────────────────────── */}
        {step === "enrich" && (
          <div className="space-y-3">
            <EnrichRow
              label="What will make it enjoyable?"
              placeholder="e.g. My favourite playlist on"
              value={form.attractiveLink}
              onChange={(v) => set("attractiveLink", v)}
            />
            <EnrichRow
              label="How will you make the cue visible tonight?"
              placeholder="e.g. Leave the book open on my desk"
              value={form.cueDescription}
              onChange={(v) => set("cueDescription", v)}
            />
            <EnrichRow
              label="What's your small reward after?"
              placeholder="e.g. One episode of a show"
              value={form.rewardDescription}
              onChange={(v) => set("rewardDescription", v)}
            />
          </div>
        )}
      </div>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <div className="flex gap-2 mt-6">
        {idx > 0 && (
          <Button variant="ghost" size="sm" onClick={prev} className="px-4">
            ← Back
          </Button>
        )}

        {idx < STEPS.length - 1 ? (
          <Button
            variant="primary"
            fullWidth
            onClick={next}
            disabled={!canAdvance}
            className="flex-1"
          >
            Continue
          </Button>
        ) : (
          <Button
            variant="primary"
            fullWidth
            onClick={submit}
            loading={submitting}
            className="flex-1"
          >
            Add to my stack ✓
          </Button>
        )}
      </div>
    </div>
  )
}

function EnrichRow({
  label, placeholder, value, onChange,
}: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="type-label block mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
        style={{ fontSize: "13px", padding: "9px 13px" }}
      />
    </div>
  )
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p className="text-[12px] mt-1.5" style={{ color: "var(--danger)" }}>
      {msg}
    </p>
  )
}
