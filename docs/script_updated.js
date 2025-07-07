document.addEventListener('DOMContentLoaded', () => {
  const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4', '005.mp4', '006.mp4', '007.mp4', '008.mp4', '009.mp4', '010.mp4', '011.mp4', '012.mp4', '013.mp4', '014.mp4', '015.mp4', '016.mp4', '017.mp4', '018.mp4', '019.mp4', '020.mp4', '021.mp4', '022.mp4', '023.mp4'];
  const mediaPanel = document.getElementById('mediaPanel');
  const timelineTrack = document.querySelector('.clip-track');
  const zoomToggle = document.getElementById('zoom-toggle');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');
  const previewVideo = document.getElementById('preview-video');
  const fullPreviewButton = document.getElementById('preview-play-all');
  const playFromStartButton = document.getElementById('preview-play-start');
  const playFromHeadButton = document.getElementById('preview-play-head');
  let isZoomed = false;

  const TIMELINE_DURATION = 40;
  const TIMELINE_WIDTH_FULL = TIMELINE_DURATION * 20;
  const TIMELINE_WIDTH_ZOOM = TIMELINE_DURATION * 100;

  let selectedClip = null;
  let currentPreviewIndex = 0;
  let playhead = document.createElement('div');
  playhead.className = 'playhead-line';
  timelineTrack.appendChild(playhead);

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

  function updateClipWidths() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      clip.style.width = `${duration * pixelsPerSecond()}px`;
    });
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
    const baseName = file.replace(/\\.[^/.]+$/, "");
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
      layoutRippleTimeline();
      updateTimelineView();
    });
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.timeline-clip').forEach(el => el.classList.remove('selected'));
    if (e.target.classList.contains('timeline-clip')) {
      selectedClip = e.target;
      selectedClip.classList.add('selected');
    } else {
      selectedClip = null;
    }
  });

  fullPreviewButton.addEventListener('click', () => {
    currentPreviewIndex = 0;
    playSequentially();
  });

  function playSequentially() {
    const clips = Array.from(document.querySelectorAll('.timeline-clip'));
    if (currentPreviewIndex >= clips.length) return;
    const clip = clips[currentPreviewIndex];
    const label = clip.querySelector('.clip-label').textContent;
    previewVideo.src = `media/${label}`;
    previewVideo.play();
    const left = parseFloat(clip.style.left || '0');
    playhead.style.left = `${left}px`;
    previewVideo.onended = () => {
      currentPreviewIndex++;
      playSequentially();
    };
  }

  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  updateTimelineView();
});