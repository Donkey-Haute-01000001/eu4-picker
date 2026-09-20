"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

const REGIONS = [
  "Western Europe",
  "Central Europe",
  "Northern Europe",
  "Eastern Europe",
  "Southern Europe",
  "Middle East & North Africa",
  "Sub-Saharan Africa",
  "South Asia",
  "East Asia",
  "Southeast Asia",
  "Americas",
];

const AMBITIONS = [
  { value: "beginner", label: "Beginner", color: "#7fa66d" },
  { value: "intermediate", label: "Intermediate", color: "#c99a4a" },
  { value: "challenge", label: "Challenge", color: "#a1443a" },
];

const AMBITION_COLOR: Record<string, string> = Object.fromEntries(
  AMBITIONS.map((a) => [a.value, a.color])
);

const EXPANSION_TAGS = [
  { value: "tall", label: "Tall", hint: "Compact and deeply developed" },
  { value: "wide", label: "Wide", hint: "Large and sprawling" },
];

const FOCUS_TAGS = [
  { value: "military", label: "Military" },
  { value: "naval", label: "Naval" },
  { value: "trade", label: "Trade" },
  { value: "diplomatic", label: "Diplomatic" },
  { value: "colonial", label: "Colonial" },
];

const MILITARY_SUBTAGS = [
  { value: "infantry", label: "Infantry" },
  { value: "cavalry", label: "Cavalry" },
  { value: "quality", label: "Quality", hint: "Fewer, stronger troops" },
  { value: "quantity", label: "Quantity", hint: "More troops, less polish" },
];

const INPUT_STEPS = ["region", "ambition", "expansion", "focus"] as const;
type InputStep = (typeof INPUT_STEPS)[number];
type Phase = "input" | "loading" | "results" | "error";

type Result = {
  tag: string;
  name: string;
  region: string;
  key_idea: string;
  ambition: string;
  playstyle_tags: string[];
  distance: number;
};

type NationDetail = {
  tag: string;
  name: string;
  region: string;
  macro_region: string;
  starting_ruler: string;
  ruler_adm: number;
  ruler_dip: number;
  ruler_mil: number;
  national_ideas: {
    mil_score: number;
    eco_score: number;
    dip_score: number;
    key_idea: string;
  };
  ambition: string;
  playstyle_tags: string[];
};

const PANEL =
  "border border-[rgba(240,220,180,0.14)] bg-[rgba(24,20,16,0.72)] backdrop-blur-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)]";
const TEXT_WARM = "text-[#f2ead9]";
const TEXT_MUTED = "text-[#b3a890]";
const ACCENT = "#c9a568";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[13px] transition-colors ${
        active
          ? "border-[#c9a568] bg-[#c9a568] text-[#241d12] font-medium"
          : "border-[rgba(240,220,180,0.18)] bg-white/5 text-[#f2ead9] hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function HintChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  const [showHint, setShowHint] = useState(false);
  return (
    <span className="relative inline-flex items-center">
      <Chip active={active} onClick={onClick}>
        {label}
      </Chip>
      <button
        type="button"
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
        onClick={(e) => {
          e.stopPropagation();
          setShowHint((v) => !v);
        }}
        aria-label={`What does ${label} mean?`}
        className="ml-1 flex h-4 w-4 items-center justify-center rounded-full border border-[rgba(240,220,180,0.3)] text-[9px] text-[#c9a568] hover:bg-white/10"
      >
        i
      </button>
      {showHint && (
        <span className="absolute left-1/2 top-full z-30 mt-1 w-max max-w-[160px] -translate-x-1/2 rounded-md border border-[rgba(240,220,180,0.18)] bg-[rgba(20,17,13,0.95)] px-2 py-1 text-[11px] leading-snug text-[#e8dcc4] shadow-lg">
          {hint}
        </span>
      )}
    </span>
  );
}

function ProgressDots({ count, active }: { count: number; active: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full transition-colors"
          style={{
            backgroundColor: i === active ? ACCENT : "rgba(240,220,180,0.25)",
          }}
        />
      ))}
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  const [showHint, setShowHint] = useState(false);
  return (
    <div className="relative rounded-md border border-[rgba(240,220,180,0.14)] bg-white/5 p-1.5 text-center">
      {hint && (
        <button
          type="button"
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => setShowHint(false)}
          onClick={() => setShowHint((v) => !v)}
          aria-label={`What does ${label} mean?`}
          className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[rgba(240,220,180,0.3)] text-[8px] leading-none text-[#c9a568] hover:bg-white/10"
        >
          i
        </button>
      )}
      <div className={`text-[9px] uppercase tracking-wide ${TEXT_MUTED}`}>{label}</div>
      <div className={`text-base font-semibold ${TEXT_WARM}`}>{value}</div>
      {hint && showHint && (
        <span className="absolute left-1/2 top-full z-30 mt-1 w-max max-w-[140px] -translate-x-1/2 rounded-md border border-[rgba(240,220,180,0.18)] bg-[rgba(20,17,13,0.95)] px-2 py-1 text-[11px] leading-snug text-[#e8dcc4] shadow-lg">
          {hint}
        </span>
      )}
    </div>
  );
}

