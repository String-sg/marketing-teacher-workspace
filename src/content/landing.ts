import type { StageCopyContent } from "@/components/landing/scroll-choreography/types"

export const TEACHER_WORKSPACE_APP_URL =
  "https://teacherworkspace-alpha.vercel.app/students"

export const navItems = [
  { label: "Features", href: "#features" },
] as const

export const siteCtaCopy = {
  primary: "Get started",
} as const

export const stages: readonly StageCopyContent[] = [
  {
    id: "hero",
    copy: {
      headline: "Every student's full picture. One View.",
      subline:
        "Attendance, grades, conduct, counselling, SEN, FAS, family — in one picture. So your day starts with context, not a scavenger hunt.",
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
      heading: "Spot the pattern. Early.",
      paragraph:
        "Find the cohort in seconds. Save it once. Know the moment it changes.",
      bullets: [
        {
          title: "Quick filters.",
          body: "FAS, SEN, low attendance, peer isolation, pre-LTA. Name it. See it.",
        },
        {
          title: "Saved groups.",
          body: "Define a cohort. Instantly review it anytime.",
        },
        {
          title: "One source of truth.",
          body: "Form Teachers, Year Heads and School Leaders — same view, same evidence. (Data access control applies.)",
        },
      ],
      cta: { label: "Take a closer look", href: TEACHER_WORKSPACE_APP_URL },
    },
  },
] as const

export const schoolsTodayCopy = {
  kicker: "IN SCHOOLS TODAY",
  heading: "Real schools. Real time saved.",
  subheading:
    "Pilot schools shaped what Teacher Workspace does. Here's what changed.",
  cases: [
    {
      number: "01",
      title: "Bursary nominations. In one filter.",
      source: "Lianhua Primary. Year Heads.",
      body: "What used to mean toggling between FAS, academic results, offences and Cockpit reports became one filter, one shortlist. Fewer steps. Fewer errors. Hours back.",
    },
    {
      number: "02",
      title: "New Form Teachers. Day-one fluent.",
      source: "Lianhua Primary. Form Teachers.",
      body: "Custody, SEN, counselling and offence history — known before the first conversation. Week-one shifted from “where do I find this?” to “how do I engage this student?”",
    },
    {
      number: "03",
      title: "SwANs. Surfaced earlier.",
      source: "Westwood Secondary. Year Heads.",
      body: "A student flagged only on the FAS list — surfaced in the same view with SEN needs, peer isolation and pre-LTA signals. Days of prep, one focused session.",
    },
  ],
} as const

export const audienceCopy = {
  kicker: "BUILT FOR THE WAY SCHOOLS WORK",
  heading: "Built for the way schools work.",
  columns: [
    {
      label: "Form Teachers.",
      body: "Walk in fluent in your class. The context is already on the profile.",
    },
    {
      label: "Year Heads & SDT.",
      body: "Nominations, SwAN identification, level briefings — from one place.",
    },
    {
      label: "School Leaders.",
      body: "Adoption in real time. The whole school in one lens. Access mirrors source systems (e.g. School Cockpit, AllEars). Nothing new exposed.",
    },
  ],
} as const

export const finalCtaCopy = {
  kicker: "Free for individual teachers",
  headline: "Know every student before tomorrow's bell.",
} as const

export const footerCopy = {
  copyright: "© Teacher Workspace",
  feedbackUrl: "https://go.gov.sg/teacherworkspace-feedback",
  feedbackLabel: "Send feedback",
  trustLine: "Built with teachers. For every educator.",
} as const
