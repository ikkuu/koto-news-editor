# 家族の食事プランナー（meal）

5人家族の朝・昼・夕・弁当をまとめてAI生成し、買い物リストと予算を管理するブラウザアプリ。

## 公開URL（push後）

```
https://ikkuu.github.io/koto-news-editor/meal/
```

## 仕組み

- **フレームワーク**: React 18 + Babel Standalone（CDN経由、ビルド不要）
- **データ保存**: ブラウザの localStorage（端末ごとに独立）
- **AI生成**: Anthropic Claude API を直接呼び出し（`anthropic-dangerous-direct-browser-access` 経由）
- **モデル**: Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`)

## 初回セットアップ（iPhone等）

1. ブラウザで上記URLを開く
2. ユーザー（パパ/ママ/長男/次男/三男）を選択
3. 右上の **⚙ボタン** → Anthropic API キーを入力 → 保存
   - キーは https://console.anthropic.com/settings/keys で発行
   - キーは **端末のlocalStorageにのみ保存**、サーバーには送られない
4. 「✨ 1週間の全食事プランを生成」ボタンで自動献立作成
5. ホーム画面に追加（共有ボタン → ホーム画面に追加）でアプリ化

## 主な機能

| タブ | 内容 |
|---|---|
| 📅 週間プラン | AI生成・日ごと展開・夕食の再生成と確定 |
| 🛒 買い物 | カテゴリ別チェックリスト、誰が拾ったかバッジ |
| 💰 予算 | 月10万円目安、項目別と合計 |
| 📖 ログ | 確定した夕食履歴（次回AIが重複を避ける）|

## データの取扱い

- すべてのデータ（献立、買い物リスト、ログ、APIキー）は **localStorage** に保存
- **同期はされない** → 別の端末で見るには、その端末でも独自にAPIキー設定が必要
- 端末を変えると履歴も別物になる
- 将来、Firebase 等で家族間同期したい場合は別途構築可

## 元のソース

```
C:\Users\bonki\Downloads\family-meal-planner-v2.jsx
```

を、ブラウザで動作する形にポート。元の `window.storage` API（Claude Artifacts専用）を localStorage に置換、APIキー入力UIを追加。

## コスト目安（API利用料）

- 1週間プラン生成: 約 ¥3〜10
- 夕食1日分の再生成: 約 ¥1〜2
- 買い物リスト生成: 約 ¥2〜5

月数百円程度で運用可能。
