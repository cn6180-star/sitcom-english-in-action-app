# Friends S2 Dialogue 17 — Compatibility Final Audit

## Baseline

- Branch: main
- HEAD: `62891c7f85282e513e3d0234999dd43f57ca3506` — feat: add dialogue blank mode
- Previous local commit preserved: `6dfb4ff4fbc01759ec926b074ebddb8926c558dd` — feat: harden dialogue phrase highlighting
- origin/main: `8d45e8482aa2f03e21fe1f8fa902a682968c63f1`
- Ahead / behind: 2 / 0. Started clean; 35 test files, 35 PASS / 0 FAIL.
- Phrase 3,106; Dialogue 204; phraseLinks 1,047; approved exclusions 7; unexplained zero 0.
- Source: `C:/Users/akin6/Downloads/Friends_S2_Dialogue_17_Draft_Package.json`
- Source SHA-256 before and after: `25e3cc29ddf5b679f32396deb61c663fa5505c09a4a5e180f7642f10b3efc683`
- Cloud's older 33-test checkout is not the PC baseline. The supplied final ChatMochi decisions govern compatibility; no new semantic decisions were made.

## Four reviewed cases

Offsets below are zero-based half-open offsets within the unchanged source line.

| Case | PC before | Decision / implementation | PC after |
| --- | --- | --- | --- |
| S2-SEED-002 / p1485, turn 4 | matcher: [21,36) `I'm allergic to` | Already compatible. No be/contraction/slot rule change; Cloud-only difference. | Same fixed range; `peanuts` remains visible. |
| S2-SEED-001 / p1700, turn 2 | matcher: [0,17) `We're sold out of` | Already compatible. No be/contraction/slot rule change; Cloud-only difference. | Same fixed range; `the small ones` remains visible. |
| d57 / p199, turn 6 | matcher: [33,40) `clobber` | Reproduced. Legacy literal regex wins before inflection regex. Added dictionary-backed full-word boundary validation/expansion to the existing path, with clobber/clobbers/clobbered/clobbering. | matcher: [33,42) `clobbered`; no exposed `ed`. |
| S2-SEED-004 / p2229, turn 6 | no range | Draft-identity explicit forced override. No determiner/possessive generalization. | explicit-highlight: [13,36) `pass along your message`. |

The override is keyed only to `S2-SEED-004|p2229`, at lineIndex 5. When production IDs are assigned in the later production task, this key must be explicitly migrated to the assigned ID. No ID is guessed here.

## 45 Phrase compatibility

- Drafts: 17; finalPhraseLinks / realized Phrase occurrences: 45.
- AUTO_COMPATIBLE: 42.
- EXISTING_OVERRIDE_COMPATIBLE: 2.
- NEW_EXPLICIT_OVERRIDE_COMPATIBLE: 1.
- Unresolved / incompatible: 0.
- All 45 retain selected display ranges on the intended turns.
- Test fixture English lines and finalPhraseLinks exactly match the supplied package.
- Original package was not overwritten or relabeled. This audit is the READY promotion evidence; naturalness, overlap, removed Phrase decisions and text remain untouched.

| Draft | Phrase | Compatibility | Selected ranges |
| --- | --- | --- | --- |
| S2-SEED-010 | p1810 | AUTO_COMPATIBLE | L2 [2,20) `have a reservation` |
| S2-SEED-010 | p1478 | AUTO_COMPATIBLE | L1 [4,26) `What can I do for you?` |
| S2-SEED-002 | p1485 | AUTO_COMPATIBLE | L4 [21,36) `I'm allergic to` |
| S2-SEED-002 | p2113 | AUTO_COMPATIBLE | L1 [0,15) `Have you eaten?` |
| S2-SEED-002 | p2114 | AUTO_COMPATIBLE | L3 [54,63) `leftovers` |
| S2-SEED-003 | p1886 | AUTO_COMPATIBLE | L1 [0,23) `It would really help if` |
| S2-SEED-003 | p1669 | AUTO_COMPATIBLE | L1 [34,53) `turn the music down` |
| S2-SEED-003 | p1522 | AUTO_COMPATIBLE | L3 [0,10) `I hear you` |
| S2-SEED-004 | p1832 | AUTO_COMPATIBLE | L2 [25,46) `Can I take a message?` |
| S2-SEED-004 | p2229 | NEW_EXPLICIT_OVERRIDE_COMPATIBLE | L6 [13,36) `pass along your message` |
| S2-SEED-001 | p1907 | AUTO_COMPATIBLE | L1 [0,15) `I'm looking for` |
| S2-SEED-001 | p1462 | AUTO_COMPATIBLE | L3 [7,39) `Do you have any black ones left?` |
| S2-SEED-001 | p1700 | AUTO_COMPATIBLE | L2 [0,17) `We're sold out of` |
| S2-SEED-006 | p2154 | AUTO_COMPATIBLE | L1 [32,51) `Can I have it back?` |
| S2-SEED-006 | p1976 | AUTO_COMPATIBLE | L4 [35,45) `All yours.` |
| S2-SEED-005 | p1974 | AUTO_COMPATIBLE | L3 [0,17) `I'm not done yet.` |
| S2-SEED-007 | p1454 | AUTO_COMPATIBLE | L2 [5,21) `too soon to tell` |
| S2-SEED-007 | p1510 | AUTO_COMPATIBLE | L6 [15,31) `see what happens` |
| S2-SEED-008 | p2150 | AUTO_COMPATIBLE | L3 [0,17) `Speaking of which` |
| S2-SEED-009 | p2033 | AUTO_COMPATIBLE | L3 [0,31) `That sounded better in my head.` |
| d18 | p233 | AUTO_COMPATIBLE | L2 [0,24) `Let me get this straight` |
| d18 | p152 | AUTO_COMPATIBLE | L8 [0,9) `Cha-ching` |
| d19 | p209 | AUTO_COMPATIBLE | L2 [0,16) `Tell me about it` |
| d21 | p176 | AUTO_COMPATIBLE | L1 [2,20) `fell off the wagon` |
| d21 | p174 | AUTO_COMPATIBLE | L5 [12,36) `keep the cravings at bay` |
| d11 | p146 | AUTO_COMPATIBLE | L1 [30,43) `in a nutshell` |
| d11 | p149 | AUTO_COMPATIBLE | L2 [65,72) `pay off` |
| d11 | p155 | AUTO_COMPATIBLE | L3 [17,37) `get the ball rolling` |
| d11 | p234 | AUTO_COMPATIBLE | L4 [44,60) `on the same page` |
| d11 | p194 | AUTO_COMPATIBLE | L6 [0,9) `Your call` |
| d11 | p251 | AUTO_COMPATIBLE | L7 [61,74) `drop the ball` |
| d11 | p232 | AUTO_COMPATIBLE | L9 [0,8) `Kudos on` |
| d14 | p190 | AUTO_COMPATIBLE | L2 [10,19) `tag along` |
| d14 | p150 | AUTO_COMPATIBLE | L3 [37,42) `steep` |
| d14 | p177 | AUTO_COMPATIBLE | L4 [13,25) `worth a shot` |
| d14 | p38 | AUTO_COMPATIBLE | L5 [9,25) `make a day of it` |
| d14 | p226 | AUTO_COMPATIBLE | L6 [30,49) `once in a blue moon` |
| d15 | p192 | EXISTING_OVERRIDE_COMPATIBLE | L1 [4,30) `getting a lot of heat from` |
| d15 | p188 | AUTO_COMPATIBLE | L3 [35,43) `shoulder` |
| d15 | p210 | AUTO_COMPATIBLE | L4 [41,63) `leave you high and dry` |
| d15 | p235 | AUTO_COMPATIBLE | L6 [10,26) `in the same boat` |
| d15 | p189 | EXISTING_OVERRIDE_COMPATIBLE | L7 [36,49) `sold them out` |
| d57 | p142 | AUTO_COMPATIBLE | L2 [12,23) `psyched out` |
| d57 | p199 | AUTO_COMPATIBLE | L6 [33,42) `clobbered` |
| d57 | p147 | AUTO_COMPATIBLE | L7 [36,57) `catches you off guard` |

