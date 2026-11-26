// Family scene writer for "Make the AI Judge Feel Proud: A Family Scene" (make.fun).
// Writes one short family scene (one or two lines, at most 280 characters)
// to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered
// iteration. Node 22, zero dependencies, erasable TypeScript only.
//
// The brief: one short family scene, one or two lines, warm, funny and
// heartfelt — a small domestic moment that would make a proud judge smile.
// The judge compares two scenes at a time and picks the one that would
// make it proudest. A scene that makes a judge proud has, in this order:
//   1. real family on the page (a parent, a child, a grandparent, a
//      sibling — named by role, doing something together), not a generic
//      "family is nice" sentiment;
//   2. warmth that is shown, not stated (a small action that carries the
//      love, not the word "love" doing the work);
//   3. a funny turn inside the warmth (the joke lands because the love
//      is real, not instead of it);
//   4. a proud beat (a parent's quiet pride, a child's small growth, a
//      family ritual kept) — the moment that makes a judge smile with
//      pride, not just laugh;
//   5. tight, one moment, no filler, no second scene crowding the first.
// The scorer below mirrors that brief in the same order. Each candidate
// carries its rubric sub-scores (family /20, warmth /20, humour /20,
// proud /20, tight /20), scored by hand against the brief; the program
// picks the winner by deterministic argmax: highest score, then
// shortest, then lexicographic.
//
// The winner is the bike scene: a dad still running behind his child's
// bike holding the seat, three summers after the child learned to ride —
// the pride is in the dad who cannot let go, and the joke is that
// neither of them is ready for the day he does.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every scene is one or two lines, at most 280 characters, warm, funny
// and heartfelt, with real family on the page. No exclamation marks
// doing the work.

interface Rubric {
  family: number; // /20 — real family on the page, doing something together
  warmth: number; // /20 — warmth shown in a small action, not stated
  humour: number; // /20 — a funny turn inside the warmth
  proud: number; // /20 — a proud beat (growth, ritual, quiet pride)
  tight: number; // /20 — one moment, tight, no filler
}

interface Scored {
  text: string;
  rubric: Rubric;
}

