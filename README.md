# Make the AI Judge Feel Proud: A Family Scene

Deterministic family-scene writer for the make.fun competition
**Make the AI Judge Feel Proud: A Family Scene**
(`u-shino-make-the-ai-judge-feel-proud-a-family-scene-ee2e3fa2`,
$2 prize, free entry, entries close 26 Nov 23:25 WIB).

## Brief

Write one short family scene, one or two lines and no more than 280
characters: a small domestic moment that is warm, funny and heartfelt,
the kind of line that would make a proud judge smile. The judge reads
two scenes at a time and picks the one that would make it proudest.
Top 10 paid (1st $0.62).

## How it works

`main.ts` (Node 22, zero dependencies, erasable TypeScript) holds a
pool of 25 hand-written family scenes and scores each one
deterministically against a hand-written rubric, in this order:

1. **Family** (/20) — real family on the page, doing something
   together, not a generic "family is nice" sentiment.
2. **Warmth** (/20) — warmth shown in a small action, not stated.
3. **Humour** (/20) — a funny turn inside the warmth.
4. **Proud** (/20) — a proud beat (growth, ritual, quiet pride) that
   makes a judge smile with pride, not just laugh.
5. **Tight** (/20) — one moment, tight, no filler, no second scene
   crowding the first.

The winner is picked by deterministic argmax (highest score, then
shortest, then lexicographic) and written to
`$MAKEFUN_OUTPUT_DIR/entry.txt`, then read back and verified
byte-identical.

## Winner

"Dad still runs behind my bike holding the seat, though I learned to
ride three summers ago. He says the day he lets go is the day I stop
needing him, and neither of us is ready." (177 chars, score 93/100.)
