# Sitcom English in Action v5.4

GitHub Pages / PWAで動作する、海外ドラマ英語の学習アプリです。

海外ドラマで出会った英語を「分かる」で終わらせず、DialogueやQuizを入口に、聞く・話す・覚えるを行き来しながら「使える」表現へ育てることを目指しています。

## 収録データ

- Friends Season 1–9 available — For Everyday English
- 1063 phrases
- 167 dialogues
- 2126 examples
- Friends Season 10 Coming Soon
- The Big Bang Theory — For Advanced English（Coming Soon）

## v5.4 Updates

- Phrase / Dialogue Detailに最大60秒のRecordingを追加。録音後のPlay / Stop、Retry、Close、60秒での自動停止に対応
- Quiz Test / Practice、Homeから本番10問Mixへすぐ挑戦できるQuick Challenge、Review mistakes / Next Roundを含むResult UXを整備
- DialogueのNormal / Blank / Hide A / Hide B、Play Dialogue、TTS、左右スワイプ操作を改善
- Home / SeriesをFriends「For Everyday English」、The Big Bang Theory「For Advanced English」の役割が分かる構成へ整理
- Daily Target、直近7日間の学習履歴付きStreak、Achievement Toast、Backup / Restore、Sound Feedbackを搭載

## 起動方法

GitHub Pagesの公開URLから利用できます。PWA対応ブラウザではホーム画面やデスクトップへインストールし、standaloneアプリとして起動できます。

ローカルで確認する場合は、`index.html`をローカルHTTPサーバーから開いてください。

## Phrases

Phrase一覧から、意味・場面・Examplesを収録したPhrase Detailを開けます。

- Examplesの日本語訳を表示 / 非表示
- 🔊から英語例文を個別に音声読み上げ
- Learned（覚えた）とBookmark
- 重要・苦手・未習得・習得済み・使用感などの学習フィルター
- 一覧の表示対象と順番を維持したPrevious / Next
- 左右スワイプによるPrevious / Next移動

## Dialogues / 会話練習

Dialogue Detailでは、日本語訳と次のモードを独立して利用できます。

- Normal：A / Bの全セリフを表示
- Blank：Human Reviewed Highlight Rangeを隠して個別に答え合わせ
- Hide A / Hide B：選んだ側の英語を隠して発話練習
- 日本語訳ON：隠した側の日本語訳をヒントとして表示
- 日本語訳OFF：日本語訳なしで完全暗唱
- Tap to reveal：隠した英文を表示して答え合わせ
- 🔊：各セリフを個別に音声読み上げ
- Play Dialogue：Dialogue全体を順番に音声再生
- Play Dialogue再生中も、日本語訳の表示 / 非表示を切り替えて再生を継続
- 会話本文と「このダイアログの学習フレーズ」からの左右スワイプによるPrevious / Next移動
- 学習PhraseからPhrase Detailへ移動

Dialogue内のlinked Phraseは、共通matcherとexplicit match hintsで本文位置を特定してハイライトします。分離した表現などでは複数range・部分ハイライトを利用し、右側の学習Phraseも同じmatch結果による本文登場順で表示します。

Hide A / Hide BとPlay Dialogueを組み合わせると、アプリが表示側を読み上げ、ユーザーが隠した側を担当する片役ロールプレイができます。ユーザーのターンには英文の長さに応じた待ち時間が入り、待機中にTap to revealを押しても会話再生は継続します。

Stop、モード変更、Previous / Next / Back、個別音声の開始時には通し再生を停止します。タブやPWAがバックグラウンドへ移行した場合も、音声と待機処理を停止し、復帰後に自動再開しません。

## Recording

Phrase / Dialogue Detailから自分の声を最大60秒まで録音できます。60秒に達すると自動停止し、録音後はPlayで聞き返し、Retryですぐに録り直せます。

PhraseではExample TTSをお手本にした発音練習、DialogueではHide A / Hide Bなどと組み合わせたセリフ・会話テンポの練習に利用できます。録音中もTTSやPlay Dialogueを利用できますが、TTS音声が録音に入るかどうかは端末・ブラウザ環境によって異なります。

録音データは一時利用のみで永続保存されません。Closeまたは別ページへの移動で破棄され、初回利用時にはマイクへのアクセス許可が必要です。