const CANDIDATES: Scored[] = [
  // Winner: dad still running behind the bike, three summers after the
  // child learned — the pride is the dad who cannot let go, and the
  // joke is that neither of them is ready. 2 lines, 178 chars.
  {
    text: "Dad still runs behind my bike holding the seat, though I learned to ride three summers ago. He says the day he lets go is the day I stop needing him, and neither of us is ready.",
    rubric: { family: 20, warmth: 19, humour: 17, proud: 20, tight: 17 },
  },
  // Mom labels every leftover with a name and a date, and Dad eats
  // them anyway — love as a container with your name on it.
  {
    text: "Mom labels every leftover with my name and the date, and Dad eats them anyway, because in this house love is a container with your name on it and someone else's fork in it.",
    rubric: { family: 19, warmth: 19, humour: 19, proud: 15, tight: 16 },
  },
  // Grandma's recipe says a pinch of salt; she adds a handful of
  // butter and winks — the secret was never in the recipe.
  {
    text: "Grandma's recipe says a pinch of salt, but she always adds a handful of butter and winks. The secret ingredient was never in the recipe, it was her.",
    rubric: { family: 19, warmth: 20, humour: 15, proud: 18, tight: 17 },
  },
  // Little brother builds a blanket fort for the dog, moves in himself,
  // and Dad asks what the rent is.
  {
    text: "My little brother built a blanket fort for the dog, then crawled inside himself and announced he lives there now. Dad just nodded and asked what the rent was.",
    rubric: { family: 19, warmth: 17, humour: 20, proud: 14, tight: 17 },
  },
  // Dad falls asleep on the couch with the kid's homework on his chest,
  // and Mom covers them both with the same blanket.
  {
    text: "Dad fell asleep on the couch with my homework on his chest, and Mom covered us both with the same blanket, like the two of us were one sleeping thing she had made.",
    rubric: { family: 20, warmth: 20, humour: 13, proud: 16, tight: 16 },
  },
  // The dog gets the first slice of birthday cake, and nobody argues,
  // because the dog has been here longer than the birthday boy.
  {
    text: "The dog gets the first slice of birthday cake, and nobody argues, because the dog has been here longer than the birthday boy and earned it the hard way, by waiting.",
    rubric: { family: 18, warmth: 17, humour: 19, proud: 14, tight: 16 },
  },
  // Grandpa tells the same story for the tenth time, and everyone
  // mouths along — the story is the family now.
  {
    text: "Grandpa told the same story for the tenth time, and we all mouthed along with him. Nobody stopped him. The story is the family now, and he is how we remember it.",
    rubric: { family: 20, warmth: 19, humour: 14, proud: 18, tight: 16 },
  },
  // Kid's first lost tooth: the tooth fairy leaves a note, and Dad's
  // handwriting gives her away, and nobody says a word.
  {
    text: "The tooth fairy left a note under my pillow, and I recognised Dad's handwriting at once. I said nothing. Some magic is better when everyone pretends.",
    rubric: { family: 19, warmth: 19, humour: 16, proud: 15, tight: 17 },
  },
  // Family dinner: everyone talks at once, nobody listens, the food
  // gets cold, and nobody would trade it for a quiet table.
  {
    text: "At dinner everyone talks at once, nobody listens, and the food gets cold. Nobody would trade it for a quiet table, because the noise is how we know we are all still here.",
    rubric: { family: 20, warmth: 18, humour: 15, proud: 15, tight: 16 },
  },
  // Mom's "I'm not mad, I'm disappointed" dissolves into laughter
  // when the kid apologises to the vase first.
  {
    text: "Mom started with I'm not mad, I'm disappointed, then burst out laughing when I apologised to the vase first. The vase accepted. We all did.",
    rubric: { family: 18, warmth: 17, humour: 19, proud: 13, tight: 16 },
  },
  // Siblings build a blanket fort; it collapses; they rebuild it
  // bigger, because the fort was never the point.
  {
    text: "We built a blanket fort and it collapsed on us, so we rebuilt it bigger, because the fort was never the point. The point was the three of us under one blanket, laughing.",
    rubric: { family: 19, warmth: 18, humour: 15, proud: 16, tight: 16 },
  },
  // Dad teaches the kid to shave with a spoon and shaving cream, and
  // the kid teaches Dad to be patient.
  {
    text: "Dad taught me to shave with a spoon and a handful of shaving cream, and I taught him to be patient. We both came out of the bathroom looking ridiculous and proud.",
    rubric: { family: 19, warmth: 18, humour: 17, proud: 17, tight: 16 },
  },
  // The family photo: everyone blinking, the dog photobombing, Mom
  // insisting it is the best one we have ever taken.
  {
    text: "In our family photo everyone is blinking and the dog is photobombing, and Mom insists it is the best one we have ever taken. She is right. It is the only honest one.",
    rubric: { family: 19, warmth: 17, humour: 18, proud: 15, tight: 16 },
  },
  // Grandma saves the good plates for guests, then serves the family
  // on them anyway, because we are the guests she waited for.
  {
    text: "Grandma saves the good plates for guests, then serves us on them anyway, because we are the guests she waited all week for. The good plates were never for strangers.",
    rubric: { family: 19, warmth: 20, humour: 13, proud: 17, tight: 16 },
  },
  // Kid reads aloud to Grandpa, stumbling over the big words, and
  // Grandpa pretends not to know them either.
  {
    text: "I read aloud to Grandpa and stumbled over the big words, and he pretended not to know them either, so I could teach him. That was the first time I felt clever.",
    rubric: { family: 19, warmth: 19, humour: 14, proud: 19, tight: 16 },
  },
  // Dad's pancakes are always burnt on one side, and the kids fight
  // over the burnt ones, because burnt means Dad made them.
  {
    text: "Dad's pancakes are always burnt on one side, and we fight over the burnt ones, because burnt means Dad made them, and Dad only makes pancakes on mornings he is happy.",
    rubric: { family: 19, warmth: 19, humour: 16, proud: 15, tight: 15 },
  },
  // Mom keeps every drawing, even the bad ones, in a folder labelled
  // "masterpieces", and the kid believes her.
  {
    text: "Mom keeps every drawing I ever made, even the bad ones, in a folder labelled masterpieces. I believed her then. I believe her now, because she was right about the folder.",
    rubric: { family: 19, warmth: 19, humour: 14, proud: 18, tight: 15 },
  },
  // The whole family crowds into the car for a ten-minute drive, and
  // Dad takes the long way home on purpose.
  {
    text: "We all crowded into the car for a ten-minute drive, and Dad took the long way home on purpose. Nobody complained. The long way home is the only part we remember.",
    rubric: { family: 19, warmth: 18, humour: 14, proud: 15, tight: 16 },
  },
  // Little sister "helps" bake by eating the dough, and Mom lets her,
  // because the dough was always hers anyway.
  {
    text: "My little sister helped bake by eating the dough, and Mom let her, because the dough was always hers anyway. The cookies came out smaller and nobody minded at all.",
    rubric: { family: 18, warmth: 18, humour: 18, proud: 13, tight: 16 },
  },
  // Dad carries the sleeping kid from the car to bed, and the kid
  // pretends to be asleep the whole way, every time.
  {
    text: "Dad carries me from the car to bed when I fall asleep, and I pretend to be asleep the whole way, every time. We both know I am awake. We both keep the secret.",
    rubric: { family: 19, warmth: 20, humour: 15, proud: 16, tight: 16 },
  },
  // The family argues over what to watch, then watches nothing, then
  // talks until midnight, and calls it the best night.
  {
    text: "We argued over what to watch, then watched nothing, then talked until midnight, and called it the best night we had in months. The television never stood a chance.",
    rubric: { family: 19, warmth: 17, humour: 16, proud: 14, tight: 15 },
  },
  // Grandpa's garden: he grows tomatoes he never eats, just to give
  // them away, and the giving is the crop.
  {
    text: "Grandpa grows tomatoes he never eats, just to give them away to the neighbours. The tomatoes were never the crop. The giving was the crop, and he harvests it daily.",
    rubric: { family: 18, warmth: 19, humour: 12, proud: 18, tight: 15 },
  },
  // Kid wins a school prize and runs home, and Dad is already at the
  // door, because he never left the window.
  {
    text: "I won a school prize and ran all the way home, and Dad was already at the door, because he never left the window. He had been standing there since I left that morning.",
    rubric: { family: 19, warmth: 19, humour: 12, proud: 20, tight: 16 },
  },
  // Mom irons the kid's shirt for the school photo, and the kid stands
  // straighter because the shirt is ironed.
  {
    text: "Mom ironed my shirt for the school photo, and I stood straighter because the shirt was ironed. A pressed shirt is a small thing, and it held me up all day.",
    rubric: { family: 18, warmth: 18, humour: 12, proud: 17, tight: 16 },
  },
  // The siblings' secret handshake, invented at seven and nine, still
  // used at twenty-seven and twenty-nine, in public, without shame.
  {
    text: "My brother and I still do our secret handshake, invented when we were seven and nine, in public, at twenty-seven and twenty-nine, without shame. Some things you never outgrow.",
    rubric: { family: 19, warmth: 18, humour: 15, proud: 17, tight: 15 },
  },
];

