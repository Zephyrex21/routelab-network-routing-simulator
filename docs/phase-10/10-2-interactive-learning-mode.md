# Phase 10.2 — Interactive Learning Mode

## Purpose

Add an active-recall layer to Simulation Studio. Instead of only reading what happened, learners predict the next decision made by the selected routing algorithm before revealing that event in the playback timeline.

## Learner flow

1. Generate a Distance Vector or Link State simulation.
2. Pause at the current playback event and start Practice Mode.
3. Read a question derived from the next unseen decision-bearing event.
4. Select one of three answer options and submit it.
5. Review correctness, the reasoning behind the answer and a key takeaway.
6. Reveal the recorded event and continue to the next challenge.

The question does not reveal the target event's label or explanation before submission. The event is revealed only after the learner commits an answer.

## Challenge coverage

- Distance Vector neighbour-vector advertisements and candidate route calculation.
- Route-cost improvements and deterministic equal-cost tie-breaking.
- Stable update rounds and convergence.
- Link State duplicate LSA suppression and the transition from flooding to Dijkstra.
- Dijkstra source initialization, vertex settling and edge relaxation.
- Already-settled and non-improving candidate checks.

Challenges are derived from the existing immutable simulation event stream. The algorithm engine, routing costs, generated events, final tables and run contracts are unchanged. Unknown or non-decision events are skipped until a supported checkpoint is found.

## Interaction and accessibility

- Choice buttons expose their selected state through `aria-pressed`.
- Feedback is announced through a status region after explicit submission.
- The learner can reveal the event and continue only after submitting an answer.
- Practice pauses playback when opened and does not hijack native button interactions.
- Layout adapts to narrow viewports and honours reduced-motion preferences.

## Validation

The Node model tests exercise both algorithms' challenge generation and end-of-run behavior. The browser smoke suite runs the full selection → submit → feedback → reveal path in Chromium using the isolated QA topology fixture.

Run the complete pipeline with:

```bash
npm run check:release
```

## Scope

This phase adds one-step prediction practice. Persistent scores, adaptive difficulty, saved progress and experiment history are intentionally deferred to later learning phases.
