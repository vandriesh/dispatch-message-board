<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

## Record every prompt in _AI_DIALOG.md

Append each user prompt to `_AI_DIALOG.md` verbatim, in order, separated by `---`.

The file contains **only the user's messages** — no outcomes, summaries, commentary, or
invented section titles. What came of a prompt belongs in the artifacts it produced
(`_ARCHITECTURE.md`, `_REQUIREMENTS.md`, the code), not here.

**Exception:** if the prompt starts with `skip:`, do not record it. That prefix keeps
incidental back-and-forth out of the history so the log stays signal rather than noise.

## Surface every architecture decision

Architecture decisions and their reasoning live in `_ARCHITECTURE.md` as ADRs — the challenge
brief explicitly allows this file. `README.md` carries a summary of those decisions in its
"Architecture at a glance" section and links out to the detail. When a decision is made or
changed, update both: the ADR in full, the README bullet in brief.

## Requirements tracking

`_REQUIREMENTS.md` holds the brief as tracked requirements (F/N/D/B/Q ids) with status.
Update the status column as work lands, and record open questions there rather than making
silent assumptions.