export function PickerWizard() {
  const [phase, setPhase] = useState<Phase>("input");
  const [inputStep, setInputStep] = useState(0);

  const [region, setRegion] = useState<string | null>(null);
  const [ambition, setAmbition] = useState<string | null>(null);
  const [tags, setTags] = useState<Set<string>>(new Set());

  const [results, setResults] = useState<Result[] | null>(null);
  const [details, setDetails] = useState<NationDetail[] | null>(null);
  const [resultIndex, setResultIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const step: InputStep = INPUT_STEPS[inputStep];

  function toggleTag(value: string) {
    setTags((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  }

  function resetAll() {
    setPhase("input");
    setInputStep(0);
    setRegion(null);
    setAmbition(null);
    setTags(new Set());
    setResults(null);
    setDetails(null);
    setResultIndex(0);
    setError(null);
  }

  function selectRegion(r: string) {
    setRegion(r);
    setTimeout(() => setInputStep(1), 200);
  }

  function selectAmbition(a: string) {
    setAmbition(a);
    setTimeout(() => setInputStep(2), 200);
  }

  function goBack() {
    if (phase === "results" || phase === "error") {
      if (phase === "results" && resultIndex > 0) {
        setResultIndex((i) => i - 1);
      } else {
        setPhase("input");
        setInputStep(3);
      }
      return;
    }
    if (inputStep > 0) setInputStep((i) => i - 1);
  }

  function goForwardResult() {
    if (results && resultIndex < results.length - 1) {
      setResultIndex((i) => i + 1);
    }
  }

  async function submit() {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch(`${API_URL}/recommend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playstyle_tags: Array.from(tags),
          macro_region: region,
          ambition,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body ? JSON.stringify(body.detail ?? body) : `Request failed (${res.status})`);
      }
      const data: Result[] = await res.json();
      const detailData: NationDetail[] = await Promise.all(
        data.map((r) => fetch(`${API_URL}/nations/${r.tag}`).then((res) => res.json()))
      );
      setResults(data);
      setDetails(detailData);
      setResultIndex(0);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPhase("error");
    }
  }

  const canGoBack = phase === "results" || phase === "error" || inputStep > 0;
  const stageKey = phase === "input" ? `input-${step}` : phase === "results" ? `result-${resultIndex}` : phase;

  return (
    <div className="relative z-10 -mt-8 flex min-h-screen items-center justify-center overflow-hidden rounded-t-3xl px-6 py-16 shadow-[0_-20px_60px_rgba(0,0,0,0.25)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/paintings/hero-8.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_68%]"
      />

      <button
        type="button"
        onClick={resetAll}
        aria-label="Start over"
        className="absolute top-4 left-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(240,220,180,0.18)] bg-[rgba(24,20,16,0.6)] text-[#c9a568] backdrop-blur-md transition-colors hover:bg-[rgba(24,20,16,0.85)]"
      >
        <RotateCcw size={14} />
      </button>

      <div className={`relative w-full max-w-sm rounded-2xl p-4 ${PANEL}`}>
        <div className="mb-3">
          <ProgressDots
            count={phase === "results" ? (results?.length ?? 5) : INPUT_STEPS.length}
            active={phase === "results" ? resultIndex : inputStep}
          />
        </div>

        <div key={stageKey} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          {phase === "input" && step === "region" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className={`text-base ${TEXT_WARM}`} style={{ fontFamily: "var(--font-cinzel)" }}>
                Where do you want your empire?
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {REGIONS.map((r) => (
                  <Chip key={r} active={region === r} onClick={() => selectRegion(r)}>
                    {r}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {phase === "input" && step === "ambition" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className={`text-base ${TEXT_WARM}`} style={{ fontFamily: "var(--font-cinzel)" }}>
                How hard a start do you want?
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {AMBITIONS.map((a) => (
                  <Chip key={a.value} active={ambition === a.value} onClick={() => selectAmbition(a.value)}>
                    {a.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {phase === "input" && step === "expansion" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className={`text-base ${TEXT_WARM}`} style={{ fontFamily: "var(--font-cinzel)" }}>
                Tall, or wide?
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {EXPANSION_TAGS.map((t) =>
                  t.hint ? (
                    <HintChip
                      key={t.value}
                      active={tags.has(t.value)}
                      onClick={() => toggleTag(t.value)}
                      label={t.label}
                      hint={t.hint}
                    />
                  ) : (
                    <Chip key={t.value} active={tags.has(t.value)} onClick={() => toggleTag(t.value)}>
                      {t.label}
                    </Chip>
                  )
                )}
              </div>
            </div>
          )}

          {phase === "input" && step === "focus" && (
            <div className="flex flex-col items-center gap-3 text-center">
              <h2 className={`text-base ${TEXT_WARM}`} style={{ fontFamily: "var(--font-cinzel)" }}>
                What&apos;s your focus?
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {FOCUS_TAGS.map((t) => (
                  <Chip key={t.value} active={tags.has(t.value)} onClick={() => toggleTag(t.value)}>
                    {t.label}
                  </Chip>
                ))}
              </div>
              {tags.has("military") && (
                <div className="flex flex-wrap justify-center gap-2 border-t border-[rgba(240,220,180,0.14)] pt-3">
                  {MILITARY_SUBTAGS.map((t) =>
                    t.hint ? (
                      <HintChip
                        key={t.value}
                        active={tags.has(t.value)}
                        onClick={() => toggleTag(t.value)}
                        label={t.label}
                        hint={t.hint}
                      />
                    ) : (
                      <Chip key={t.value} active={tags.has(t.value)} onClick={() => toggleTag(t.value)}>
                        {t.label}
                      </Chip>
                    )
                  )}
                </div>
              )}
            </div>
          )}

          {phase === "loading" && (
            <div className={`flex flex-col items-center gap-2 py-4 text-center ${TEXT_WARM}`}>
              <Loader2 className="animate-spin" style={{ color: ACCENT }} />
              <p style={{ fontFamily: "var(--font-cinzel)" }}>Consulting the council...</p>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <p className={`text-sm ${TEXT_WARM}`}>The council could not be reached.</p>
              <p className={`text-xs ${TEXT_MUTED}`}>{error}</p>
            </div>
          )}

          {phase === "results" && results && details && (
            <div className="flex flex-col gap-2.5">
              <div className="text-center">
                <h2 className={`text-lg ${TEXT_WARM}`} style={{ fontFamily: "var(--font-cinzel)" }}>
                  {details[resultIndex].name} ({details[resultIndex].tag})
                </h2>
                <p className={`text-sm ${TEXT_MUTED}`}>
                  {details[resultIndex].region} · {details[resultIndex].macro_region}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-1.5">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: AMBITION_COLOR[details[resultIndex].ambition] }}
                >
                  {details[resultIndex].ambition}
                </span>
                {details[resultIndex].playstyle_tags.map((t) => (
                  <span
                    key={t}
                    className={`rounded-full border border-[rgba(240,220,180,0.18)] px-2.5 py-0.5 text-xs ${TEXT_MUTED}`}
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                <StatTile
                  label="ADM"
                  value={details[resultIndex].ruler_adm}
                  hint="Ruler's starting admin skill (0–6)"
                />
                <StatTile
                  label="DIP"
                  value={details[resultIndex].ruler_dip}
                  hint="Ruler's starting diplomacy skill (0–6)"
                />
                <StatTile
                  label="MIL"
                  value={details[resultIndex].ruler_mil}
                  hint="Ruler's starting military skill (0–6)"
                />
              </div>
              <p className={`text-center text-xs ${TEXT_MUTED}`}>
                Starting ruler: {details[resultIndex].starting_ruler}
              </p>

              <div className="grid grid-cols-3 gap-1.5">
                <StatTile
                  label="Economy"
                  value={details[resultIndex].national_ideas.eco_score}
                  hint="National idea strength: economy (0–10)"
                />
                <StatTile
                  label="Diplomacy"
                  value={details[resultIndex].national_ideas.dip_score}
                  hint="National idea strength: diplomacy (0–10)"
                />
                <StatTile
                  label="Military"
                  value={details[resultIndex].national_ideas.mil_score}
                  hint="National idea strength: military (0–10)"
                />
              </div>
              <p className={`text-center text-xs ${TEXT_WARM}`}>
                {details[resultIndex].national_ideas.key_idea}
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goBack}
            disabled={!canGoBack}
            className={`flex items-center gap-1 text-sm transition-opacity ${
              canGoBack ? TEXT_MUTED + " hover:text-[#f2ead9]" : "text-transparent"
            }`}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          {phase === "input" && step === "expansion" && (
            <button
              type="button"
              onClick={() => setInputStep(3)}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-[#241d12]"
              style={{ backgroundColor: ACCENT }}
            >
              Continue
            </button>
          )}

          {phase === "input" && step === "focus" && (
            <button
              type="button"
              onClick={submit}
              disabled={tags.size === 0}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-[#241d12] disabled:opacity-40"
              style={{ backgroundColor: ACCENT }}
            >
              Reveal my nations
            </button>
          )}

          {phase === "error" && (
            <button
              type="button"
              onClick={submit}
              className="rounded-full px-4 py-1.5 text-sm font-medium text-[#241d12]"
              style={{ backgroundColor: ACCENT }}
            >
              Try again
            </button>
          )}

          {phase === "results" && results && resultIndex < results.length - 1 && (
            <button
              type="button"
              onClick={goForwardResult}
              className="flex items-center gap-1 text-sm font-medium"
              style={{ color: ACCENT }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
