# Sitcom English in Action v3.0

GitHub Pagesで動作する、海外ドラマ英語の静的学習アプリです。

## 収録データ

- Friends Season 1–9
- 1063 phrases
- 167 dialogues

## 起動方法

`index.html`をGitHub Pages、またはローカルHTTPサーバーから開いてください。

## 既存バージョンとの互換性

既存のフレーズ／ダイアログIDと以下の保存キーを維持しています。

- `friendsBookmarks_phrase`
- `friendsBookmarks_dialogue`
- `friendsWeakStats`

同じ公開URLへv3.0を配置すると、既存のBookmarksとWeak履歴を引き継ぎます。

## v3.0 Phase 1–4

Phrase Detailから「覚えた」状態を切り替えられます。学習状態はPhrase ID単位で、以下の新しいキーへseries別に保存されます。

- `sitcomEnglish_learnedPhrases`

Phrasesでは「未習得」、Quizでは「習得済み」を含む5種類の学習フィルターを利用できます。Quizの問題は開始時に最大10問へ確定され、既存のResume仕様を維持します。

Progressページでは、Friends全体とSeason別のLearned進捗を表示します。集計値は読み込み済みPhrase dataと上記Learned stateから毎回計算され、Progress専用の保存データは作成しません。

Progressページの「学習進捗をリセット」は、確認後にFriendsのLearned stateだけを全解除します。Bookmark、Weak、Quiz履歴などの保存データは変更しません。

HomeのTodayカードにはStreak、Target、Friends全体のLearned進捗を表示します。Progressの数値はProgressページと同じ集計を再利用し、Homeから専用ページへ移動できます。

Phrase Detailでは、一覧を開いた時点の表示対象と順番を固定したPrevious / Nextナビゲーションを利用できます。Detail内でLearnedやBookmarkを変更しても移動順は維持され、Backでは元の一覧とフィルター状態へ戻ります。
