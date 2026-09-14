# Dialogue Highlight Zero-Match Triage — Final Decisions

ChatMochi最終裁定を反映。80件すべて確定、裁定待ち0。productionリンクは変更しない。

## 1. Summary

- VALID_VARIANT: 57
- VALID_BUT_OVERRIDE: 16
- BROKEN_LINK: 1
- SEMANTIC_MISMATCH: 6
- REVIEW_REQUIRED: 0
- HIGH / MEDIUM / LOW: 79 / 1 / 0

## 2. VALID_VARIANT

| Dialogue/Phrase | Headline | Reason | Tags | Action |
|---|---|---|---|---|
| d10/p107 | hone a skill | hone→honed、a skill→your presentation skills。技術を磨く意味で例文のhoning my skillsと整合。 | VERB_INFLECTION, ARTICLE_NUMBER_VARIATION, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d169/p2356 | What are you up to (tonight)? | 括弧内tonightが実現した形。予定を尋ねる用法・例文と一致。 | OPTIONAL_TOKEN, PUNCTUATION_NORMALIZATION | COMMON_MATCHER_CANDIDATE |
| d169/p1039 | be up for it | be→areと疑問文の主語挿入。活動に乗り気か尋ねる構文。 | BE_VARIATION, WORD_ORDER_VARIANT | COMMON_MATCHER_CANDIDATE |
| d171/p1461 | be fine with ~ / be okay with ~ | 許容のfine with。be→amの短縮形、~→that。 | BE_VARIATION, CONTRACTION, TILDE_PLACEHOLDER | COMMON_MATCHER_CANDIDATE |
| d172/p1147 | on one’s way over (to ~) | one’s→my、任意の(to ~)が省略。相手へ向かう途中。 | ONES_POSSESSIVE, OPTIONAL_TOKEN | COMMON_MATCHER_CANDIDATE |
| d177/p1129 | be stuck ~ | be→amの短縮、計算で行き詰まる用法。meaningの行き詰まりと一致。 | BE_VARIATION, CONTRACTION, TILDE_PLACEHOLDER | COMMON_MATCHER_CANDIDATE |
| d178/p2601 | I was wondering, ~ | 控えめな依頼の導入。noteは直接疑問も可能とし、if節の間接依頼を排除していない。 | TILDE_PLACEHOLDER, PUNCTUATION_NORMALIZATION | COMMON_MATCHER_CANDIDATE |
| d181/p1576 | How about ~? | 場所を提案するHow about +名詞句。句読点と長いslotによるmiss。 | TILDE_PLACEHOLDER, PUNCTUATION_NORMALIZATION | COMMON_MATCHER_CANDIDATE |
| d182/p2389 | be up to someone | 決定は相手次第という意味で例文と一致。 | BE_VARIATION, CONTRACTION, SOMEONE_REPLACEMENT | COMMON_MATCHER_CANDIDATE |
| d189/p2377 | It’s not that ~; it’s that ... | 否定する理由と本当の理由を対置。同一frameの二つの固定部を対応させる。 | TILDE_PLACEHOLDER, CONTRACTION, PUNCTUATION_NORMALIZATION | COMMON_MATCHER_CANDIDATE |
| d190/p2730 | Did I miss something? | 本文はheadlineそのもの。somethingはこの完成疑問文では実語。placeholderとして除去しないliteral経路が必要。 | OTHER_GENERALIZABLE, PUNCTUATION_NORMALIZATION | COMMON_MATCHER_CANDIDATE |
| d195/p2388 | be comfortable with ~ | be疑問文と~の動名詞節。写真共有への心理的抵抗の確認。 | BE_VARIATION, WORD_ORDER_VARIANT, TILDE_PLACEHOLDER | COMMON_MATCHER_CANDIDATE |
| d195/p1461 | be fine with ~ / be okay with ~ | 同じ許容sense。共有先条件が後続してもfine withの構文は成立。 | BE_VARIATION, CONTRACTION, TILDE_PLACEHOLDER | COMMON_MATCHER_CANDIDATE |
| d196/p2988 | would rather ~ | would→'d、後ろは動詞原形。選好の構文・例文と一致。 | CONTRACTION, TILDE_PLACEHOLDER | COMMON_MATCHER_CANDIDATE |
| d198/p1929 | be worried about someone | 相手を心配する用法で例文と一致。 | BE_VARIATION, CONTRACTION, SOMEONE_REPLACEMENT | COMMON_MATCHER_CANDIDATE |
| d199/p2239 | I don’t mean to be ~, but ... | 断りの前置きframe。difficultと後続主張はslot、固定部を残す。 | TILDE_PLACEHOLDER, PUNCTUATION_NORMALIZATION | COMMON_MATCHER_CANDIDATE |
| d201/p2860 | fit | 服のサイズが合うfitの三単現。wordの短さで除外しない。 | VERB_INFLECTION | COMMON_MATCHER_CANDIDATE |
| d202/p2699 | have trouble with ~ | have→having。例文と一致する機器の不調による困難。 | VERB_INFLECTION, TILDE_PLACEHOLDER | COMMON_MATCHER_CANDIDATE |
| d204/p1909 | What if ~? | 仮の提案を出すframe。example2と同機能。固定部What ifが学習対象。 | TILDE_PLACEHOLDER, PUNCTUATION_NORMALIZATION | COMMON_MATCHER_CANDIDATE |
| d12/p160 | take someone’s advice | someone’s→your。助言に従う構文。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d17/p170 | be all ears | 相手の話を聞く姿勢。例文と同じam短縮。 | BE_VARIATION, CONTRACTION | COMMON_MATCHER_CANDIDATE |
| d19/p205 | get bent out of shape | gettingの進行形と強調soの挿入。過剰に怒る同一idiom。 | VERB_INFLECTION, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d21/p132 | spare someone’s feelings | someone’s→your。傷つけないという同一構文、否定文でもsenseは同じ。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d22/p170 | be all ears | 聞く姿勢のidiom。例文と一致。 | BE_VARIATION, CONTRACTION | COMMON_MATCHER_CANDIDATE |
| d22/p136 | have one's share of ~ | have→had、one’s→my、経験内容がslot。例文と同じ現在完了の経験。 | VERB_INFLECTION, ONES_POSSESSIVE, TILDE_PLACEHOLDER | COMMON_MATCHER_CANDIDATE |
| d23/p206 | be something of an item | be→are。something ofはここでは固定した緩和表現であり自由slotにしない。恋愛関係の意味。 | BE_VARIATION | COMMON_MATCHER_CANDIDATE |
| d26/p279 | get something out of one’s system | it/myへのslot置換。欲求を消化する同じ比喩表現。 | SOMETHING_REPLACEMENT, ONES_POSSESSIVE, SEPARATED_PHRASAL_VERB | COMMON_MATCHER_CANDIDATE |
| d32/p308 | be in a tough spot | 厳しい選択の立場。例文と同じ短縮be。 | BE_VARIATION, CONTRACTION | COMMON_MATCHER_CANDIDATE |
| d33/p321 | be out of one’s mind | be→was、one’s→my。過去の発言を引用した正気でないsense。 | BE_VARIATION, ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d33/p325 | pick something up where someone left off | something→it、someone→主語we。中断した会話を再開する例文と一致。 | SOMETHING_REPLACEMENT, SOMEONE_REPLACEMENT, SEPARATED_PHRASAL_VERB | COMMON_MATCHER_CANDIDATE |
| d35/p277 | be out of someone’s league | were/myと強調way。人間関係で釣り合わないsenseでmeaningと一致。 | BE_VARIATION, ONES_POSSESSIVE, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d39/p352 | give oneself credit | oneself→yourself、数量some。自己評価の例文そのもの。 | REFLEXIVE_REPLACEMENT, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d39/p381 | have one’s work cut out | one’s→my。多い仕事を抱えるidiom、後続for meも自然。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d41/p374 | put one’s foot in one’s mouth | 二つの所有格がmyに置換。失言のidiom。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d42/p463 | be hard on someone | noteのreflexive variationそのもの。soを限定修飾として扱う。 | SOMEONE_REPLACEMENT, REFLEXIVE_REPLACEMENT, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d60/p423 | a piece of cake | 例文/noteに明示されたnoによる否定。簡単さの同じ尺度で否定を保持して答える。 | ARTICLE_NUMBER_VARIATION | COMMON_MATCHER_CANDIDATE |
| d65/p479 | be up for grabs | be→is。物がまだ誰でも入手可能なsense。 | BE_VARIATION | COMMON_MATCHER_CANDIDATE |
| d72/p561 | be back on one’s feet | 困難からの復帰を話者について表す比喩。機器修理後に自分が立ち直ったという文脈。 | BE_VARIATION, CONTRACTION, ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d73/p565 | be out of the picture | 職場の問題の関係から外れる同一idiom。somehowの限定副詞挿入。 | BE_VARIATION, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d73/p489 | for all I/we/you know | headlineに明示されたI/we/you選択肢のI。人称の推測一般化ではない。 | OTHER_GENERALIZABLE | COMMON_MATCHER_CANDIDATE |
| d74/p596 | be caught up on ~ | 情報に追いついていない否定形。notを消して肯定に見せず、否定込みの構文を認識。 | BE_VARIATION, CONTRACTION, TILDE_PLACEHOLDER, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d74/p560 | at one’s disposal | one’s→my。利用可能な資源を求めるsense。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d76/p494 | get ahead of oneself | get→getting、oneself→複数再帰。example1と一致。 | VERB_INFLECTION, REFLEXIVE_REPLACEMENT | COMMON_MATCHER_CANDIDATE |
| d77/p615 | get one’s hopes up | one’s→your。過度の期待を戒める同一idiom。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d79/p612 | push one’s luck | one’s→your。限度を越えて要求する同一idiom。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d87/p721 | beat oneself up | beat→beating、oneself→yourself。自責senseで例文と一致。 | VERB_INFLECTION, REFLEXIVE_REPLACEMENT, SEPARATED_PHRASAL_VERB | COMMON_MATCHER_CANDIDATE |
| d102/p4 | It sucks | 指示対象がIt→This。例文も主語を自由に置いており、不満を表すsucks構文を保持。 | OTHER_GENERALIZABLE | COMMON_MATCHER_CANDIDATE |
| d103/p752 | a whole nother + noun | + nounは型記法でstoryが実現。example1と一致する別の問題というsense。 | OTHER_GENERALIZABLE | COMMON_MATCHER_CANDIDATE |
| d107/p759 | stand one’s ground | one’s→your。立場を変えない同一idiom。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d116/p835 | be on the verge of ~ | 期限に間に合わない寸前という同一sense。be短縮とalready、slot実現。 | BE_VARIATION, CONTRACTION, TILDE_PLACEHOLDER, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d129/p861 | pull off / rip off the Band-Aid | note/example2に明示されたparticle後置。告知を一気に済ませる比喩でliteralと区別できる文脈。 | SEPARATED_PHRASAL_VERB, WORD_ORDER_VARIANT | COMMON_MATCHER_CANDIDATE |
| d129/p883 | a fine line between A and B | A/Bが動名詞句として実現。正直と冷淡の微妙な境界という例文に近いsense。 | OTHER_GENERALIZABLE | COMMON_MATCHER_CANDIDATE |
| d135/p881 | the chemistry isn’t right | isn’t→is notとjust。恋愛上の相性の否定senseを保持。 | CONTRACTION, BOUNDED_MODIFIER | COMMON_MATCHER_CANDIDATE |
| d135/p942 | put oneself out there | oneself→yourself。恋愛の場に再び出て自己開示する同一sense。 | REFLEXIVE_REPLACEMENT | COMMON_MATCHER_CANDIDATE |
| d151/p1032 | something doesn’t grow on trees | something→Good jobs、複数でdoesn’t→don’t。希少性の比喩で例文と同じ。 | SOMETHING_REPLACEMENT, ARTICLE_NUMBER_VARIATION, CONTRACTION | COMMON_MATCHER_CANDIDATE |
| d162/p1007 | show one’s true colors | one’s→your。本性を現す同一idiom。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |
| d164/p1067 | pool one’s money | one’s→our。共同で資金を集める同一構文。 | ONES_POSSESSIVE | COMMON_MATCHER_CANDIDATE |

