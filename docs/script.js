// === 動画素材ファイル名一覧 ===
const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4'];
const mediaPanel = document.getElementById('mediaPanel');

// === 素材一覧の表示 ===
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

// === タイムラインへのD&D設定 ===
const timeline = document.getElementById('timeline');

mediaPanel.addEventListener('dragstart', (e) => {
    const target = e.target.closest('.media-item');
    if (target) {
        const fileName = target.querySelector('div').textContent;
        e.dataTransfer.setData('text/plain', fileName);
    }
});

timeline.addEventListener('dragover', (e) => e.preventDefault());

timeline.addEventListener('drop', (e) => {
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
        updateClipWidthsAndTimecode();
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

// === タイムコードバー ===
function renderTimecodeBar(durationSeconds = 60, pixelsPerSecond = 20) {
    const timecodeBar = document.getElementById('timecode-bar');
    if (!timecodeBar) return;

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

// === プレビュー & 音声再生制御 ===
const previewVideo = document.getElementById('preview-video');
const voiceoverAudio = document.getElementById('voiceover-audio');
const playBtn = document.getElementById('play-timeline');

playBtn.addEventListener('click', () => {
    const clips = document.querySelectorAll('.timeline-clip');
    if (clips.length === 0) return;

    let currentIndex = 0;

    function playNextClip() {
        if (currentIndex >= clips.length) {
            previewVideo.pause();
            voiceoverAudio.pause();
            return;
        }

        const clip = clips[currentIndex];
        const fileName = clip.querySelector('.clip-label').textContent.trim();
        const inTime = parseFloat(clip.dataset.in) || 0;
        const outTime = parseFloat(clip.dataset.out) || 0;

        previewVideo.src = `media/${fileName}`;
        previewVideo.currentTime = inTime;
        voiceoverAudio.currentTime = inTime;

        previewVideo.onloadedmetadata = () => {
            previewVideo.play();
            voiceoverAudio.play();

            const checkPlayback = () => {
                if (previewVideo.currentTime >= outTime || previewVideo.ended) {
                    previewVideo.pause();
                    voiceoverAudio.pause();
                    previewVideo.removeEventListener('timeupdate', checkPlayback);
                    currentIndex++;
                    playNextClip();
                }
            };

            previewVideo.addEventListener('timeupdate', () => {
                const diff = Math.abs(previewVideo.currentTime - voiceoverAudio.currentTime);
                if (diff > 0.1) {
                    voiceoverAudio.currentTime = previewVideo.currentTime;
                }
            });

            previewVideo.addEventListener('timeupdate', checkPlayback);
        };
    }

    playNextClip();
});

// === 初期化 ===
updateClipWidthsAndTimecode();

const timeOverlay = document.getElementById('timecode-overlay');
const previewVideo = document.getElementById('preview-video');

previewVideo.addEventListener('timeupdate', () => {
    const t = previewVideo.currentTime;
    const minutes = Math.floor(t / 60).toString().padStart(2, '0');
    const seconds = Math.floor(t % 60).toString().padStart(2, '0');
    const decimal = Math.floor((t % 1) * 10);
    timeOverlay.textContent = `${minutes}:${seconds}.${decimal}`;
});
