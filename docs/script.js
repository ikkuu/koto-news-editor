// === 素材ファイル一覧 ===
const mediaFiles = [
    '001.mp4',
    '002.mp4',
    '003.mp4',
    '004.mp4'
    // 追加するだけで自動反映
];

// === 素材パネルに動画を表示 ===
const mediaPanel = document.getElementById('mediaPanel');

mediaFiles.forEach(file => {
    const container = document.createElement('div');
    container.className = 'media-item';
    container.draggable = true;

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

// === タイムラインへのドラッグ＆ドロップ ===
const timeline = document.getElementById('timeline');

// ドラッグ開始
mediaPanel.addEventListener('dragstart', (e) => {
    if (e.target.closest('.media-item')) {
        const fileName = e.target.closest('.media-item').querySelector('div').textContent;
        e.dataTransfer.setData('text/plain', fileName);
    }
});

// ドラッグオーバー許可
timeline.addEventListener('dragover', (e) => {
    e.preventDefault();
});

// ドロップされた時にタイムラインに素材を追加
timeline.addEventListener('drop', (e) => {
    e.preventDefault();
    const fileName = e.dataTransfer.getData('text/plain');

    const video = document.createElement('video');
    video.src = `media/${fileName}`;
    video.preload = 'metadata';
    video.muted = true;

    video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        const width = Math.max(duration * 10, 50); // 仮：10px/秒

        const clip = document.createElement('div');
        clip.className = 'timeline-clip';
        clip.textContent = fileName;
        clip.dataset.duration = duration.toFixed(2);
        clip.style.width = `${width}px`;

        const clipTrack = document.querySelector('.clip-track');
        clipTrack.appendChild(clip);
    });
});

// === プレビュー再生制御 ===
const preview = document.getElementById('preview-video');
const playBtn = document.getElementById('play-timeline');

playBtn.addEventListener('click', () => {
    const clips = document.querySelectorAll('.timeline-clip');
    const fileList = Array.from(clips).map(clip => clip.textContent.trim());

    if (fileList.length === 0) return;

    let currentIndex = 0;

    function playNext() {
        if (currentIndex >= fileList.length) return;

        const file = fileList[currentIndex];
        preview.src = `media/${file}`;
        preview.play();

        preview.onended = () => {
            currentIndex++;
            playNext();
        };
    }

    playNext();
});

// === プレイヘッドとズーム制御（ベース） ===
const timelineContainer = document.getElementById('timeline');
const playhead = document.getElementById('playhead');
const zoomToggle = document.getElementById('zoom-toggle');

const TIMELINE_WIDTH_FULL = 1000;
const TIMELINE_WIDTH_ZOOM = 5000;
let isZoomed = false;

zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    timelineContainer.style.width = isZoomed ? `${TIMELINE_WIDTH_ZOOM}px` : `${TIMELINE_WIDTH_FULL}px`;
    updateClipWidths();
});

function updateClipWidths() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(clip => {
        const duration = parseFloat(clip.dataset.duration);
        const pixelsPerSecond = isZoomed ? 100 : 20;
        clip.style.width = `${duration * pixelsPerSecond}px`;
    });
}

// 再生バー（プレイヘッド）同期
preview.addEventListener('timeupdate', () => {
    const duration = preview.duration;
    const currentTime = preview.currentTime;
    const percentage = currentTime / duration;
    const timelineWidth = isZoomed ? TIMELINE_WIDTH_ZOOM : TIMELINE_WIDTH_FULL;
    playhead.style.left = `${percentage * timelineWidth}px`;
});
