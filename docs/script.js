// === 動画素材ファイル名一覧 ===
const mediaFiles = [
  '001.mp4',
  '002.mp4',
  '003.mp4',
  '004.mp4'
];

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

// === タイムラインへのD&D ===
const timeline = document.querySelector('.clip-track');

if (timeline) {
  timeline.addEventListener('dragover', (e) => {
    e.preventDefault();
    timeline.style.borderColor = '#0f0'; // 視覚フィードバック
  });

  timeline.addEventListener('dragleave', () => {
    timeline.style.borderColor = '#666';
  });

  timeline.addEventListener('drop', (e) => {
    e.preventDefault();
    timeline.style.borderColor = '#666';
    const fileName = e.dataTransfer.getData('text/plain');
    console.log('Dropped file:', fileName);
    // あとで追加処理
  });
} else {
  console.warn('clip-track 要素が見つかりません');
}


// === タイムライン拡大・縮小制御 ===
const zoomToggle = document.getElementById('zoom-toggle');
let isZoomed = false;
const TIMELINE_WIDTH_FULL = 1000;
const TIMELINE_WIDTH_ZOOM = 5000;

zoomToggle.addEventListener('click', () => {
  isZoomed = !isZoomed;
  timeline.style.width = isZoomed ? `${TIMELINE_WIDTH_ZOOM}px` : `${TIMELINE_WIDTH_FULL}px`;
  if (typeof updateClipWidthsAndTimecode === 'function') {
    updateClipWidthsAndTimecode();
  }
});

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

// === 再生処理 ===
const previewVideo = document.getElementById('preview-video');
const voiceoverAudio = document.getElementById('voiceover-audio');
const playBtn = document.getElementById('play-timeline');
const timeOverlay = document.getElementById('timecode-overlay');

playBtn.addEventListener('click', () => {
  const clips = document.querySelectorAll('.timeline-clip');
  if (clips.length === 0) return;

  let currentIndex = 0;

  function playNextClip() {
    if (currentIndex >= clips.length) {
      voiceoverAudio.pause();
      return;
    }

    const clip = clips[currentIndex];
    const fileName = clip.querySelector('.clip-label').textContent.trim();
    const inTime = parseFloat(clip.dataset.in);
    const outTime = parseFloat(clip.dataset.out);

    previewVideo.src = `media/${fileName}`;
    previewVideo.currentTime = inTime;

    previewVideo.onloadedmetadata = () => {
      previewVideo.currentTime = inTime;
      previewVideo.play();

      previewVideo.addEventListener('timeupdate', function checkPlayback() {
        timeOverlay.textContent = formatTimecode(previewVideo.currentTime);
        if (previewVideo.currentTime >= outTime) {
          previewVideo.pause();
          previewVideo.removeEventListener('timeupdate', checkPlayback);
          currentIndex++;
          playNextClip();
        }
      });
    };
  }

  voiceoverAudio.currentTime = 0;
  voiceoverAudio.play();
  playNextClip();
});

// === タイムコードフォーマット関数 ===
function formatTimecode(t) {
  const minutes = Math.floor(t / 60).toString().padStart(2, '0');
  const seconds = Math.floor(t % 60).toString().padStart(2, '0');
  const decimal = Math.floor((t % 1) * 10);
  return `${minutes}:${seconds}.${decimal}`;
}

// === インアウト調整ハンドル処理 ===
function setupHandleDrag(clip, handle, side) {
  let isDragging = false;

  handle.addEventListener('mousedown', (e) => {
    e.preventDefault();
    isDragging = true;

    const startX = e.clientX;
    const startIn = parseFloat(clip.dataset.in);
    const startOut = parseFloat(clip.dataset.out);
    const duration = parseFloat(clip.dataset.duration);
    const pixelsPerSecond = isZoomed ? 100 : 20;

    function onMouseMove(moveEvent) {
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

    function onMouseUp() {
      isDragging = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });
}

// === 初期表示処理 ===
updateClipWidthsAndTimecode();
