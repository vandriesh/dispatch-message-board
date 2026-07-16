import {
  Avatar,
  AvatarFallback,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@dmb/ui-kit";

import { getSession } from "@/app/(auth)/session";
import { logoutAction } from "@/app/(auth)/logout/actions";

/**
 * The authenticated app shell — the top bar, and the one session read that needs
 * it. It lives here rather than in the root layout on purpose: `getSession()`
 * reads `cookies()`, and a Dynamic API anywhere in a route's tree opts that whole
 * route out of static rendering. In the root layout it did that to *every* page,
 * including `/login` and `/ui-kit`, which have no per-request data at all. Scoped
 * to this group, only the routes that actually need the session pay for it.
 *
 * `(protected)` is a route group: the parens keep it out of the URL, so
 * `(protected)/feed` still serves `/feed`. The name describes the shell, not the
 * enforcement — a layout is NOT a security boundary (it doesn't re-render on
 * client navigation between siblings). The real gates stay where they are: the
 * `redirect` in `feed/page.tsx` and the session check in every `/api/messages`
 * handler.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <>
      {session && <TopBar email={session.email} />}
      {children}
    </>
  );
}

function TopBar({ email }: { email: string }) {
  const initial = email[0]?.toUpperCase() ?? "?";
  const handle = `@${email.split("@")[0]}`;

  return (
    <header className="flex h-[60px] shrink-0 items-center justify-between border-b-[3px] border-ink bg-surface px-[18px] sm:h-[72px] sm:px-8">
      <span className="font-mono text-[18px] font-bold tracking-[-0.02em] sm:text-[22px]">
        ◆ DISPATCH
      </span>

      {/* Desktop: avatar + handle + a visible LOG OUT button. */}
      <div className="hidden items-center gap-4 sm:flex">
        <div className="flex items-center gap-2.5">
          <Avatar variant="accent" size="sm">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <span className="font-sans text-[14px]">{handle}</span>
        </div>

        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            LOG OUT
          </Button>
        </form>
      </div>

      {/* Mobile: no room for the handle or a button, so the avatar *is* the menu. */}
      <div className="sm:hidden">
        <Popover>
          <PopoverTrigger
            aria-label="Account menu"
            className="rounded-none border-0 bg-transparent p-0 outline-none focus-visible:ring-3 focus-visible:ring-ink/40"
          >
            <Avatar variant="accent" size="sm">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            sideOffset={10}
            className="w-auto min-w-52 gap-0 rounded-none border-2 border-ink p-0 shadow-brutal-sm ring-0"
          >
            <p className="px-3.5 py-3 font-mono text-[12px] leading-snug">
              <span className="text-muted-foreground">Logged as:</span>
              <br />
              <span className="font-bold break-all">{email}</span>
            </p>

            <Separator />

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="w-full justify-start rounded-none"
              >
                LOG OUT
              </Button>
            </form>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
