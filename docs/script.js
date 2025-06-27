// script.js

document.addEventListener('DOMContentLoaded', () => {
  const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4', '005.mp4', '006.mp4', '007.mp4', '008.mp4', '009.mp4', '010.mp4', '011.mp4', '012.mp4', '013.mp4', '014.mp4', '015.mp4', '016.mp4', '017.mp4', '018.mp4', '019.mp4', '020.mp4', '021.mp4', '022.mp4', '023.mp4'];
  const mediaPanel = document.getElementById('mediaPanel');
  const timelineTrack = document.querySelector('.clip-track');
  const zoomToggle = document.getElementById('zoom-toggle');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');
  const TIMELINE_WIDTH_FULL = 1000;
  const TIMELINE_WIDTH_ZOOM = 4000;
  let isZoomed = false;

  // ユーザー操作でiOS再生許可
  document.addEventListener('touchstart', () => {
    const audio = document.getElementById('voiceover-audio');
    if (audio && audio.paused) {
      audio.play().catch(() => {});
    }
  }, { once: true });

  // ピクセル/秒
  const pixelsPerSecond = () => (isZoomed ? 100 : 20);

  // メディアサムネイル生成
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
    video.addEventListener('loadedmetadata', () => video.currentTime = 0.1);

    const label = document.createElement('div');
    label.textContent = file;

    container.appendChild(video);
    container.appendChild(label);
    mediaPanel.appendChild(container);

    container.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', file);
    });
  });

  // ドロップ処理
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
      const clip = document.createElement('div');
      clip.className = 'timeline-clip';
      clip.dataset.in = 0;
      clip.dataset.out = duration;
      clip.dataset.duration = duration;

      const label = document.createElement('div');
      label.className = 'clip-label';
      label.textContent = fileName;

      const leftHandle = document.createElement('div');
      leftHandle.className = 'handle handle-left';
      const rightHandle = document.createElement('div');
      rightHandle.className = 'handle handle-right';

      setupHandleDrag(clip, leftHandle, 'left');
      setupHandleDrag(clip, rightHandle, 'right');

      clip.appendChild(leftHandle);
      clip.appendChild(label);
      clip.appendChild(rightHandle);

      timelineTrack.appendChild(clip);
      updateClipWidthsAndTimecode();
    });
  });

  // ハンドルドラッグ設定
  function setupHandleDrag(clip, handle, side) {
    let isDragging = false;

    handle.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      isDragging = true;
      const startX = e.clientX;
      const startIn = parseFloat(clip.dataset.in);
      const startOut = parseFloat(clip.dataset.out);
      const duration = parseFloat(clip.dataset.duration);
      const pps = pixelsPerSecond();

      function onPointerMove(e) {
        if (!isDragging) return;
        const deltaX = e.clientX - startX;
        const deltaSec = deltaX / pps;

        if (side === 'left') {
          const newIn = Math.max(0, Math.min(startOut - 0.1, startIn + deltaSec));
          clip.dataset.in = newIn.toFixed(2);
        } else {
          const newOut = Math.min(duration, Math.max(startIn + 0.1, startOut + deltaSec));
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

  function updateClipWidthsAndTimecode() {
    document.querySelectorAll('.timeline-clip').forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      clip.style.width = `${duration * pixelsPerSecond()}px`;
    });
    renderTimecodeBar(isZoomed ? TIMELINE_WIDTH_ZOOM : TIMELINE_WIDTH_FULL);
  }

  function renderTimecodeBar(width) {
    timecodeBar.innerHTML = '';
    const pps = pixelsPerSecond();
    const totalSeconds = Math.floor(width / pps);
    for (let i = 0; i <= totalSeconds; i++) {
      const label = document.createElement('div');
      label.className = 'timecode-label';
      label.textContent = `${i}s`;
      label.style.minWidth = `${pps}px`;
      timecodeBar.appendChild(label);
    }
  }

  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  function updateTimelineView() {
    const width = isZoomed ? TIMELINE_WIDTH_ZOOM : TIMELINE_WIDTH_FULL;
    timelineTrack.style.width = `${width}px`;
    waveformImg.style.width = `${width}px`;
    waveformImg.style.objectPosition = 'left';
    renderTimecodeBar(width);
    updateClipWidthsAndTimecode();
  }

  updateTimelineView();
});
