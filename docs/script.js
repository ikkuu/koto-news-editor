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

// === タイムラインへのドラッグ&ドロップ設定 ===
const timeline = document.getElementById('timeline');

mediaPanel.addEventListener('dragstart', (e) => {
    if (e.target.closest('.media-item')) {
        const fileName = e.target.closest('.media-item').querySelector('div').textContent;
        e.dataTransfer.setData('text/plain', fileName);
    }
});

timeline.addEventListener('dragover', (e) => {
    e.preventDefault();
});

timeline.addEventListener('drop', async (e) => {
    e.preventDefault();
    const fileName = e.dataTransfer.getData('text/plain');

    const video = document.createElement('video');
    video.src = `media/${fileName}`;
    video.preload = 'metadata';
    video.muted = true;

    video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        const inPoint = 0;
        const outPoint = duration;
        const width = Math.max(duration * 10, 50);

        const clip = document.createElement('div');
        clip.className = 'timeline-clip';
        clip.dataset.in = inPoint;
        clip.dataset.out = outPoint;
        clip.dataset.duration = duration;

        const label = document.createElement('div');
        label.className = 'clip-label';
        label.textContent = fileName;

        clip.appendChild(label);
        timeline.appendChild(clip);
    });
});

// === タイムライン拡大・縮小制御 ===
const timelineContainer = document.getElementById('timeline');
const zoomToggle = document.getElementById('zoom-toggle');
const TIMELINE_WIDTH_FULL = 1000;
const TIMELINE_WIDTH_ZOOM = 5000;
let isZoomed = false;

zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    timelineContainer.style.width = isZoomed ? `${TIMELINE_WIDTH_ZOOM}px` : `${TIMELINE_WIDTH_FULL}px`;
    updateClipWidthsAndTimecode();
});

function updateClipWidthsAndTimecode() {
    const clips = document.querySelectorAll('.timeline-clip');
    const pixelsPerSecond = isZoomed ? 100 : 20;

    clips.forEach(clip => {
        const duration = parseFloat(clip.dataset.duration);
        clip.style.width = `${duration * pixelsPerSecond}px`;
    });

    renderTimecodeBar(60, pixelsPerSecond);
}

// === タイムコードバー生成 ===
function renderTimecodeBar(durationSeconds = 60, pixelsPerSecond = 20) {
    const timecodeBar = document.getElementById('timecode-bar');
    timecodeBar.innerHTML = '';

    for (let i = 0; i <= durationSeconds; i++) {
        const label = document.createElement('div');
        label.className = 'timecode-label';
        label.textContent = `${i}s`;
        label.style.minWidth = `${pixelsPerSecond}px`;
        timecodeBar.appendChild(label);
    }
}
renderTimecodeBar(60, 20);

// === タイムライン再生（in〜outのみ再生） ===
const preview = document.getElementById('preview-video');
const playBtn = document.getElementById('play-timeline');

playBtn.addEventListener('click', () => {
    const clips = document.querySelectorAll('.timeline-clip');
    if (clips.length === 0) return;

    let currentIndex = 0;

    function playNextClip() {
        if (currentIndex >= clips.length) return;

        const clip = clips[currentIndex];
        const fileName = clip.querySelector('.clip-label').textContent.trim();
        const inTime = parseFloat(clip.dataset.in) || 0;
        const outTime = parseFloat(clip.dataset.out) || 0;

        preview.src = `media/${fileName}`;
        preview.currentTime = inTime;

        preview.onloadedmetadata = () => {
            preview.currentTime = inTime;
            preview.play();

            const checkPlayback = () => {
                if (preview.currentTime >= outTime || preview.ended) {
                    preview.pause();
                    preview.removeEventListener('timeupdate', checkPlayback);
                    currentIndex++;
                    playNextClip();
                }
            };

            preview.addEventListener('timeupdate', checkPlayback);
        };
    }

    playNextClip();
});

// 初期表示調整
updateClipWidthsAndTimecode();
