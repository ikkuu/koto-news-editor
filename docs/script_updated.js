document.addEventListener('DOMContentLoaded', () => {
  const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4', '005.mp4',
    '006.mp4', '007.mp4', '008.mp4', '009.mp4', '010.mp4',
    '011.mp4', '012.mp4', '013.mp4', '014.mp4', '015.mp4',
    '016.mp4', '017.mp4', '018.mp4', '019.mp4', '020.mp4',
    '021.mp4', '022.mp4', '023.mp4'
];
  const mediaPanel = document.getElementById('mediaPanel');
  const timelineTrack = document.querySelector('.clip-track');
  const zoomToggle = document.getElementById('zoom-toggle');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');
  const previewVideo = document.getElementById('preview-video');
  const voiceoverAudio = document.getElementById('voiceover-audio');
  const fullPreviewButton = document.getElementById('preview-play-all');
  const playFromStartBtn = document.getElementById('preview-from-start');
  const playFromHeadBtn = document.getElementById('preview-from-playhead');
  const playhead = document.getElementById('playhead');

  let isZoomed = false;
  let isPlayingFromHead = false;
  let selectedClip = null;

  function pixelsPerSecond() {
    return isZoomed ? 100 : 20;
  }

  function updateTimelineView() {
    const pps = pixelsPerSecond();
    const width = pps * 44;
    timelineTrack.style.width = `${width}px`;
    waveformImg.style.width = `${width}px`;
    timecodeBar.style.width = `${width}px`;
    renderTimecodeBar(44, pps);
    updateClipWidths();
  }

  function renderTimecodeBar(duration, pps) {
    timecodeBar.innerHTML = '';
    for (let i = 0; i <= duration; i++) {
      const label = document.createElement('div');
      label.className = 'timecode-label';
      label.textContent = `${i}s`;
      label.style.minWidth = `${pps}px`;
      timecodeBar.appendChild(label);
    }
  }

  function updateClipWidths() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      clip.style.width = `${duration * pixelsPerSecond()}px`;
    });
  }

  function layoutRippleTimeline() {
    let offset = 0;
    document.querySelectorAll('.timeline-clip').forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      const width = duration * pixelsPerSecond();
      clip.style.left = `${offset}px`;
      offset += width + 4;
    });
  }

  mediaFiles.forEach(file => {
    const container = document.createElement('div');
    container.className = 'media-item';
    container.draggable = true;

    const baseName = file.replace(/\.[^/.]+$/, "");
    const img = document.createElement('img');
    img.src = `media/${baseName}.jpg`;
    img.alt = file;

    const label = document.createElement('div');
    label.textContent = file;

    container.appendChild(img);
    container.appendChild(label);
    mediaPanel.appendChild(container);

    container.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', file);
    });
  });

  timelineTrack.addEventListener('dragover', e => e.preventDefault());

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

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'clip-delete';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => {
        clip.remove();
        layoutRippleTimeline();
      });

      clip.appendChild(leftHandle);
      clip.appendChild(rightHandle);
      clip.appendChild(label);
      clip.appendChild(deleteBtn);
      timelineTrack.appendChild(clip);
      setupHandleDrag(clip, leftHandle, 'left');
      setupHandleDrag(clip, rightHandle, 'right');
      layoutRippleTimeline();
      updateTimelineView();
    });
  });

  function setupHandleDrag(clip, handle, side) {
    let isDragging = false;
    handle.addEventListener('pointerdown', (e) => {
      if (!clip.classList.contains('selected')) return;
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
        const deltaSeconds = deltaX / pps;
        if (side === 'left') {
          const newIn = Math.max(0, Math.min(startOut - 0.1, startIn + deltaSeconds));
          clip.dataset.in = newIn.toFixed(2);
        } else {
          const newOut = Math.min(duration, Math.max(startIn + 0.1, startOut + deltaSeconds));
          clip.dataset.out = newOut.toFixed(2);
        }
        updateClipWidths();
        layoutRippleTimeline();
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

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.timeline-clip').forEach(el => el.classList.remove('selected'));
    if (e.target.classList.contains('timeline-clip')) {
      selectedClip = e.target;
      selectedClip.classList.add('selected');
    } else {
      selectedClip = null;
    }
  });

  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  playFromStartBtn.addEventListener('click', () => {
    previewVideo.currentTime = 0;
    voiceoverAudio.currentTime = 0;
    previewVideo.play();
    voiceoverAudio.play();
  });

  playFromHeadBtn.addEventListener('click', () => {
    if (!isPlayingFromHead) {
      const currentLeft = parseFloat(playhead.style.left || '0');
      const seconds = currentLeft / pixelsPerSecond();
      previewVideo.currentTime = seconds;
      voiceoverAudio.currentTime = seconds;
      previewVideo.play();
      voiceoverAudio.play();
      isPlayingFromHead = true;
      playFromHeadBtn.innerHTML = '⏸ 一時停止';
    } else {
      previewVideo.pause();
      voiceoverAudio.pause();
      isPlayingFromHead = false;
      playFromHeadBtn.innerHTML = '▶ プレイヘッドから再生';
    }
  });

  updateTimelineView();
});
