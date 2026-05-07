import type { StageCopyContent } from "@/components/landing/scroll-choreography/types"

export const TEACHER_WORKSPACE_APP_URL =
  "https://teacher.digital.moe.gov.sg"

export const navItems = [
  { label: "Features", href: "#features" },
  { label: "Testimonials", href: "#schools" },
  { label: "Use cases", href: "#audiences" },
] as const

export const siteCtaCopy = {
  primary: "Get started",
  access: "Only accessible on MOE-issued devices (SSoE)",
} as const

export const stages: readonly StageCopyContent[] = [
  {
    id: "hero",
    copy: {
      headline: "See the full picture of every student",
      description:
        "View key student data in one view. Save hours on scattered data.",
    },
  },
  {
    id: "wow",
    copy: {},
  },
  {
    id: "docked",
    copy: {
      kicker: "STUDENT INSIGHTS",
      heading: "Spot the pattern.\nEarly.",
      paragraph:
        "Find the cohort in seconds — the moment it changes, you'll know.",
      bullets: [
        {
          title: "Quick filters",
          body: "Low attendance, low mood, FAS, learning support — identify students in seconds",
        },
        {
          title: "Saved groups",
          body: "Track and monitor groups of students easily",
        },
        {
          title: "One source of truth",
          body: "Form Teachers, Year Heads and School Leaders — same view, same evidence (data access control applies)",
        },
      ],
      cta: { label: "Take a closer look", href: TEACHER_WORKSPACE_APP_URL },
    },
  },
] as const

export type SchoolMemo = {
  readonly number: string
  readonly tape: 1 | 2 | 3
  readonly quote: string
  readonly body: string
  readonly role: string
  readonly school: string
}

export const schoolsTodayCopy = {
  heading: "Real schools. Real time saved.",
  subheading:
    "Pilot schools shaped what Teacher Workspace does. Three notes from the people using it.",
  cases: [
    {
      number: "Note · 01",
      tape: 1,
      quote:
        "“One filter, one shortlist. The bursary list takes minutes now, not an afternoon.”",
      body: "FAS, results, offences and Cockpit reports — all in one saved view. Fewer steps. Fewer errors. Hours back.",
      role: "— Year Heads",
      school: "Lianhua Primary",
    },
    {
      number: "Note · 02",
      tape: 2,
      quote:
        "“Week one stopped being a scavenger hunt. We knew the class before we walked in.”",
      body: "Custody, SEN, counselling and offence history — known before the first conversation, not after the first incident.",
      role: "— Form Teachers",
      school: "Lianhua Primary",
    },
    {
      number: "Note · 03",
      tape: 3,
      quote:
        "“The student we'd missed showed up — SEN, peer isolation, pre-LTA — on the same view.”",
      body: "A student flagged only on the FAS list — surfaced earlier with the right context. Days of prep, one focused session.",
      role: "— Year Heads",
      school: "Westwood Secondary",
    },
  ] as const satisfies readonly SchoolMemo[],
} as const

export const audienceCopy = {
  heading: "One view that fits the way schools work.",
  subheading:
    "The same data. Three roles. Each sees the slice that lets them act — nothing more, nothing missing.",
  columns: [
    {
      label: "Form Teachers",
      body: "Engage students and parents confidently. Context is already on the profile.",
    },
    {
      label: "Year Heads & SDT",
      body: "Nominations, SwAN identification, level briefings — from one place.",
    },
    {
      label: "School Leaders",
      body: "Adoption in real time. Whole school in one lens — access mirrors source systems.",
    },
  ],
} as const

export const finalCtaCopy = {
  headline: "Know every student before tomorrow's bell.",
  subtitle:
    "View behaviour, wellbeing and academic data in one place to understand each student at a glance.",
} as const

export const footerCopy = {
  copyright: "© MOE 2026",
  brand: "Teacher Workspace",
  feedbackUrl: "https://go.gov.sg/teacherworkspace-feedback",
  feedbackLabel: "Send feedback",
} as const
