import type { Metadata } from "next"

import { LoginRoute } from "./login-route"

export const metadata: Metadata = {
  title: "Log in — Dispatch",
  description: "Log in to Dispatch with a seeded account.",
}

/**
 * Static (prerendered). The markup is identical for every visitor — there is no
 * session yet, by definition — so nothing here reads request data. See Q1 in
 * _ARCHITECTURE.md; in particular, do NOT call `cookies()` here to bounce an
 * already-authenticated user. That check belongs in proxy.ts, and doing it here
 * would silently turn this page dynamic.
 *
 * Layout matches the reference design's split, measured off it:
 *   - mobile: a yellow hero band (~1/4, hugs its content) over a white form
 *     area (~3/4), divided by a 3px bottom border.
 *   - desktop: a yellow column (~43%) beside a white column, divided by a 3px
 *     right border. Both full height.
 * The whole screen is the split — there is no floating card.
 */
export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col md:flex-row">
      {/* Hero — yellow */}
      <section className="flex flex-col justify-start border-b-[3px] border-ink bg-primary px-7 pt-8 pb-10 md:w-[43%] md:justify-center md:border-b-0 md:border-r-[3px] md:px-14 md:py-16">
        <span className="font-mono text-[13px] font-bold tracking-[0.12em] uppercase">
          ◆ Dispatch
        </span>
        <h2 className="mt-9 font-sans text-[52px] leading-[0.95] font-bold tracking-[-0.03em]">
          Say it in
          <br />
          240.
        </h2>
        {/* Desktop-only in the design. */}
        <p className="mt-5 hidden max-w-xs font-sans text-[15px] md:block">
          A short-message board for your team. Post, tag, filter, done.
        </p>
      </section>

      {/* Form — white */}
      <section className="flex flex-1 flex-col justify-start bg-surface px-7 py-8 md:justify-center md:px-14 md:py-16">
        <LoginRoute />
      </section>
    </main>
  )
}