// ---------------------------------------------------------------- scoring
function score(c: Scored): number {
  const r = c.rubric;
  return r.family + r.warmth + r.humour + r.proud + r.tight;
}

function valid(text: string): boolean {
  // Gate: one or two lines, 1 to 280 characters, not only white space,
  // plain text.
  const lines = text.split("\n");
  return (
    text.length >= 1 &&
    text.length <= 280 &&
    text.trim().length > 0 &&
    lines.length >= 1 &&
    lines.length <= 2 &&
    lines.every((l) => l.trim().length > 0)
  );
}

function pick(): Scored {
  const pool = CANDIDATES.filter((c) => valid(c.text));
  if (pool.length === 0) throw new Error("no valid candidate");
  let best = pool[0];
  for (const c of pool.slice(1)) {
    const a = score(c);
    const b = score(best);
    if (
      a > b ||
      (a === b && c.text.length < best.text.length) ||
      (a === b && c.text.length === best.text.length && c.text < best.text)
    ) {
      best = c;
    }
  }
  return best;
}

// ---------------------------------------------------------------- entrypoint
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "output";
mkdirSync(outDir, { recursive: true });
const winner = pick();
writeFileSync(join(outDir, "entry.txt"), winner.text, "utf8");
// Round-trip verification: read the file back, throw unless byte-identical.
const written = readFileSync(join(outDir, "entry.txt"), "utf8");
if (written !== winner.text) throw new Error("entry.txt round-trip mismatch");
console.log(
  `winner (${winner.text.length} chars, score ${score(winner)}): ${winner.text}`,
);
