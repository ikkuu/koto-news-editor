// script.js

document.addEventListener('DOMContentLoaded', () => {
  const mediaFiles = ['001.mp4', '002.mp4', '003.mp4', '004.mp4', '005.mp4', '006.mp4', '007.mp4', '008.mp4', '009.mp4', '010.mp4', '011.mp4', '012.mp4', '013.mp4', '014.mp4', '015.mp4', '016.mp4', '017.mp4', '018.mp4', '019.mp4', '020.mp4', '021.mp4', '022.mp4', '023.mp4'];
  const mediaPanel = document.getElementById('mediaPanel');
  const timelineTrack = document.querySelector('.clip-track');
  const zoomToggle = document.getElementById('zoom-toggle');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');
  const playhead = document.getElementById('playhead');
  const previewVideo = document.getElementById('preview-video');
  const fullPreviewButton = document.getElementById('preview-play-all');
let isZoomed = false;
function pixelsPerSecond() {
  return isZoomed ? 100 : 20;
}

  const TIMELINE_DURATION = 40; // ここで40秒を基準に
const TIMELINE_WIDTH_FULL = TIMELINE_DURATION * 20;
const TIMELINE_WIDTH_ZOOM = TIMELINE_DURATION * 100;

  // サムネ表示（画像）
 mediaFiles.forEach(file => {
  const container = document.createElement('div');
  container.className = 'media-item';
  container.draggable = true;

  const baseName = file.replace(/\.[^/.]+$/, ""); // ここで.mp4を取り除く
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


  // 素材フル再生
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

// 重複している dragover リスナーの明示的定義が抜けているため追加推奨
timelineTrack.addEventListener('dragover', e => e.preventDefault());
timelineTrack.addEventListener('dragenter', () => {
  timelineTrack.classList.add('dragover');
});
timelineTrack.addEventListener('dragleave', () => {
  timelineTrack.classList.remove('dragover');
});
timelineTrack.addEventListener('drop', (e) => {
  timelineTrack.classList.remove('dragover');
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

// リップル配置処理
function layoutRippleTimeline() {
  let offset = 0;
  const clips = document.querySelectorAll('.timeline-clip');
  clips.forEach(clip => {
    const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
    const width = duration * pixelsPerSecond();
    clip.style.left = `${offset}px`;
    offset += width + 4; // マージン4px
  });
}
 

  function updateClipWidths() {
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      clip.style.width = `${duration * pixelsPerSecond()}px`;
    });
  }

 function updateTimelineView() {
  const pixelsPerSecond = isZoomed ? 100 : 20;
  const totalSeconds = 44; // ここを waveform にあわせて 44秒に
  const totalWidth = pixelsPerSecond * totalSeconds;

  // 各要素に共通の幅を適用
  timelineTrack.style.width = `${totalWidth}px`;
  waveformImg.style.width = `${totalWidth}px`;
  timecodeBar.style.width = `${totalWidth}px`;

  // クリップ幅も更新
  const clips = document.querySelectorAll('.timeline-clip');
  clips.forEach(clip => {
    const duration = parseFloat(clip.dataset.duration) || 0;
    clip.style.width = `${duration * pixelsPerSecond}px`;
  });

  renderTimecodeBar(totalSeconds, pixelsPerSecond);
}



 function renderTimecodeBar(durationSeconds, pixelsPerSecond) {
  timecodeBar.innerHTML = '';
  for (let i = 0; i <= durationSeconds; i++) {
    const label = document.createElement('div');
    label.className = 'timecode-label';
    label.textContent = `${i}s`;
    label.style.minWidth = `${pixelsPerSecond}px`;
    timecodeBar.appendChild(label);
  }
}



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
        const deltaSeconds = deltaX / pps;
        if (side === 'left') {
          const newIn = Math.max(0, Math.min(startOut - 0.1, startIn + deltaSeconds));
          clip.dataset.in = newIn.toFixed(2);
        } else {
          const newOut = Math.min(duration, Math.max(startIn + 0.1, startOut + deltaSeconds));
          clip.dataset.out = newOut.toFixed(2);
        }
        updateClipWidths();
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

  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  updateTimelineView();
});

// Ripple editing and clip reordering logic (base functions)
document.addEventListener('DOMContentLoaded', () => {
  let selectedClip = null;

  // --- Clip selection ---
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('timeline-clip')) {
      document.querySelectorAll('.timeline-clip.selected').forEach(el => el.classList.remove('selected'));
      selectedClip = e.target;
      selectedClip.classList.add('selected');
    } else {
      document.querySelectorAll('.timeline-clip.selected').forEach(el => el.classList.remove('selected'));
      selectedClip = null;
    }
  });

  // --- Reorder clips (swap with previous/next) ---
  function swapClipPosition(direction) {
    if (!selectedClip) return;
    const clips = Array.from(document.querySelectorAll('.timeline-clip'));
    const index = clips.indexOf(selectedClip);
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= clips.length) return;
    const referenceNode = direction === 'left' ? clips[targetIndex] : clips[targetIndex].nextSibling;
    selectedClip.parentNode.insertBefore(selectedClip, referenceNode);
    layoutRippleTimeline();
  }

  // Optional: Buttons or key bindings to call swapClipPosition('left') / ('right')
  // e.g.
  // document.getElementById('swap-left').addEventListener('click', () => swapClipPosition('left'));

  // --- Adjust timeline after trimming a clip ---
  function layoutRippleTimeline() {
    let offset = 0;
    const clips = document.querySelectorAll('.timeline-clip');
    clips.forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      const width = duration * pixelsPerSecond();
      clip.style.left = `${offset}px`;
      offset += width + 4; // margin
    });
  }

  // --- Adjust ripple shift for handles ---
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
      const index = Array.from(document.querySelectorAll('.timeline-clip')).indexOf(clip);

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

  // Ensure existing clips and new ones use this logic
  // updateClipWidths() & pixelsPerSecond() must exist globally
});