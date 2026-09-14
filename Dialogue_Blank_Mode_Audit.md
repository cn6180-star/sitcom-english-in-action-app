# Dialogue Blank Mode — Phase 1 Audit

## Baseline

- Branch: main
- Previous HEAD / origin/main: `8d45e8482aa2f03e21fe1f8fa902a682968c63f1`
- Matcher checkpoint: `6dfb4ff4fbc01759ec926b074ebddb8926c558dd`
- Matcher commit: `feat: harden dialogue phrase highlighting`
- Before checkpoint: existing 34 tests PASS. Working tree contained only reviewed matcher implementation, tests and audit artifacts.
- After checkpoint: working tree clean; main ahead 1 / behind 0. No push.
- Baseline coverage remains auto 874 / explicit 166 / approved exclusions 7 / unexplained zero 0 across 204 Dialogues and 1,047 links.

## Implementation

- Reused the existing Normal / Blank / Hide A / Hide B UI. No separate matcher or new offset parser.
- Blank adapter uses the existing `dialoguePhraseMatchResults` and `selectedDialogueMatches` which already drive the displayed highlight spans. DOM spans retain exactly their original text and boundaries.
- Existing transparent-text underlined blanks preserve line wrapping. Surrounding English and variable slots are not hidden. Separate ranges are not joined.
- Reveal groups by Phrase ID within the current Dialogue, so all ranges and repeated occurrences of one learning item reveal together. Enter / Space and click / tap supported.
- Show All reveals all selected spans. Reset hides all of them again. These actions do not rerender the page or change playback / recording state.
- Normal restores highlights. Blank / Normal switching updates only the practice display; it does not stop playback, replace the recording controls, or reset the recording session.
- Linked Phrase list starts collapsed on entering Blank and on Dialogue switch. Show phrases / Hide phrases buttons expose `aria-expanded` and `aria-controls`. No links are removed, including approved exclusions.
- Japanese translation state remains independent.
- Full-Dialogue TTS reads `line[1]`; per-line TTS keeps its original `data-text`. Blanked presentation is never used as speech input.
- Opening a Dialogue starts Normal. Previous / Next preserves Blank when active, but clears reveals and resets the Phrase list to collapsed.
- CSS and app cache query versions updated so existing installations receive the new display styles. About version unchanged.

## QA

Browser checks used localhost and the in-app browser. Temporary viewport override was reset and the test tab closed.

| Case | Desktop | Mobile |
| --- | --- | --- |
| d204 — What if only, variable clause remains visible | PASS | PASS |
| d1 / p10 — `is` + `on the table`, leaving `still` visible; grouped Reveal | PASS | PASS |
| d44 / p408 — only `call it first`, no cross-line composition | PASS | PASS |
| d8 / p117 — no fabricated blank; per se still in expandable Phrase list | PASS | PASS |

- Blank OFF / ON, Show All, Reset, keyboard Reveal, Phrase list collapse and Japanese toggle: PASS.
- Previous / Next: Blank preserved, reveal state reset: PASS.
- Mobile requested viewport 390 × 844; measured document width / scrollWidth both 375: no horizontal overflow.
- Play remained active when changing Normal / Blank; Stop remained functional.
- Recording reached active duration, continued through Normal / Blank switches, then stopped successfully. Recorded-audio playback entered its playing state; recording controls were closed afterward. Acoustic fidelity was not independently assessed.
- No browser console errors observed.

## Tests

- Existing: 34 PASS / 0 FAIL.
- New: `tests/dialogue-blank-mode.test.cjs` PASS.
- Total: **35 PASS / 0 FAIL**.
- New test executes the production Blank DOM adapter with a minimal DOM contract, using all 204 Dialogues' selected ranges. It verifies exact text preservation, single / multiple ranges, approved exclusions, real d44 and d204 ranges, grouped Reveal, Show All / Reset, keyboard operation, original-text TTS, and Dialogue-switch state.
- Existing full highlight coverage test still confirms 874 / 166 / 7; original 967 ranges and all original explicit override results remain protected.
- Two S2 sourceOrder tests freeze entire app.js bytes. Only their `uiBytes` expectation changed for this authorized UI edit; sourceOrder, membership, data, Dialogue and sorting assertions remain intact.
- Initial sandboxed baseline attempt could not spawn Git in one existing test (EPERM); rerunning with the required execution permission passed all 34. Final 35-test run passed with the same permission.
- `git diff --check`: PASS.

## Production integrity

- Phrase records: unchanged (3,106).
- Dialogue records: unchanged (204).
- phraseLinks: unchanged; missing-ID links 0.
- sourceOrder: unchanged.
- Matcher / hints / highlight selection: unchanged from matcher checkpoint.
- No unrelated feature or data changes.

## Changed files after matcher checkpoint

- `js/app.js` — Blank state and existing highlight-span presentation adapter.
- `css/style.css` — Blank actions and collapsed Phrase list styling.
- `index.html` — asset cache query revisions only.
- `tests/dialogue-blank-mode.test.cjs` — new regression test.
- `tests/season2-source-order-batch02.test.cjs` — app byte hash expectation only.
- `tests/season2-source-order-batch03.test.cjs` — app byte hash expectation only.
- `Dialogue_Blank_Mode_Audit.md` — this report.

## Git handoff

- Matcher checkpoint committed; HEAD remains `6dfb4ff4fbc01759ec926b074ebddb8926c558dd`.
- BlankMode changes intentionally uncommitted in working tree.
- Push: not performed.
- Local main ahead 1 / behind 0 relative to unchanged origin/main.

**Dialogue Blank Mode Phase 1 READY**
