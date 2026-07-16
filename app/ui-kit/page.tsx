import { FeedEmpty, MessageSkeleton } from "@dmb/feed"
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  Field,
  FieldGroup,
  FieldLabel,
  Input,
  Label,
  Separator,
  Spinner,
  Textarea,
} from "@dmb/ui-kit"

import { Swatches } from "./swatches"

export const metadata = {
  title: "UI Kit — Dispatch",
  description: "Every primitive in @dmb/ui-kit, for comparison against the design.",
}

/**
 * A gallery of every primitive, so the kit can be diffed against the reference
 * design (https://y8lj2w.csb.app) in the browser. Not part of the product —
 * this route exists to make design drift visible.
 */
export default function UiKitPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase">
          ◆ Dispatch
        </span>
        <h1 className="font-sans text-5xl font-bold tracking-tight">UI Kit</h1>
        <p className="max-w-prose text-muted-foreground">
          Every primitive in <code className="font-mono">@dmb/ui-kit</code>, measured against{" "}
          <a
            className="underline decoration-2 underline-offset-2"
            href="https://y8lj2w.csb.app"
            target="_blank"
            rel="noreferrer"
          >
            the reference design
          </a>
          . Borders and shadows scale with control size — that is the design, not an accident.
        </p>
      </header>

      <Section title="Tokens">
        <Swatches />
      </Section>

      <Section title="Button — variant × size">
        <div className="flex flex-col gap-6">
          <Row label="default (accent)">
            <Button size="xs">EDIT</Button>
            <Button size="sm">LOG OUT</Button>
            <Button>POST</Button>
            <Button size="lg">LOAD MORE ↓</Button>
            <Button size="xl">LOG IN →</Button>
          </Row>
          <Row label="outline">
            <Button variant="outline" size="xs">
              EDIT
            </Button>
            <Button variant="outline" size="sm">
              LOG OUT
            </Button>
            <Button variant="outline">POST</Button>
            <Button variant="outline" size="lg">
              LOAD MORE ↓
            </Button>
          </Row>
          <Row label="ghost / destructive / disabled">
            <Button variant="ghost" size="sm">
              CLEAR
            </Button>
            <Button variant="destructive" size="xs">
              DELETE
            </Button>
            <Button disabled>DISABLED</Button>
          </Row>
          <p className="max-w-prose font-mono text-[12px] text-muted-foreground">
            Note the shadow only appears at ≥42px (POST and up). EDIT and LOG OUT are flat in
            the reference design; giving them a shadow would look more uniform and be wrong.
          </p>
        </div>
      </Section>

      <Section title="Badge — the tag chip">
        <Row label="selected / resting">
          <Badge variant="default">Product</Badge>
          <Badge variant="outline">Design</Badge>
          <Badge variant="outline">Random</Badge>
          <Badge variant="outline">Announce</Badge>
        </Row>
        <Row label="small (mobile)">
          <Badge variant="default" size="sm">
            Product
          </Badge>
          <Badge variant="outline" size="sm">
            Design
          </Badge>
          <Badge variant="muted" size="sm">
            Muted
          </Badge>
        </Row>
      </Section>

      <Section title="Avatar — square initial tile">
        <Row label="variant: accent (you) / surface (everyone else)">
          <Avatar variant="accent">
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>M</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>P</AvatarFallback>
          </Avatar>
        </Row>
        <Row label="size: sm / default / lg">
          <Avatar size="sm" variant="accent">
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar size="default" variant="accent">
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar size="lg" variant="accent">
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
        </Row>
        <p className="max-w-prose font-mono text-[12px] text-muted-foreground">
          Square, not round. Stock shadcn paints a circular ring via an ::after pseudo-element
          that <em>survives</em> `rounded-none` on the root — it had to be removed in the kit,
          not overridden at the call site.
        </p>
      </Section>

      <Section title="Inputs">
        <div className="grid gap-8 md:grid-cols-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="ada@dispatch.dev" />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" placeholder="••••••••" />
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="bad">Invalid state</FieldLabel>
              <Input id="bad" aria-invalid defaultValue="nope" />
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="from">Date (sm — filter rail)</Label>
              <Input id="from" inputSize="sm" placeholder="dd-mm-yyyy" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="msg">Composer</Label>
              <Textarea id="msg" placeholder="What's happening?" maxLength={240} />
              <span className="self-end font-mono text-[12px] text-muted-foreground">
                0/240
              </span>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Card — the raised surface">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Avatar variant="accent">
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-sans text-sm font-bold">Ada Lovelace</span>
                  <span className="font-sans text-[11px] text-muted-foreground">
                    @ada_l · 2m
                  </span>
                </div>
              </div>
              <p className="font-sans text-[15px]">
                Shipped the new filter bar — tag + date now sync to the URL so any view is
                bookmarkable.
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="default">Product</Badge>
                <div className="flex gap-2">
                  <Button variant="outline" size="xs">
                    EDIT
                  </Button>
                  <Button variant="outline" size="xs">
                    DELETE
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card elevation="flat">
            <CardContent className="flex flex-col gap-3">
              <span className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase">
                elevation=&quot;flat&quot;
              </span>
              <p className="text-muted-foreground">
                Same bordered box, no offset shadow. For cards nested inside another bordered
                container, where a shadow only adds noise.
              </p>
            </CardContent>
          </Card>
        </div>
      </Section>

      <Section title="States — loading & empty">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              MessageSkeleton — streamed by /feed while the server renders
            </span>
            <MessageSkeleton />
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
              FeedEmpty — when a filter matches nothing
            </span>
            {/* FeedEmpty is min-h-full (it fills the feed's scroll region); this
                wrapper is the "region" here, so it fills the cell minus the label
                instead of overflowing past it. */}
            <div className="flex min-h-0 flex-1 flex-col">
              <FeedEmpty />
            </div>
          </div>
        </div>
        <Row label="Spinner — inside the pending tag chip while a filter is in flight">
          <Spinner />
        </Row>
        <p className="max-w-prose font-mono text-[12px] text-muted-foreground">
          MessageSkeleton and FeedEmpty are the app&apos;s actual components, imported from{" "}
          <code className="font-mono">@dmb/feed</code>
          {" — not gallery replicas — so this page can't drift from what /feed renders."}
        </p>
      </Section>

      <Section title="Separator">
        <Separator className="bg-ink" />
      </Section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="border-b-[3px] border-ink pb-2 font-mono text-[13px] font-bold tracking-[0.16em] uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="font-mono text-[11px] tracking-[0.1em] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </div>
  )
}