## 3. VALID_BUT_OVERRIDE

| Dialogue/Phrase | Headline | Reason | Tags | Action |
|---|---|---|---|---|
| d203/p1289 | be there for someone | 支えるsenseのhere variantがexample1に明示。there↔hereの無条件置換は他の場所表現へ広げない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d13/p185 | hear something through the grapevine | Where did you hear that?への省略応答で聞いた経路を回答。別話者の語を結合せず、この回答部分だけを候補にする。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d19/p252 | brown-nosing suck-up | recordのnote/example2がbrown-nosing単独の行為も含む。本文のbrown-nosingのみをoverride。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d25/p304 | be on board with something | 送信方針への同意。with補部が文脈上省略されている。全前置詞句の任意化にはしない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d35/p324 | click with someone | example1のWe clickedと同じ相互的・補部省略用法。単語clickの機器操作senseもあるため文脈限定。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d35/p327 | be caught up in the moment | example1と一致するget受動/状態変化。全てのbeをgetへ置換しない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d44/p408 | call shotgun | shotgunの文脈とrecord例文に基づきcall it firstのみをoverride。発話を合成しない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d45/p376 | Don’t take this wrong | note/example2に明示された別形。the/wayを無条件挿入する一般則にしない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d49/p453 | shame about ~ | example2にWhat a shameが明示されている。What a shameだけをoverrideし、Shame on youは除外。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d49/p454 | there’s no shame in ~ | example2に明示されたthere’s省略。安心させる同一構文だが全there isの削除はしない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d51/p466 | Here’s a pickle | noteとexample1がin a pickleを明示。putting meが原因者を加えても困った状態のidiomは実現。here’s等まで無理に対応しない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d71/p547 | have a point | example1そのもの。have gotという所有的variantを他のhave構文へ無制限適用しない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d80/p614 | I know this is going to sound ~, but ... | noteにmayの形が明示。going toを任意の法助動詞へ一般化せず、前置きの固定範囲のみ。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d103/p5 | what’s with ~ | noteにWhat's up withのvariationが明示。up挿入をあらゆる前置詞表現へ一般化しない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d132/p966 | open a can of worms | example1のup variantそのもの。particleを任意挿入する一般則にせず、この形を認識。 |  | EXPLICIT_OVERRIDE_CANDIDATE |
| d157/p1008 | be a lump | note/example1に明示された比喩形。beをsit likeへ一般置換しない。 |  | EXPLICIT_OVERRIDE_CANDIDATE |

