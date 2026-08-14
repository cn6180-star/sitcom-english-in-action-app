# Sitcom English in Action v4.3

GitHub Pages / PWAで動作する、海外ドラマ英語の学習アプリです。

海外ドラマで出会った英語を「分かる」で終わらせず、DialogueやQuizを入口に、聞く・話す・覚えるを行き来しながら「使える」表現へ育てることを目指しています。

## 収録データ

- Friends Season 1–9
- 1063 phrases
- 167 dialogues
- 2126 examples
- Friends Season 10 Coming Soon
- The Big Bang Theory Coming Soon

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

## Dialogues / 会話練習

Dialogue Detailでは、日本語訳と次のモードを独立して利用できます。

- Normal：A / Bの全セリフを表示
- Hide A / Hide B：選んだ側の英語を隠して発話練習
- 日本語訳ON：隠した側の日本語訳をヒントとして表示
- 日本語訳OFF：日本語訳なしで完全暗唱
- Tap to reveal：隠した英文を表示して答え合わせ
- 🔊：各セリフを個別に音声読み上げ
- Play Dialogue：Dialogue全体を順番に音声再生

Hide A / Hide BとPlay Dialogueを組み合わせると、アプリが表示側を読み上げ、ユーザーが隠した側を担当する片役ロールプレイができます。ユーザーのターンには英文の長さに応じた待ち時間が入り、待機中にTap to revealを押しても会話再生は継続します。

Stop、モード変更、Previous / Next / Back、個別音声の開始時には通し再生を停止します。タブやPWAがバックグラウンドへ移行した場合も、音声と待機処理を停止し、復帰後に自動再開しません。

## Quiz

学習対象をSeason、重要、苦手、習得済み、Bookmarkなどで絞り込み、1回最大10問のQuizに挑戦できます。

- 途中状態を保存してResume
- Resultから間違えたPhrase Detailへ直接移動
- 間違えたPhraseを自動で「苦手」に分類
- Resultから苦手な表現をまとめて復習

## Progress / Home

ProgressではFriends全体とSeason別のLearned進捗を、読み込み済みPhrase dataとLearned stateから毎回集計します。Season内の全PhraseをLearnedにすると、そのSeasonカードに`🏆 COMPLETE`バッジが表示されます。

HomeにはStreak、Daily Target、Friends全体のLearned進捗、Continue Learningを表示します。

## Search / Bookmarks

SearchではPhrase、Meaning、Example、Dialogueを横断検索し、結果から各Detailへ直接移動できます。

Bookmarksでは、あとで見返したいPhraseとDialogueをそれぞれ保存・確認できます。Learnedとは独立した機能です。

## Sound / Help

Web Audio APIによるQuiz正誤、「覚えた」、Season達成、当日初回起動の効果音があります。Sound設定はSidebar（Desktop / Tablet）またはMobileメニューからON / OFFを切り替えられ、再読み込み後も維持されます。英文の音声読み上げとは別機能です。

Sidebar / MobileメニューのHelpでは、Dialogues・Quiz・Phrasesからのおすすめの始め方と、学習機能のFAQを確認できます。

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

Phrase / Dialogue JSON、ID、保存キーの形式はv4.3でも変更していません。
