// kotoedit To-Do Widget for Scriptable (iOS)
// =============================================
// 設置手順:
// 1. App Store で「Scriptable」をインストール（無料）
// 2. Scriptable で「+」 → このコードを丸ごとペースト → 名前: "TodoWidget" などに
// 3. ホーム画面長押し → 「+」→ Scriptable → 好きなサイズを選んで Add Widget
// 4. ウィジェット長押し → Edit Widget → Script: TodoWidget を選択
// 5. 完成。タップでブラウザにTo-Doページを開きます。
//
// 設定: 下のDATA_URLを書き換えるだけ。
// =============================================

const DATA_URL = "https://ikkuu.github.io/koto-news-editor/todo/data.json";
const OPEN_URL = "https://ikkuu.github.io/koto-news-editor/todo/";

// テーマカラー
const COLOR = {
  bg: new Color("#faf6ec"),
  ink: new Color("#2a1f15"),
  ink2: new Color("#5a4838"),
  muted: new Color("#998a76"),
  line: new Color("#e6e1d3"),
  doc: new Color("#6a8e5a"),
  oca: new Color("#4a6fa5"),
  jfc: new Color("#c2410c"),
  ws: new Color("#b08560"),
  koto: new Color("#5a2a8a"),
  misc: new Color("#888888"),
  accent: new Color("#c2410c"),
};

function tagColor(tag) {
  return COLOR[tag] || COLOR.misc;
}

async function fetchData() {
  const req = new Request(DATA_URL + "?t=" + Date.now());
  req.timeoutInterval = 8;
  return await req.loadJSON();
}

function totalCounts(data) {
  let total = 0, items = [];
  for (const sec of data.sections) {
    total += sec.items.length;
    for (const it of sec.items) items.push({ section: sec, item: it });
  }
  return { total, items };
}

function buildSmall(widget, data) {
  // 小: タイトル + 今日の最優先トップ2件 + 件数
  widget.backgroundColor = COLOR.bg;
  widget.url = OPEN_URL;
  widget.setPadding(12, 14, 12, 14);

  const title = widget.addText("To-Do");
  title.font = Font.boldSystemFont(14);
  title.textColor = COLOR.ink;

  widget.addSpacer(4);

  const today = data.sections.find(s => s.id === "today");
  const items = today ? today.items.slice(0, 2) : [];
  for (const it of items) {
    addItemLine(widget, it, data.tagLabels, 11, 1);
    widget.addSpacer(3);
  }

  widget.addSpacer();

  const sumLine = widget.addText(`${countAll(data)} tasks · upd ${data.updated.slice(5)}`);
  sumLine.font = Font.systemFont(9);
  sumLine.textColor = COLOR.muted;
}

function buildMedium(widget, data) {
  // 中: 今日 + 今週 のトップ計5件
  widget.backgroundColor = COLOR.bg;
  widget.url = OPEN_URL;
  widget.setPadding(12, 14, 12, 14);

  const headerStack = widget.addStack();
  const title = headerStack.addText("To-Do");
  title.font = Font.boldSystemFont(15);
  title.textColor = COLOR.ink;
  headerStack.addSpacer();
  const upd = headerStack.addText(`upd ${data.updated}`);
  upd.font = Font.systemFont(10);
  upd.textColor = COLOR.muted;

  widget.addSpacer(6);

  const picks = [];
  for (const id of ["today", "week"]) {
    const sec = data.sections.find(s => s.id === id);
    if (!sec) continue;
    for (const it of sec.items) {
      picks.push(it);
      if (picks.length >= 5) break;
    }
    if (picks.length >= 5) break;
  }
  for (const it of picks) {
    addItemLine(widget, it, data.tagLabels, 12, 2);
    widget.addSpacer(3);
  }

  widget.addSpacer();
  const sumLine = widget.addText(`合計 ${countAll(data)} 件`);
  sumLine.font = Font.systemFont(10);
  sumLine.textColor = COLOR.muted;
}

function buildLarge(widget, data) {
  // 大: 全セクション・各セクション上位2件
  widget.backgroundColor = COLOR.bg;
  widget.url = OPEN_URL;
  widget.setPadding(14, 16, 14, 16);

  const headerStack = widget.addStack();
  const title = headerStack.addText("To-Do");
  title.font = Font.boldSystemFont(18);
  title.textColor = COLOR.ink;
  headerStack.addSpacer();
  const upd = headerStack.addText(`upd ${data.updated}`);
  upd.font = Font.systemFont(11);
  upd.textColor = COLOR.muted;

  widget.addSpacer(8);

  for (const sec of data.sections) {
    if (sec.items.length === 0) continue;
    const head = widget.addText(sec.title);
    head.font = Font.semiboldSystemFont(11);
    head.textColor = COLOR.ink2;
    widget.addSpacer(2);
    const showItems = sec.items.slice(0, 2);
    for (const it of showItems) {
      addItemLine(widget, it, data.tagLabels, 11, 2);
      widget.addSpacer(2);
    }
    widget.addSpacer(4);
  }
}

function addItemLine(widget, item, tagLabels, fontSize, maxLines) {
  const row = widget.addStack();
  row.layoutHorizontally();
  row.spacing = 5;
  row.centerAlignContent();

  // タグ
  const tagText = (tagLabels && tagLabels[item.tag]) || item.tag || "·";
  const tagStack = row.addStack();
  tagStack.backgroundColor = tagColor(item.tag);
  tagStack.cornerRadius = 3;
  tagStack.setPadding(1, 4, 1, 4);
  const tagLabel = tagStack.addText(tagText);
  tagLabel.font = Font.boldSystemFont(fontSize - 2);
  tagLabel.textColor = new Color("#ffffff");
  tagLabel.lineLimit = 1;

  // 本文
  const text = row.addText(item.text);
  text.font = Font.systemFont(fontSize);
  text.textColor = COLOR.ink;
  text.lineLimit = maxLines;
}

function countAll(data) {
  return data.sections.reduce((s, sec) => s + sec.items.length, 0);
}

// === メイン処理 ===
let data;
try {
  data = await fetchData();
} catch (e) {
  const w = new ListWidget();
  w.backgroundColor = COLOR.bg;
  const t = w.addText("To-Do");
  t.font = Font.boldSystemFont(14);
  t.textColor = COLOR.ink;
  w.addSpacer(6);
  const err = w.addText("読み込み失敗\n" + e.message);
  err.font = Font.systemFont(11);
  err.textColor = COLOR.muted;
  err.lineLimit = 3;
  Script.setWidget(w);
  Script.complete();
  return;
}

const widget = new ListWidget();
const size = config.widgetFamily || "medium";
if (size === "small") buildSmall(widget, data);
else if (size === "large") buildLarge(widget, data);
else buildMedium(widget, data);

if (!config.runsInWidget) {
  // Scriptableアプリで開いたときはプレビュー表示
  widget.presentMedium();
}

Script.setWidget(widget);
Script.complete();
