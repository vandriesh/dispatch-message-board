# @dmb/ui-kit

The Dispatch design system: the primitives (atoms) every feature builds from.

```ts
import { Button, Input, Badge, Card } from "@dmb/ui-kit";
```

Browse them all at **`/ui-kit`** in the running app — the gallery renders every primitive so
it can be compared against [the reference design](https://y8lj2w.csb.app) in the browser.

## What belongs here

**Primitives only.** Nothing in this package knows what a Message, a Tag, or a User is.

That's not a style preference — it's the reason this is a package rather than a folder. The
kit has no dependency on `features/`, so the module graph makes a domain-aware primitive
*impossible* rather than merely discouraged. A `MessageCard` is domain code: it lives in
`features/messages/` and *uses* `Card` and `Badge` from here.

## The system

Measured off the reference design with `getComputedStyle` — not read off its prose, which
claims a uniform 3px border and 6px shadow that the rendered CSS doesn't actually use.

| | |
|---|---|
| **Radius** | `0`. Everywhere. No exceptions. |
| **Border** | Scales with the control: `2px` → `2.5px` → `3px`. |
| **Shadow** | Solid offset, no blur. `shadow-brutal-{xs,sm,md,lg,xl}` = 2/3/4/5/6px. |
| **Colour** | `ink #111`, `page #E4E4DE`, `surface #fff`, `primary #FFE600`, `muted #57574F`. |
| **Type** | Space Grotesk for prose; Space Mono for anything control-like — buttons, labels, tags, timestamps. |

Two rules are easy to "tidy up" into being wrong:

1. **Shadows only appear at ≥42px.** `EDIT`, `DELETE`, and `LOG OUT` are flat. Adding a shadow
   to `size="sm"` would look more consistent and would not match the design.
2. **Border width tracks height.** 2px at 34px tall, 2.5px at 40px, 3px at 42px and above.

`Button` encodes this: **geometry on `size`, colour on `variant`.**

## Adding a primitive

Run the CLI **from this directory** — the package has its own `components.json`, and shadcn
refuses to write from the repo root once it detects the workspace.

```bash
cd packages/ui-kit
npx shadcn@latest add <component>
```

Then: restyle it to the tokens above (the generated defaults are rounded and soft-shadowed —
the opposite of this system), and export it from `src/index.ts`.

## Notes

- Built on **Base UI** (`@base-ui/react`), not Radix — shadcn's current default. Custom
  triggers use the **`render` prop, not `asChild`**.
- No build step. The package ships TypeScript source; Next compiles it via
  `transpilePackages`. Tailwind is pointed here by `@source "../packages/ui-kit/src"` in
  `app/globals.css` — without that, classes used only in this package are silently dropped.
- `Calendar` pulls in `react-day-picker` + `date-fns`, by far the heaviest thing in the kit.
  Import it dynamically at the call site.
