// === 初期設定 ===
const TIMELINE_WIDTH_FULL = 1000;
const TIMELINE_WIDTH_ZOOM = 4000;
let isZoomed = false;

document.addEventListener('DOMContentLoaded', () => {
  const timeline = document.querySelector('.timeline');
  const zoomToggle = document.getElementById('zoom-toggle');

  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    timeline.style.width = isZoomed ? `${TIMELINE_WIDTH_ZOOM}px` : `${TIMELINE_WIDTH_FULL}px`;
    syncWaveformWidthWithTimeline();
    updateClipWidthsAndTimecode();
  });

  renderTimecodeBar(40, isZoomed ? 100 : 20);
  updateClipWidthsAndTimecode();
  syncWaveformWidthWithTimeline();
});

// === waveform画像の横幅をタイムラインに同期 ===
function syncWaveformWidthWithTimeline() {
  const waveformImg = document.getElementById('waveform-img');
  const durationInSeconds = 40;
  const pixelsPerSecond = isZoomed ? 100 : 20;
  const expectedWidth = durationInSeconds * pixelsPerSecond;

  if (waveformImg) {
    waveformImg.style.width = `${expectedWidth}px`;
    waveformImg.style.left = '0px';
  }
}

// === タイムコードバーを描画 ===
function renderTimecodeBar(durationSeconds = 40, pixelsPerSecond = 20) {
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

// === クリップ幅とタイムコード更新 ===
function updateClipWidthsAndTimecode() {
  const clips = document.querySelectorAll('.timeline-clip');
  const pixelsPerSecond = isZoomed ? 100 : 20;

  clips.forEach(clip => {
    const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
    clip.style.width = `${duration * pixelsPerSecond}px`;
  });

  renderTimecodeBar(40, pixelsPerSecond);
}