## 4. BROKEN_LINK

| Dialogue/Phrase | Headline | Reason | Tags | Action |
|---|---|---|---|---|
| d8/p117 | per se | 全11行にper seの用法がない。Technicallyは関連する説明だが答える表現は異なる。 |  | REMOVE_LINK_CANDIDATE |

## 5. SEMANTIC_MISMATCH

| Dialogue/Phrase | Headline | Reason | Tags | Action |
|---|---|---|---|---|
| d35/p262 | Way to go! | 固定Way to go!とproductive Way to +動詞句は別。recordに後者を含める根拠がない。 |  | REPLACE_LINK_CANDIDATE |
| d38/p346 | Don’t “~” me | judgeは通常の動詞。相手の引用語を動詞化するnoteの構文ではない。~へ任意の動詞を入れると誤match。 |  | REPLACE_LINK_CANDIDATE |
| d62/p400 | Challenge extended | 挑戦する側ではなく受ける側。extendedの活用形でも同一会話機能でもない。 |  | REPLACE_LINK_CANDIDATE |
| d109/p806 | cross something off one’s list | recordの達成senseに対し、本文は未実施の旅行を予定から外すsense。構文一致だけでは採用しない。 |  | REPLACE_LINK_CANDIDATE |
| d145/p912 | draw someone a bath | recordはsomeoneのための入浴準備。本文には受益者がなく、自分のためのrun a bath。 |  | REPLACE_LINK_CANDIDATE |
| d146/p874 | register | 動詞registerではなくregistration/registryという名詞。noteが関連名詞を説明しても同じ答えにはならない。 |  | REPLACE_LINK_CANDIDATE |

## 6. ChatMochi Review Required

なし。d19/p252、d44/p408、d49/p453はoverrideへ、d35/p262、d109/p806、d145/p912はsemantic mismatchへ確定。

## 7. Variant tag counts

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

## 8. 次工程

be/縮約、所有格、~固定anchorを優先。16件は個別override、7件は理由付き除外。データ変更・commit・pushはしない。最終実装検証はDialogue_Highlight_Matcher_Final_Auditを参照。
