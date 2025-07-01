document.addEventListener('DOMContentLoaded', () => {
  const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4', '005.mp4', '006.mp4', '007.mp4', '008.mp4', '009.mp4', '010.mp4', '011.mp4', '012.mp4', '013.mp4', '014.mp4', '015.mp4', '016.mp4', '017.mp4', '018.mp4', '019.mp4', '020.mp4', '021.mp4', '022.mp4', '023.mp4'];
  const mediaPanel = document.getElementById('mediaPanel');
  const timelineTrack = document.querySelector('.clip-track');
  const zoomToggle = document.getElementById('zoom-toggle');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');
  const previewVideo = document.getElementById('preview-video');
  const fullPreviewButton = document.getElementById('preview-play-all');
  const downloadEDLButton = document.getElementById('download-edl');
  const playhead = document.getElementById('playhead');

  let isZoomed = false;
  let selectedClip = null;

  const TIMELINE_DURATION = 40;
  const TIMELINE_WIDTH_FULL = TIMELINE_DURATION * 20;
  const TIMELINE_WIDTH_ZOOM = TIMELINE_DURATION * 100;

  function pixelsPerSecond() {
    return isZoomed ? 100 : 20;
  }

  function updateClipWidths() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      clip.style.width = `${duration * pixelsPerSecond()}px`;
    });
  }

  function renderTimecodeBar(durationSeconds, pps) {
    timecodeBar.innerHTML = '';
    for (let i = 0; i <= durationSeconds; i++) {
      const label = document.createElement('div');
      label.className = 'timecode-label';
      label.textContent = `${i}s`;
      label.style.minWidth = `${pps}px`;
      timecodeBar.appendChild(label);
    }
  }

  function updateTimelineView() {
    const pps = pixelsPerSecond();
    const totalSeconds = 44;
    const totalWidth = totalSeconds * pps;

    timelineTrack.style.width = `${totalWidth}px`;
    waveformImg.style.width = `${totalWidth}px`;
    timecodeBar.style.width = `${totalWidth}px`;

    updateClipWidths();
    renderTimecodeBar(totalSeconds, pps);
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

  fullPreviewButton.addEventListener('click', () => {
    if (!mediaFiles.length) return;
    let currentIndex = 0;
    function playNext() {
      if (currentIndex >= mediaFiles.length) return;
      previewVideo.src = `media/${mediaFiles[currentIndex]}`;
      previewVideo.play();
      previewVideo.onended = () => {
        currentIndex++;
        playNext();
      };
    }
    playNext();
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
      clip.draggable = true;

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

      clip.append(leftHandle, rightHandle, label, deleteBtn);
      clip.addEventListener('click', () => {
        document.querySelectorAll('.timeline-clip.selected').forEach(el => el.classList.remove('selected'));
        clip.classList.add('selected');
        selectedClip = clip;
      });

      timelineTrack.appendChild(clip);
      setupHandleDrag(clip, leftHandle, 'left');
      setupHandleDrag(clip, rightHandle, 'right');
      layoutRippleTimeline();
      updateTimelineView();
    });
  });

  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  function exportEDL() {
    const clips = document.querySelectorAll('.timeline-clip');
    let edl = 'TITLE: MyTimeline\nFCM: NON-DROP FRAME\n\n';
    let timelineIn = 0;

    clips.forEach((clip, index) => {
      const reel = clip.querySelector('.clip-label').textContent.replace('.mp4', '');
      const inSec = parseFloat(clip.dataset.in);
      const outSec = parseFloat(clip.dataset.out);
      const duration = outSec - inSec;

      const timelineOut = timelineIn + duration;
      const toTimecode = s => {
        const hrs = Math.floor(s / 3600);
        const min = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        const frm = Math.floor((s % 1) * 30);
        return `${hrs.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}:${frm.toString().padStart(2, '0')}`;
      };

      edl += `${(index+1).toString().padStart(3, '0')}  ${reel}  V  C  ${toTimecode(inSec)} ${toTimecode(outSec)} ${toTimecode(timelineIn)} ${toTimecode(timelineOut)}\n`;
      timelineIn = timelineOut;
    });

    const blob = new Blob([edl], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'timeline.edl';
    a.click();
  }

  downloadEDLButton.addEventListener('click', exportEDL);

  function updatePlayhead() {
    const pps = pixelsPerSecond();
    const current = previewVideo.currentTime || 0;
    playhead.style.left = `${current * pps}px`;
  }

  previewVideo.addEventListener('timeupdate', updatePlayhead);
  previewVideo.addEventListener('ended', () => {
    playhead.style.left = `0px`;
  });
});
