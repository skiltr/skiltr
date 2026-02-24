/js/skillbar/
├─ skillbar.js          // public API, factory
├─ skillbar.slot.js     // slot renderer + animation hooks
├─ skillbar.scheduler.js// queue + cast rules (GW logic)
├─ skillbar.modes.js    // mode definitions (simulate/edit/etc.)
└─ skillbar.utils.js    // small helpers (timing, clamps)

CREATION ROADMAP:

That *is* super sexy — and more importantly, **you’re at the exact fork where order matters**.
Good instinct to pause and ask *now* instead of halfway through.

I’ll give you a **clear recommendation**, *why* that order is correct, and a **safety checklist** so we don’t discover a missing requirement later.

---

## Short answer (authoritative)

👉 **Start building the Skillbar module now — but only the static + behavioral skeleton.**
❌ **Do NOT start drag logic yet.**

Drag should **consume** the skillbar, not define it.

---

## Why this order is correct (this is the key insight)

### Drag logic depends on:

* slot geometry
* slot identity
* skillbar API (`addSkill`, `canAccept`, `highlightSlot`, etc.)
* mode switching
* visual feedback

### Skillbar does **not** depend on drag logic.

If you start with drag:

* you’ll invent fake drop targets
* you’ll guess APIs that later feel wrong
* you’ll rework hover/accept logic
* you’ll couple drag to UI too early

If you start with skillbar:

* drag becomes trivial glue
* drag just calls `skillbar.tryInsert(skill, slot)`
* drag doesn’t care how skillbar works internally

This is classic **dependency direction** correctness.

---

## The correct phased plan (safe, incremental, no dead ends)

### ✅ Phase 1 — Skillbar core (NOW)

**Goal:**
A reusable, isolated, *non-drag* skillbar that can:

* render slots
* render skills
* handle modes
* simulate casts (scheduler + animation)
* expose a clean API

No drag. No panels. No gestures.

#### Deliverables

You should end Phase 1 with:

```js
const bar = createSkillbar({
    skills: [null, null, null, ...],
    mode: 'simulate',
    size: 'large'
});

bar.el                 // DOM root
bar.setSkill(slot, skill)
bar.clearSkill(slot)
bar.setMode('preview')
bar.destroy()
```

You can mount it anywhere and click skills to see simulation.

If this works → **everything else becomes easy**.

---

### ⛔ Phase 2 — Drag system (ONLY after Phase 1)

Now drag becomes:

* “pick up skill”
* “ask skillbar what slots are free”
* “highlight slots”
* “drop → skillbar.insertSkill()”

No guessing. No hacks.

---

### ✅ Phase 3 — Integration glue

* drag opens skillbar panel
* drag escalates to right panel
* drag drops into books/builds
* build mode toggles

At this point you’re wiring, not inventing.

---

## What exactly to build first inside Skillbar (very concrete)

### Step 1: `createSkillbar()` minimal contract

In `skillbar.js`:

* create root `.skillbar`
* create N slots
* store state
* return `{ el, api }`

No scheduler yet. No animation yet.

---

### Step 2: Slot renderer (`skillbar.slot.js`)

Each slot should:

* know its index
* know its skill (or null)
* render icon
* expose:

  * `setSkill(skill)`
  * `clear()`
  * `playCast()`
  * `playRecharge()`
  * `cancel()`

Even if some methods are stubbed initially.

---

### Step 3: Scheduler (`skillbar.scheduler.js`)

Implement:

* queue (max 3)
* eviction rule
* 0.25s delay
* sequential execution

Use console logs first if needed.

If scheduler logic works without UI → you’re golden.

---

### Step 4: Modes (`skillbar.modes.js`)

Define behavior matrix *before* coding drag:

| Mode     | Click  | Drag | Simulation |
| -------- | ------ | ---- | ---------- |
| simulate | cast   | no   | yes        |
| preview  | none   | no   | no         |
| edit     | select | yes  | no         |
| readonly | none   | no   | no         |

Even if only `simulate` exists initially.

---

## Critical reassurance: you are NOT missing anything important

You’ve already covered:

* mobile vs desktop
* drag vs scroll vs swipe
* scheduler rules
* multiple skillbars
* modes
* isolation
* reuse
* animation layering

Those are the **hard parts**.

Everything else (tooltips, polish, haptics, elite borders) are *add-ons*, not blockers.

There is **no hidden architectural bomb** left.

---

## One last sanity check (this prevents getting stuck later)

Before writing code, answer these (you already implicitly have):

1. Can a skillbar exist without drag? → **yes**
2. Can drag exist without skillbar? → **no**
3. Can multiple skillbars exist? → **yes**
4. Does skillbar assume panels? → **no**
5. Does skillbar assume globals? → **reads-only**
6. Can skillbar be tested standalone? → **yes**

✔ All green.

That means: **start building.**

---

## Final recommendation (do this next)

👉 Start with **Phase 1: Skillbar core**

* no drag
* no panel logic
* no swipe
* no tooltips

Get this working:

> “I can mount a skillbar anywhere, click skills, and see correct GW-style casting.”

Once that exists, drag becomes a *weekend task*, not a rewrite.

When you’re ready, tell me:

* “Let’s define the `createSkillbar()` API”
* or “Let’s implement the slot DOM”
* or “Let’s start with the scheduler logic”

You’re in a very strong position right now — this is the right moment to build.