## Quiz

Test（本番）とPractice（練習）を利用できます。Practiceでは日→英・英→日・入力、5・10・15問、Seasonや学習状態などを選択できます。

- HomeのQuick Challengeから、本番10問Mixへ設定画面を経由せず挑戦
- 途中状態を保存してResume
- PracticeのReview mistakesでは選択したquestion typeを維持
- コンパクトな出題画面と、score / status / actionを整理したResult
- Result上部にReview mistakes / Next Round / Doneを3カラム表示
- Perfect時はscoreに👑を表示
- Resultから各Phrase Detailへ直接移動
- 間違えたPhraseを自動で「苦手」に分類
- Weak / Graduated / MistakesをResultへ反映

## Progress / Home

ProgressではFriends全体とSeason別のLearned進捗を、読み込み済みPhrase dataとLearned stateから毎回集計します。Season内の全PhraseをLearnedにすると、そのSeasonカードに`🏆 COMPLETE`バッジが表示されます。

HomeにはQuick Challenge、Continue Learning、Today / Daily Target、Streak、Friends全体のLearned進捗を表示します。SeriesページはDialogues・Quiz・Phrasesの学習モード入口を中心に構成しています。

Streakモーダルでは今日を右端とした直近7日間を表示し、学習日は🔥、Todayは紫枠と拡大表示で強調します。Reduced Motionが無効でTodayが学習済みの場合のみ、Todayの🔥が軽くアニメーションします。

## Search / Bookmarks

Phrase検索はPhrase名だけを対象に、スペース区切りの複数キーワードをAND条件で検索します。キーワードの語順は問わず、単語境界を考慮するため、`all`から`call`・`hardball`・`technically`のような別語は拾いません。`go`から`going`・`goes`などの基本的な動詞活用を検索できますが、`got`・`wagon`は対象外です。`got`から`gotta`を検索でき、apostrophe・半角 / 全角括弧・空白・hyphen等の表記差も正規化します。Dialogue検索は従来どおり利用できます。

Bookmarksでは、あとで見返したいPhraseとDialogueをそれぞれ保存・確認できます。Learnedとは独立した機能です。

## Backup / Restore

学習データと設定をBackupファイルとして書き出し、別のブラウザや端末でRestoreできます。Restoreではvalidation、Safety Backup、保存失敗時のrollbackを行い、不完全な復元を成功扱いにしません。

## Sound / Help

Web Audio APIによるQuiz回答、「覚えた」、Season達成、当日初回起動の効果音があります。Sound設定はSidebar（Desktop / Tablet）またはMobileメニューからON / OFFを切り替えられ、再読み込み後も維持されます。英文の音声読み上げとは別機能です。

Sidebar / MobileメニューのHelpでは、Dialogues・Quiz・Phrasesからのおすすめの始め方、Detail画面の左右スワイプ操作、学習機能のFAQを確認できます。

## PWA / 対応環境

- Desktop / Tablet / Mobile
- Android / iPhone / iPad
- PWA standalone
- Manifest / Service Worker
- `env(safe-area-inset-*)`を利用したiPhone / iPad Safe Area対応

通常のブラウザ版もそのまま利用できます。

## 保存データと互換性

学習データと設定はブラウザのlocalStorageに保存されます。アカウント同期型ではないため別端末へ自動同期されず、ブラウザデータを削除すると履歴が失われる可能性があります。

既存のPhrase ID / Dialogue IDと次のlocalStorage keyを維持しているため、従来のBookmarks、苦手、Learned、Quizなどの状態を引き継げます。

- `friendsBookmarks_phrase`
- `friendsBookmarks_dialogue`
- `friendsWeakStats`
- `sitcomEnglish_v2_state`
- `sitcomEnglish_v2_continue`
- `sitcomEnglish_v2_activity`
- `sitcomEnglish_v2_quizInProgress`
- `sitcomEnglish_v2_quizHistory`
- `sitcomEnglish_v2_dailyTarget`
- `sitcomEnglish_learnedPhrases`
- `sitcomEnglish_soundEnabled`
- `sitcomEnglish_lastJingleDate`

Phrase / Dialogue JSON、ID、既存localStorage keyとの互換性はv5.4でも維持しています。