## BlankMode

- Uses existing production highlight selection and existing Blank adapter; no independent matcher or Blank logic.
- All 45 selected ranges have valid offsets and no trailing partial-word blank.
- All four cases tested in the browser using the read-only test preview and actual production matcher / highlight / Blank functions.
- p1485 and p1700: only fixed anchors hidden, variable complements visible.
- p199: `clobbered` fully hidden; following text starts ` in the Q&A.`.
- p2229: `pass along your message` fully hidden; following clause visible.
- Reveal works. No browser console errors observed.
- This is fixture-based visual QA, not installation of the Drafts into production. No Japanese translation was created or changed.

## Regression / integrity

- Production 204 Dialogues / 1,047 links: auto 874 / explicit 166 / approved excluded 7 / unexplained zero 0.
- Only intentional production range change: d57/p199 end 40 → 42, clobber → clobbered.
- Other 1,046 link results unchanged; all existing 185 hint definitions unchanged.
- Original 967-range hash protection remains, with one explicit assertion for the approved full-token correction; the other 966 results remain frozen.
- Existing explicit rendered range protection remains unchanged.
- Negative regressions cover wrong generated forms, substring/word-family matching, sentence-crossing slots, unrelated determiner replacements and draft override leakage.
- Existing past-tense legacy matches may include their demonstrated object; that precedence is unchanged. The common template itself returns fixed anchors. No new object-consuming behavior was introduced.
- Required source fields, membership, Phrase/Dialogue content and sourceOrder protections remain intact.

## Tests

- Existing 35 + new `dialogue-draft-compatibility.test.cjs`.
- **36 PASS / 0 FAIL**.
- `git diff --check`: PASS.
- Two S2 tests updated only their full-app byte hash expectation for the authorized matcher-call change. All data / ordering / membership assertions retained.
- Coverage test updated the explicit d57 token expectation and exact total hint count (185 → 186); existing hint hashes remain protected.
- No dependency added.

## Production integrity

- Phrase data unchanged.
- Dialogue data unchanged.
- phraseLinks unchanged.
- sourceOrder unchanged.
- All 17 Draft English bodies and original package bytes unchanged.
- Japanese translations unchanged.
- BlankMode UI specification and implementation unchanged.
- No production Dialogue additions.

## Files / Git

- `js/dialogue-highlight-matcher.js`
- `js/app.js` — legacy matcher delegates full-word range validation; no UI changes.
- `js/dialogue-match-hints.js`
- `tests/dialogue-highlight-coverage.test.cjs`
- `tests/dialogue-draft-compatibility.test.cjs`
- `tests/season2-source-order-batch02.test.cjs`
- `tests/season2-source-order-batch03.test.cjs`
- `tests/fixtures/friends-s2-dialogue-draft-compatibility.json`
- `tests/fixtures/dialogue-draft-preview.html` — test-only page, no production navigation entry.
- `Friends_S2_Dialogue_17_Compatibility_Final_Audit.md`

HEAD remains `62891c7f85282e513e3d0234999dd43f57ca3506`. Local two commits preserved. Current changes intentionally uncommitted; push not performed. Ahead / behind remains 2 / 0.

**Friends S2 Dialogue Draft Compatibility READY**
