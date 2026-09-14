# Dialogue Highlight Matcher — Final Audit

## Before

- baseline: `8d45e8482aa2f03e21fe1f8fa902a682968c63f1` (main)
- 204 Dialogue / 1,047 links
- rangeあり967（auto817 / explicit150）、zero-match80
- hint169 / forced override56

## Final triage

ChatMochi最終裁定: common57、explicit16、BROKEN_LINK1、SEMANTIC_MISMATCH6。裁定待ち0。除外7件のproductionリンク・本文は変更していません。

## Matcher rules added

固定anchorを分離rangeで返し、可変slotは塗りません。既存範囲があるリンクは先に保持し、新fallbackで既存967件の位置を変えません。

- Offset-preserving token expansion of known contractions and be forms; no be/get synonym substitution.
- Explicit possessive/reflexive/person/thing slots with bounded word counts; fixed anchors highlighted separately.
- Literal something retained for completed questions and something of an item.
- Tilde and ellipsis templates match shortest bounded gap; terminal slots only validate presence; variable clauses not painted.
- Explicit parenthesis/slash alternatives and +noun / A-B notation.
- Limited verb form map; no derivational word-family equivalence.
- Audited modifier positions, number agreement and be-question subject positions.
- Demonstrated particle/noun order from record example/note, not arbitrary particle permutation.

### 57件のruleタグ別件数（重複あり）

- VERB_INFLECTION: 7
- ARTICLE_NUMBER_VARIATION: 3
- BOUNDED_MODIFIER: 9
- OPTIONAL_TOKEN: 2
- PUNCTUATION_NORMALIZATION: 7
- BE_VARIATION: 18
- WORD_ORDER_VARIANT: 3
- CONTRACTION: 15
- TILDE_PLACEHOLDER: 14
- ONES_POSSESSIVE: 16
- SOMEONE_REPLACEMENT: 4
- OTHER_GENERALIZABLE: 5
- SOMETHING_REPLACEMENT: 3
- SEPARATED_PHRASAL_VERB: 4
- REFLEXIVE_REPLACEMENT: 5

## Final result

| Classification | Links |
|---|---:|
| auto matched | 874 |
| explicit matched | 166 |
| approved broken/mismatch | 7 |
| unexplained zero-match | 0 |

新規hint16、合計185、forced72。d44はcall it firstのみ、d49/p453はWhat a shameのみ。発話合成・Shame on youへの誤対応はありません。

## Regression tests

- 57 common + 16 overrideの確認済み固定範囲をfixture化。
- 1,047リンク全件検証、7件以外のzero-matchはFAIL。
- positive12 / negative13 PASS。
- 既存967リンクのoffset・text・source完全不変。
- 既存hint169・forced56の定義不変。表示される既存explicit167範囲の位置も不変。
- 全204 Dialogueでoffset、本文保存、nested spanなし、重なり選択後の新規範囲消失0を確認。
- 既存33 + 新規1 = **34 PASS / 0 FAIL**。
- git diff --check PASS。
- Batch02/03のapp.js全体ハッシュ期待値のみ更新。データ・sourceOrder・Dialogue保護assertionの変更なし。

## Visual / BlankMode

ブラウザ操作でd204を確認。通常表示はWhat ifだけ着色、Blankではその固定部分だけ非表示、解除成功。日本語訳切替成功。スマートフォン幅のclientWidth/scrollWidthはともに375で横はみ出しなし。行読み上げボタン操作後にconsole errorなし（音声そのものの聴覚検証は未実施）。全画面の目視確認ではなく、代表実機確認＋全204件のrender testです。

## Approved exclusions

- d8/p117: BROKEN_LINK — 全11行にper seの用法がない。Technicallyは関連する説明だが答える表現は異なる。
- d35/p262: SEMANTIC_MISMATCH — 固定Way to go!とproductive Way to +動詞句は別。recordに後者を含める根拠がない。
- d38/p346: SEMANTIC_MISMATCH — judgeは通常の動詞。相手の引用語を動詞化するnoteの構文ではない。~へ任意の動詞を入れると誤match。
- d62/p400: SEMANTIC_MISMATCH — 挑戦する側ではなく受ける側。extendedの活用形でも同一会話機能でもない。
- d109/p806: SEMANTIC_MISMATCH — recordの達成senseに対し、本文は未実施の旅行を予定から外すsense。構文一致だけでは採用しない。
- d145/p912: SEMANTIC_MISMATCH — recordはsomeoneのための入浴準備。本文には受益者がなく、自分のためのrun a bath。
- d146/p874: SEMANTIC_MISMATCH — 動詞registerではなくregistration/registryという名詞。noteが関連名詞を説明しても同じ答えにはならない。

## Production integrity

Phrase3106 / Dialogue204。Phrase・Dialogue・phraseLinks・sourceOrderは完全不変。ID参照切れ0。意味的問題7件は承認済みのまま残存し、ID参照切れとは区別しています。

## Changed files

- `index.html`
- `js/app.js`
- `js/dialogue-highlight-matcher.js`
- `js/dialogue-match-hints.js`
- `tests/dialogue-highlight-coverage.test.cjs`
- `tests/fixtures/dialogue-highlight-approved.json`
- `tests/season2-source-order-batch02.test.cjs`
- `tests/season2-source-order-batch03.test.cjs`
- `tools/audit-dialogue-highlight.cjs`
- `Dialogue_Highlight_ZeroMatch_Triage.json`
- `Dialogue_Highlight_ZeroMatch_Triage.md`
- `Dialogue_Highlight_Matcher_Final_Audit.json`
- `Dialogue_Highlight_Matcher_Final_Audit.md`

元のDialogue_Highlight_Matcher_Audit.jsonは未変更。監査スキルはブラウザ確認の手順にのみ使用し、実装方針やデータを変更していません。

## Git

commit=false / push=false。mainとorigin/mainはbaselineのまま一致（0/0）。意図した変更を未commitで保持。

**Dialogue Highlight Matcher Final Implementation READY**
