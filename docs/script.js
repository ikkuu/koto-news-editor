// script.js（完全修正版）

// === 動画素材ファイル名一覧 ===
const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4'];

// === メディアパネルに素材を表示 ===
const mediaPanel = document.getElementById('mediaPanel');

mediaFiles.forEach(file => {
  const container = document.createElement('div');
  container.className = 'media-item';
  container.draggable = true;

  const video = document.createElement('video');
  video.src = `media/${file}`;
  video.muted = true;
  video.autoplay = true;
  video.preload = 'metadata';
  video.width = 160;
  video.height = 90;

  video.addEventListener('loadedmetadata', () => {
    video.currentTime = 0.1; // サムネイル表示用
  });

  const label = document.createElement('div');
  label.textContent = file;

  container.appendChild(video);
  container.appendChild(label);
  mediaPanel.appendChild(container);

  container.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', file);
  });
});

const timelineTrack = document.querySelector('.clip-track');
const timeline = document.querySelector('.timeline');
const zoomToggle = document.getElementById('zoom-toggle');
const previewVideo = document.getElementById('preview-video');
const voiceoverAudio = document.getElementById('voiceover-audio');
const playBtn = document.getElementById('play-timeline');
const timeOverlay = document.getElementById('timecode-overlay');

let isZoomed = false;
const TIMELINE_WIDTH_FULL = 1000;
const TIMELINE_WIDTH_ZOOM = 5000;

// === タイムライン拡大・縮小制御 ===
zoomToggle.addEventListener('click', () => {
  isZoomed = !isZoomed;
  timeline.style.width = isZoomed ? `${TIMELINE_WIDTH_ZOOM}px` : `${TIMELINE_WIDTH_FULL}px`;
  updateClipWidthsAndTimecode();
});

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


function formatTimecode(t) {
  const minutes = Math.floor(t / 60).toString().padStart(2, '0');
  const seconds = Math.floor(t % 60).toString().padStart(2, '0');
  const decimal = Math.floor((t % 1) * 10);
  return `${minutes}:${seconds}.${decimal}`;
}

// === インアウト調整ハンドル処理 ===
function setupHandleDrag(clip, handle, side) {
  let isDragging = false;

  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    isDragging = true;

    const startX = e.clientX;
    const startIn = parseFloat(clip.dataset.in);
    const startOut = parseFloat(clip.dataset.out);
    const duration = parseFloat(clip.dataset.duration);
    const pixelsPerSecond = isZoomed ? 100 : 20;

    function onPointerMove(moveEvent) {
      if (!isDragging) return;
      const deltaX = moveEvent.clientX - startX;
      const deltaSeconds = deltaX / pixelsPerSecond;

      if (side === 'left') {
        const newIn = Math.max(0, Math.min(startOut - 0.1, startIn + deltaSeconds));
        clip.dataset.in = newIn.toFixed(2);
      } else {
        const newOut = Math.min(duration, Math.max(startIn + 0.1, startOut + deltaSeconds));
        clip.dataset.out = newOut.toFixed(2);
      }

      updateClipWidthsAndTimecode();
    }

    function onPointerUp() {
      isDragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  });
}

// === クリップ幅とタイムコードバー更新 ===
function updateClipWidthsAndTimecode() {
  const clips = document.querySelectorAll('.timeline-clip');
  const pixelsPerSecond = isZoomed ? 100 : 20;

  clips.forEach(clip => {
    const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
    clip.style.width = `${duration * pixelsPerSecond}px`;
  });

  renderTimecodeBar(60, pixelsPerSecond);
}

// === 初期表示処理 ===
updateClipWidthsAndTimecode();
renderTimecodeBar(60, 20);

timelineTrack.addEventListener('dragover', (e) => e.preventDefault());

timelineTrack.addEventListener('drop', (e) => {
  e.preventDefault();
  const fileName = e.dataTransfer.getData('text/plain');
  if (!fileName) return;

  const video = document.createElement('video');
  video.src = `media/${fileName}`;
  video.preload = 'metadata';
  video.muted = true;

  video.addEventListener('loadedmetadata', () => {
    const duration = video.duration;
    const inPoint = 0;
    const outPoint = duration;

    const clip = document.createElement('div');
    clip.className = 'timeline-clip';
    clip.dataset.in = inPoint;
    clip.dataset.out = outPoint;
    clip.dataset.duration = duration;

    const label = document.createElement('div');
    label.className = 'clip-label';
    label.textContent = fileName;

    const leftHandle = document.createElement('div');
    leftHandle.className = 'handle handle-left';
    const rightHandle = document.createElement('div');
    rightHandle.className = 'handle handle-right';

    clip.appendChild(leftHandle);
    clip.appendChild(rightHandle);
    clip.appendChild(label);

    const pixelsPerSecond = isZoomed ? 100 : 20;
    const width = Math.max(duration * pixelsPerSecond, 50);
    clip.style.width = `${width}px`;

    timelineTrack.appendChild(clip);

    setupHandleDrag(clip, leftHandle, 'left');
    setupHandleDrag(clip, rightHandle, 'right');

    updateClipWidthsAndTimecode();
  });
});
