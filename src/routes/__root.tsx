import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import appCss from "../styles.css?url"
import { SkipLink } from "@/components/landing/skip-link"
import { lazy, Suspense } from 'react'

const DirectEdit = lazy(() =>
  import('made-refine').then((m) => ({ default: m.DirectEdit }))
)

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Teacher Workspace. Every student. One View.",
      },
      {
        name: "description",
        content:
          "The whole child on a single profile. Built with educators, for educators.",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  notFoundComponent: () => (
    <main className="container mx-auto p-4 pt-16">
      <h1>404</h1>
      <p>The requested page could not be found.</p>
    </main>
  ),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <SkipLink />
        {children}
        <Scripts />
        {import.meta.env.DEV && typeof window !== 'undefined' && (
          <Suspense>
            <DirectEdit />
          </Suspense>
        )}
      </body>
    </html>
  )
}
