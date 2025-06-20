// script.js

// === 動画素材ファイル名一覧 ===
const mediaFiles = [
    '001.mp4',
    '002.mp4',
    '003.mp4',
    '004.mp4'
    // 今後もここに追加するだけでOK
];

// === メディアパネルに素材を表示 ===
const mediaPanel = document.getElementById('mediaPanel');

mediaFiles.forEach(file => {
    const container = document.createElement('div');
    container.className = 'media-item';
    container.draggable = true; // タイムラインへのD&D用

    const video = document.createElement('video');
    video.src = `media/${file}`;
    video.muted = true;
    video.preload = 'metadata';
    video.width = 160;
    video.height = 90;

    const label = document.createElement('div');
    label.textContent = file;

    container.appendChild(video);
    container.appendChild(label);
    mediaPanel.appendChild(container);
});

// === 今後の拡張予定 ===

// - タイムラインへのドロップイベント
const timeline = document.getElementById('timeline');

// ドラッグ開始時に素材名をデータとして持たせる
mediaPanel.addEventListener('dragstart', (e) => {
    if (e.target.closest('.media-item')) {
        const fileName = e.target.closest('.media-item').querySelector('div').textContent;
        e.dataTransfer.setData('text/plain', fileName);
    }
});

// タイムライン上でドロップを許可
timeline.addEventListener('dragover', (e) => {
    e.preventDefault();
});

// タイムラインにドロップされた時の処理
timeline.addEventListener('drop', async (e) => {
    e.preventDefault();
    const fileName = e.dataTransfer.getData('text/plain');

    const video = document.createElement('video');
    video.src = `media/${fileName}`;
    video.preload = 'metadata';
    video.muted = true;

    // 尺（duration）取得して横幅を決める
    video.addEventListener('loadedmetadata', () => {
        const duration = video.duration; // 秒
        const width = Math.max(duration * 10, 50); // 仮のスケール 10px/sec、最小幅50px

        const clip = document.createElement('div');
        clip.className = 'timeline-clip';
        clip.textContent = fileName;
        clip.style.width = `${width}px`;

        timeline.appendChild(clip);
    });
});

// - ドロップされた素材の尺を取得し、横幅に比例表示
// - イン・アウト調整可能なトリミングバー

// 必要に応じて、タイムライン用要素取得やドロップ処理などをこの下に追加していく予定

// タイムラインの表示制御と再生インジケーターの同期スクリプト（基本構造）

const timelineContainer = document.getElementById('timeline');
const monitorVideo = document.getElementById('video-monitor');
const playhead = document.getElementById('playhead'); // 再生位置を示すバー
const timelineClips = document.querySelectorAll('.timeline-clip');
const zoomToggle = document.getElementById('zoom-toggle');

// タイムライン全体の幅（ピクセル）
const TIMELINE_WIDTH_FULL = 1000; // 全体表示
const TIMELINE_WIDTH_ZOOM = 5000; // 拡大表示（スクロールあり）

let isZoomed = false;

// タイムライン表示切替
zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    timelineContainer.style.width = isZoomed ? `${TIMELINE_WIDTH_ZOOM}px` : `${TIMELINE_WIDTH_FULL}px`;
    updateClipWidths();
});

// クリップの横幅を動画の時間に応じて調整（仮に1秒=100pxとする）
function updateClipWidths() {
    timelineClips.forEach(clip => {
        const duration = parseFloat(clip.dataset.duration); // 例: data-duration="2.5"
        const pixelsPerSecond = isZoomed ? 100 : 20; // 拡大時と通常時でピクセル幅変更
        clip.style.width = `${duration * pixelsPerSecond}px`;
    });
}

// 動画の再生位置とタイムライン上の再生バーを同期
monitorVideo.addEventListener('timeupdate', () => {
    const duration = monitorVideo.duration;
    const currentTime = monitorVideo.currentTime;
    const percentage = currentTime / duration;
    const timelineWidth = isZoomed ? TIMELINE_WIDTH_ZOOM : TIMELINE_WIDTH_FULL;
    playhead.style.left = `${percentage * timelineWidth}px`;
});

// 初期実行
updateClipWidths();