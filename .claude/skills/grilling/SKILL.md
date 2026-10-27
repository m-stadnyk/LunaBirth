---
name: grilling
description: Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.
---

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

### Asking a round (LunaBirth customisation)

The user often answers from the Claude mobile app, so ask each round with the **AskUserQuestion** tool (tappable multiple choice) instead of a wall of text:

- **One question per frontier decision**, max 4 per call. A frontier bigger than 4 → several calls in the same round, highest-impact decisions first.
- **`question`**: the full question, ending with `?`. Keep it short enough to read on a phone; put longer context in the options' `description`s.
- **`header`**: `Q1`, `Q2`, … plus a 1–2 word topic, ≤12 chars (e.g. `Q3 Storage`), so answers map back to the design tree.
- **`options`**: 2–4 genuinely distinct choices. Put your recommended answer **first** with ` (Recommended)` appended to its label. Labels 1–5 words; each `description` says what picking it means or costs. Don't add an "Other" option: the tool adds a free-text one.
- **`multiSelect: true`** only when choices aren't mutually exclusive (e.g. "which of these edge cases must we handle?").
- **`preview`** (optional): use it when comparing concrete artefacts (a code shape, a UI mock, a data model) side by side.
- A decision that can't be reduced to 2–4 choices (open naming, free-form definitions) → still ask it through the tool with your best proposals as options and rely on "Other", or fall back to the markdown format below for that question only.

After the answers come back, give a one-line recap of what got settled, then recompute the frontier.

If AskUserQuestion isn't available, or a call is denied, fall back to the markdown format below.

Fallback markdown format for a round:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Word each question so "yes" accepts your recommended answer.

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
