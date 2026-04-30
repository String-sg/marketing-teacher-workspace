import type { StageCopyContent } from "@/components/landing/scroll-choreography/types"

export type NavItem = {
  readonly label: string
  readonly href: string
}

/** Single source of truth for the live app destination (FOUND-06).
 *  Every external CTA in components MUST resolve through this constant. */
export const TEACHER_WORKSPACE_APP_URL =
  "https://teacherworkspace-alpha.vercel.app/students"

export const navItems: readonly NavItem[] = [
  { label: "Features", href: "#features" },
] as const

/**
 * Per-stage copy keyed by StageId. Discriminated union enforces correct
 * shape per stage at compile time (e.g., feature-a MUST have exactly 3
 * bullets — adding a fourth is a TypeScript error).
 *
 * Phase 4 (CONTENT-01..05) owns the final copy rewrite — Phase 1 ships
 * first-pass values so the static fallback renders meaningfully.
 */
export const stages: readonly StageCopyContent[] = [
  {
    id: "hero",
    copy: {
      headline: "See every student's full picture.",
      subline:
        "Grades, attendance, notes, and family conversations on one profile per student — so you walk in tomorrow already knowing what each kid needs.",
    },
  },
  {
    id: "wow",
    copy: {
      // Phase 4 (CONTENT-02) decides whether Wow gets a caption.
      // Phase 1 ships caption undefined — see RESEARCH.md § Wow stage gap analysis.
    },
  },
  {
    id: "feature-a",
    copy: {
      kicker: "A profile for every student",
      heading: "Every student, in context.",
      paragraph:
        "Open a name and see the term so far — the assignments, the missing days, the parent message you sent last Tuesday. The patterns that matter, before they become problems.",
      bullets: [
        "Grades, attendance, behavior notes, and messages home, gathered on a single page per student.",
        "Mastery curves and attendance dips surface early, so the student who's slipping doesn't slip past you.",
        "What you noticed in class, what worked last term, what the family asked for — all attached to the profile.",
      ],
    },
  },
] as const

/**
 * Proof strip copy. `subheading` is added beyond CONTEXT.md D-08's stated
 * shape because the existing proof-strip h2 has no other home (D-18).
 * Phase 4 (CONTENT-06) owns the trust-line rewrite.
 */
export const proofCopy = {
  heading: "Built around the student",
  subheading:
    "The grade, the absence, the parent message — finally on the same page.",
  points: [
    "Spot a struggling student before the next quiz",
    "Walk into class already knowing the room",
    "Hand off context cleanly when the year ends",
  ],
} as const

/**
 * Final CTA copy. `kicker` is added beyond CONTEXT.md D-08's stated shape
 * because the existing final-cta kicker has no other home (D-18).
 */
export const finalCtaCopy = {
  kicker: "Free for individual teachers",
  headline: "Know every student before tomorrow's bell.",
  body: "Join the early list for Teacher Workspace. Schools are welcome, and individual teachers can start free.",
  cta: "Start",
  emailPlaceholder: "Enter your school email",
} as const

/**
 * Footer copy per D-05 minimal footer (CONTENT-07):
 * © + single mailto + "Built with teachers" trust line.
 * Privacy and Terms are deferred (no fabricated policy stubs).
 *
 * [CONFIRM] supportEmail = "support@teacherworkspace.app" per D-19.
 */
export const footerCopy = {
  copyright: "© Teacher Workspace",
  supportEmail: "support@teacherworkspace.app",
  trustLine: "Built with teachers, for teachers",
} as const
