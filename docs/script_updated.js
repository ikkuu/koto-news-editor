document.addEventListener('DOMContentLoaded', () => {
  const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4', '005.mp4', '006.mp4', '007.mp4', '008.mp4', '009.mp4', '010.mp4', '011.mp4', '012.mp4', '013.mp4', '014.mp4', '015.mp4', '016.mp4', '017.mp4', '018.mp4', '019.mp4', '020.mp4', '021.mp4', '022.mp4', '023.mp4'];
  const mediaPanel = document.getElementById('mediaPanel');
  const timelineTrack = document.querySelector('.clip-track');
  const zoomToggle = document.getElementById('zoom-toggle');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');
  const previewVideo = document.getElementById('preview-video');
  const fullPreviewButton = document.getElementById('preview-play-all');
  const playFromStartButton = document.getElementById('preview-from-start');
  const playFromHeadButton = document.getElementById('preview-from-playhead');
  const exportEDLButton = document.getElementById('export-edl');
  let isZoomed = false;
  let selectedClip = null;
  let playhead = document.getElementById('playhead');

  const TIMELINE_DURATION = 40;
  const TIMELINE_WIDTH_FULL = TIMELINE_DURATION * 20;
  const TIMELINE_WIDTH_ZOOM = TIMELINE_DURATION * 100;

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

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.timeline-clip').forEach(el => el.classList.remove('selected'));
    if (e.target.closest('.timeline-clip')) {
      selectedClip = e.target.closest('.timeline-clip');
      selectedClip.classList.add('selected');
    } else {
      selectedClip = null;
    }
  });

  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  fullPreviewButton.addEventListener('click', () => {
    const clips = Array.from(document.querySelectorAll('.timeline-clip'));
    let index = 0;
    function playNext() {
      if (index >= clips.length) return;
      const label = clips[index].querySelector('.clip-label').textContent;
      previewVideo.src = `media/${label}`;
      previewVideo.play();
      const left = parseFloat(clips[index].style.left || '0');
      playhead.style.left = `${left}px`;
      previewVideo.onended = () => {
        index++;
        playNext();
      };
    }
    playNext();
  });

  playFromStartButton?.addEventListener('click', () => {
    previewVideo.currentTime = 0;
    previewVideo.play();
  });

  playFromHeadButton?.addEventListener('click', () => {
    const left = parseFloat(playhead.style.left || '0');
    const time = left / pixelsPerSecond();
    previewVideo.currentTime = time;
    previewVideo.play();
  });

  exportEDLButton?.addEventListener('click', () => {
    const clips = document.querySelectorAll('.timeline-clip');
    let edl = 'TITLE: Simple Edit\nFCM: NON-DROP FRAME\n\n';
    let startTime = 0;
    clips.forEach((clip, index) => {
      const inSec = parseFloat(clip.dataset.in).toFixed(2);
      const outSec = parseFloat(clip.dataset.out).toFixed(2);
      const duration = (parseFloat(outSec) - parseFloat(inSec)).toFixed(2);
      const source = clip.querySelector('.clip-label').textContent;
      edl += `${String(index + 1).padStart(3, '0')}  AX       V     C        \n`;
      edl += `* FROM CLIP: ${source}\n`;
      edl += `* SOURCE IN: ${inSec}s\n`;
      edl += `* SOURCE OUT: ${outSec}s\n`;
      edl += `* START: ${startTime.toFixed(2)}s\n`;
      edl += `* END: ${(parseFloat(startTime) + parseFloat(duration)).toFixed(2)}s\n\n`;
      startTime += parseFloat(duration);
    });

    const blob = new Blob([edl], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edit.edl';
    a.click();
    URL.revokeObjectURL(url);
  });

  updateTimelineView();
});
