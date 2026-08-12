# Sitcom English in Action v4.2

GitHub Pages / PWAで動作する、海外ドラマ英語の学習アプリです。

## 収録データ

- Friends Season 1–9
- 1063 phrases
- 167 dialogues
- Season 10 Coming Soon
- The Big Bang Theory Coming Soon

## 起動方法

GitHub Pagesの公開URLから利用できます。

PWA対応済みのため、対応ブラウザではホーム画面やデスクトップへインストールして、standaloneアプリとして起動できます。

ローカルで確認する場合は、`index.html`をローカルHTTPサーバーから開いてください。

## 主な学習機能

- Phrase / Dialogue閲覧
- Phrase DetailのPrevious / Nextナビゲーション
- Learned（覚えた）
- Bookmark / Weak管理
- Daily Quiz / Quiz Resume
- Progress / Season COMPLETE badge
- Streak / Target / Continue Learning
- Search / Usageフィルター
- 日本語訳の表示 / 非表示
- TTS / Dialogue会話練習
- Web Audio APIによる効果音

## Phrase学習

Phrase DetailからLearnedとBookmarkを切り替えられます。学習状態はPhrase ID単位でseries別に保存されます。

Phrasesでは未習得・重要・Weak・保存済みなどの絞り込みを利用できます。Phrase DetailのPrevious / Nextは、一覧を開いた時点の表示対象と順番を維持します。Detail内でLearnedやBookmarkを変更しても移動順は変わらず、Backでは元の一覧とフィルター状態へ戻ります。

Examplesでは英語例文を常時表示し、日本語訳だけを表示 / 非表示できます。各例文のスピーカーボタンでは英語だけを個別に読み上げます。

## Quiz

Quizは1回最大10問です。途中で離れてもResumeできます。

入力問題では、Phrase末尾の`~`は省略しても正解として扱います。Quiz結果画面では、今回間違えたPhrase一覧から各Phrase Detailへ直接移動できます。Phrase Detailを確認してBackすると、Score / Mistakes / Weak等のQuiz Result状態を維持したまま結果画面へ戻れます。

## Progress

Progressページでは、Friends全体とSeason別のLearned進捗を表示します。

集計値は読み込み済みPhrase dataとLearned stateから毎回計算され、Progress専用の保存データは作成しません。Season内の全PhraseをLearnedにすると、そのSeasonカードに`🏆 COMPLETE`バッジが表示されます。

「学習進捗をリセット」では、確認後にFriendsのLearned stateだけを全解除します。Bookmark、Weak、Quiz履歴などの保存データは変更しません。

## Home

HomeのTodayカードにはStreak、Target、Friends全体のLearned進捗を表示します。Progressの数値はProgressページと同じ集計を再利用しています。

Continue Learningから直近の学習位置へ戻れます。

## Dialogues / 会話練習

Dialogue Detailでは、日本語訳の表示 / 非表示と以下のモードを独立して利用できます。

- Normal：A / Bの全セリフを表示
- Hide A：Aを隠し、ユーザーがA役を担当
- Hide B：Bを隠し、ユーザーがB役を担当

各英語セリフはスピーカーボタンから個別に読み上げられます。Play DialogueではDialogue全体を上から順番に再生し、利用できる英語voiceが複数ある場合はA / Bに異なるvoiceを使用します。

Hide A / Hide Bの通し再生では、隠した側をTTSで読まず、ユーザーが発話する待ち時間を入れます。待ち時間は英文の長さに応じて調整されます。待機中でもTap to revealで答えを確認でき、進行中のDialogue再生や待機時間はそのまま継続します。

Stop、モード変更、Previous / Next / Back、個別TTS開始時には通し再生を停止します。タブやPWAがバックグラウンドへ移行した場合も、音声・待機timer・古い再生sequenceをcleanupし、復帰後に自動再開しません。

## Search

Phrase / Meaning / Example / Dialogueを検索でき、検索結果から各Detailへ直接移動できます。

## Sound

Web Audio APIによる効果音を実装しています。

- Quiz正解 / 不正解
- Learned ON
- Season COMPLETE
- その日の初回起動ジングル

Sound設定はSidebar（Desktop / Tablet）またはハンバーガーメニュー（Mobile）からON / OFFを切り替えられます。設定は再読み込み後も維持され、OFF時はすべての効果音を再生しません。

## PWA

- ホーム画面 / デスクトップへインストール可能
- standalone表示
- Android / iPhone / iPad / Desktop対応
- Manifest / Service Worker対応

通常のブラウザ版もそのまま利用できます。

## 既存バージョンとの互換性

既存のPhrase ID / Dialogue IDとlocalStorage保存キーを維持しています。データ更新時も既存のBookmarks、Weak、Learned、Quiz等の状態を引き継げます。

現在使用している保存キー：

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

## 対応環境

- Desktop
- Tablet
- Mobile
- PWA standalone

レスポンシブUIに対応しています。
