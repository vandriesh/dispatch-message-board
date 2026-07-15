# AI Dialog

Prompt used to build this project.

---

every prompt should be recorded under AI_DIALOG.md
every architecture decision should be mentioned under README.md

Maybe we can have an ARCHITECTURE.md file.

---

I need to pick few concepts from /react-gradual-architecture
and add it to the local CLAUDE.md under #Architecture

* the app will be modular (by feature) - with structure describe in the react-gradual-architecture
* all that's related to next.js should follow next.js conventions - naming/placement
* the rest - the actual code : components describing the "domain" the service itself should leave under feature packages
* keep code together (interfaces where the data is born)
* no premature code splitting (keep it together if it fits 200 lines)

---

resuming logging

---

I want to create a UI kit package.
this one will have basic / atoms (Inputs, Buttons, ... etc)

I think it's good idea to add on board shadcn, update the default theme with css design tokens

add the skill

```
npx skills add shadcn/ui
```

than check how to add shadcn to nextjs app

than analyze the Browser for which Atomic components we will need - inputs, buttons, checkboces, date  pickers ,etc

all these "primitives" should be created under packages/ui-kit/src/component

make sure it has index.ts exporting all these components and
a package.json describing this package/feature
plus, update tsconfig to have alias

the org would be dmb (dispatch-message-board

```ts
import { Button } from '@dmb/ui-kit';
```

you can create /ui-kit route to have all the components from the ui-ki exposed/listed to compare it using the browser (size/margin/padding/colors/"brutal" shadow effect/ etc)

---

I think Avatar should need some fixes. compare with the original element.

---

commit using commitlint convention

---

now let's build the routes (will wire to backend separately)
for now I need you to constructs the forms (login)
unde new package auth (imported by "@dmn/auth")

a good separation would be to keep what depends on nextjs (imports from nextjs) under app dir, the rest form itself , zod validation schema, the form in the package feature

this one login could be very good example to add a test that covers auth

it uses msw v2 lib to mock server response (gooduser@... ) get's redirect to protect resources and sees "Welcome gooduser@....dev)
and vilanuser@....dev gets Incorect user or password error message

the response depends on user's email

That's the way I was using to test on other than next js aps - is this method/way is appropriate for nextjs app?

---

note how login mobile page is split in 1/4 yellow bg with title and logo + 3/4 of white bg with the login form vs responsive implementation we have

