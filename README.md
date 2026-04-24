# Marketing Teacher Workspace

A private TanStack Start landing page project for Marketing Teacher.

## Stack

- TanStack Start + React
- TypeScript
- Tailwind CSS v4
- shadcn/ui with Radix primitives
- Radix Colors for theme tokens
- Motion for the scroll-linked hero sequence

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
```

The local app runs at `http://127.0.0.1:3000/` by default.

## Project Shape

- `src/routes/index.tsx` composes the landing page.
- `src/components/landing/` contains the cinematic hero and page sections.
- `src/content/landing.ts` holds the editable landing copy.
- `src/styles.css` contains Tailwind, shadcn tokens, Radix color mapping, and the original hero scene styling.

The hero scene is built from original CSS/DOM visual layers and product UI panels. The Mercury screenshots in the plan are reference material for pacing and composition only.
