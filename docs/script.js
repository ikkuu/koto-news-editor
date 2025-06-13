// JavaScriptはここに追加（今は空）
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