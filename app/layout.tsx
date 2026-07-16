import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dispatch — Say it in 240.",
  description: "A short-message board for your team. Post, tag, filter, done.",
};

/**
 * The root layout — document chrome only: html/body, fonts, and the Query
 * provider. It deliberately reads **no** request data.
 *
 * That restraint is what makes static rendering possible at all. The root layout
 * wraps every route, so a single Dynamic API here (`cookies()`, `headers()`) opts
 * the *entire app* out of prerendering — which is exactly what used to happen: a
 * `getSession()` call for the top bar quietly made `/login` and `/ui-kit` dynamic
 * despite neither depending on the request. The session read now lives in
 * `(protected)/layout.tsx`, beside the top bar that needs it.
 *
 * `<Providers>` is a Client Component and that's fine — client components don't
 * force dynamic rendering; only Dynamic APIs do. A static page ships prerendered
 * HTML plus its hydration JS.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
