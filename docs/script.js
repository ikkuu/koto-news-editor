document.addEventListener('DOMContentLoaded', () => {
  // === 動画素材ファイル名一覧 ===
  const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4'];
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
      video.currentTime = 0.1;
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
  let isZoomed = false;
  const zoomToggle = document.getElementById('zoom-toggle');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');

  const TIMELINE_WIDTH_FULL = 1000;
  const TIMELINE_WIDTH_ZOOM = 4000;

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

      clip.appendChild(label);
      timelineTrack.appendChild(clip);

      updateTimelineView();
    });
  });

  // タイムライン幅更新
  function updateTimelineView() {
    const width = isZoomed ? TIMELINE_WIDTH_ZOOM : TIMELINE_WIDTH_FULL;
    timelineTrack.style.width = `${width}px`;
    waveformImg.style.width = `${width}px`;
    renderTimecodeBar(width);
  }

  // タイムコード生成
  function renderTimecodeBar(width) {
    timecodeBar.innerHTML = '';
    const pixelsPerSecond = isZoomed ? 100 : 20;
    const totalSeconds = Math.floor(width / pixelsPerSecond);

    for (let i = 0; i <= totalSeconds; i++) {
      const label = document.createElement('div');
      label.className = 'timecode-label';
      label.textContent = `${i}s`;
      label.style.minWidth = `${pixelsPerSecond}px`;
      timecodeBar.appendChild(label);
    }
  }

  // ズーム切り替え
  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  // 初期表示
  updateTimelineView();
});
