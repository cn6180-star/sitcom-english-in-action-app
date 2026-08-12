# Sitcom English in Action v4.1

GitHub Pages / PWAで動作する、海外ドラマ英語の学習アプリです。

## 収録データ

- Friends Season 1–9
- 1063 phrases
- 167 dialogues
- Season 10 Coming Soon

## 起動方法

GitHub Pagesの公開URLから利用できます。

PWA対応済みのため、対応ブラウザではホーム画面やデスクトップへインストールして、standaloneアプリとして起動できます。

ローカルで確認する場合は、`index.html` をローカルHTTPサーバーから開いてください。

## 主な学習機能

- Phrase / Dialogue閲覧
- Phrase DetailのPrevious / Nextナビゲーション
- Bookmark
- Learned（覚えた）
- Weak管理
- Daily Quiz
- Quiz Resume
- Progress
- Streak / Target
- Continue Learning
- Search
- Usageフィルター
- 音声読み上げ

## Phrase学習

Phrase Detailから「覚えた」状態を切り替えられます。

学習状態はPhrase ID単位でseries別に保存されます。

保存キー：

`sitecomEnglish_learnedPhrases`

Phrasesでは「未習得」、Quizでは「習得済み」を含む学習フィルターを利用できます。

Phrase Detailでは、一覧を開いた時点の表示対象と順番を維持したPrevious / Nextナビゲーションを利用できます。

Detail内でLearnedやBookmarkを変更しても移動順は維持され、Backでは元の一覧とフィルター状態へ戻ります。

## Quiz

Quizは1回最大10問です。

既存のResume仕様を維持し、途中で離れても再開できます。

入力問題では、Phrase末尾の `~` は省略しても正解として扱います。

Quiz結果画面では、今回間違えたPhrase一覧から各Phrase Detailへ直接移動できます。

Phrase Detailを確認したあとBackすると、Score / Mistakes / Weak等のQuiz Result状態を維持したまま結果画面へ戻れます。

## Progress

Progressページでは、Friends全体とSeason別のLearned進捗を表示します。

集計値は読み込み済みPhrase dataとLearned stateから毎回計算され、Progress専用の保存データは作成しません。

Season内の全PhraseをLearnedにすると、そのSeasonカードに

`🏆 COMPLETE`

バッジが表示されます。

「学習進捗をリセット」では、確認後にFriendsのLearned stateだけを全解除します。

Bookmark、Weak、Quiz履歴などの保存データは変更しません。

## Home

HomeのTodayカードには以下を表示します。

- Streak
- Target
- Friends全体のLearned進捗

Progressの数値はProgressページと同じ集計を再利用しています。

Continue Learningから直近の学習位置へ戻ることができます。

## Dialogues

Dialogue Detailでは以下の表示モードを利用できます。

- Normal
- Hide A
- Hide B

さらに、日本語訳の表示 / 非表示を独立して切り替えられます。

Previous / Nextで別Dialogueへ移動しても、現在の表示状態を維持できます。

## Search

SearchはAboutと同じ中央モーダル形式で表示されます。

Phrase / Meaning / Example / Dialogueを検索でき、検索結果から各Detailへ直接移動できます。

## PWA

v4.0からPWAに対応しています。

- ホーム画面 / デスクトップへインストール可能
- standalone表示
- Android / iPhone / iPad / Desktop対応
- Manifest / Service Worker対応

通常のブラウザ版もそのまま利用できます。

## 効果音

Web Audio APIによる軽い効果音を実装しています。

- Quiz正解
- Quiz不正解
- Learned ON
- 1日最初の起動ジングル

Sound設定からON / OFFを切り替えられます。

## 既存バージョンとの互換性

既存のPhrase / Dialogue IDと保存キーを維持しています。

主な既存キー：

- `friendsBookmarks_phrase`
- `friendsBookmarks_dialogue`
- `friendsWeakStats`
- `sitcomEnglish_learnedPhrases`

既存のBookmarks / Weak / Learned等の学習履歴を維持したままアップデートできます。

## 対応環境

- Desktop
- Tablet
- Mobile
- PWA standalone

レスポンシブUIに対応しています。
