document.addEventListener('DOMContentLoaded', () => {
  const mediaFiles = [...Array(23)].map((_, i) => `${String(i + 1).padStart(3, '0')}.mp4`);
  const mediaPanel = document.getElementById('mediaPanel');
  const timelineTrack = document.querySelector('.clip-track');
  const waveformImg = document.getElementById('waveform-img');
  const timecodeBar = document.getElementById('timecode-bar');
  const previewVideo = document.getElementById('preview-video');
  const voiceover = document.getElementById('voiceover-audio');
  const playhead = document.getElementById('playhead');
  const zoomToggle = document.getElementById('zoom-toggle');
  const playFromStart = document.getElementById('preview-from-start');
  const playFromHead = document.getElementById('preview-from-playhead');
  const edlExport = document.getElementById('export-edl');
  const fullPreviewButton = document.getElementById('preview-play-all');

  let isZoomed = false;
  let selectedClip = null;

  // === UIスケール関連 ===
  function pixelsPerSecond() {
    return isZoomed ? 100 : 20;
  }

  function updateTimelineView() {
    const pps = pixelsPerSecond();
    const width = pps * 44;
    [timelineTrack, waveformImg, timecodeBar].forEach(el => el.style.width = `${width}px`);
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

  // === サムネ表示 ===
  mediaFiles.forEach(file => {
    const container = document.createElement('div');
    container.className = 'media-item';
    container.draggable = true;

    const img = document.createElement('img');
    img.src = `media/${file.replace('.mp4', '.jpg')}`;
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

  // === タイムラインに追加 ===
 timelineTrack.addEventListener('dragenter', () => {
  timelineTrack.classList.add('dragover');
});

timelineTrack.addEventListener('dragover', (e) => {
  e.preventDefault();  // ← これでドロップ処理が有効になる
});

timelineTrack.addEventListener('dragleave', () => {
  timelineTrack.classList.remove('dragover');
});

timelineTrack.addEventListener('drop', e => {
  timelineTrack.classList.remove('dragover'); // ← ここに追記
  e.preventDefault();
  const file = e.dataTransfer.getData('text/plain');
  if (!file) return;

  const video = document.createElement('video');
  video.src = `media/${file}`;
  video.preload = 'metadata';
  video.muted = true;
  video.addEventListener('loadedmetadata', () => {
    const duration = video.duration;
    const clip = document.createElement('div');
    clip.className = 'timeline-clip';
    clip.dataset.in = 0;
    clip.dataset.out = duration;
    clip.dataset.duration = duration;

    clip.innerHTML = `
      <div class="handle handle-left"></div>
      <div class="handle handle-right"></div>
      <div class="clip-label">${file}</div>
      <button class="clip-delete">×</button>
    `;

    clip.querySelector('.clip-delete').addEventListener('click', () => {
      clip.remove();
      layoutRippleTimeline();
    });

    timelineTrack.appendChild(clip);
    setupHandleDrag(clip, clip.querySelector('.handle-left'), 'left');
    setupHandleDrag(clip, clip.querySelector('.handle-right'), 'right');
    layoutRippleTimeline();
  });
});


  // === レイアウト処理 ===
  function layoutRippleTimeline() {
    let offset = 0;
    document.querySelectorAll('.timeline-clip').forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      const width = duration * pixelsPerSecond();
      clip.style.left = `${offset}px`;
      clip.style.width = `${width}px`;
      offset += width + 4;
    });
  }

  function updateClipWidths() {
    document.querySelectorAll('.timeline-clip').forEach(clip => {
      const duration = parseFloat(clip.dataset.out) - parseFloat(clip.dataset.in);
      clip.style.width = `${duration * pixelsPerSecond()}px`;
    });
  }

  // === ハンドル操作 ===
  function setupHandleDrag(clip, handle, side) {
  let isDragging = false;
  let animationFrameId = null;

  handle.addEventListener('pointerdown', (e) => {
    if (!clip.classList.contains('selected')) return;
    e.preventDefault();
    isDragging = true;
 handle.classList.add('dragging');


 // スクロール無効化
    function disableScroll(e) {
      e.preventDefault();
    }
    document.body.addEventListener('touchmove', disableScroll, { passive: false });
    document.body.addEventListener('wheel', disableScroll, { passive: false });

    const startX = e.clientX;
    const startIn = parseFloat(clip.dataset.in);
    const startOut = parseFloat(clip.dataset.out);
    const duration = parseFloat(clip.dataset.duration);
    const pps = pixelsPerSecond();

    function updateDrag(currentX) {
      const deltaX = currentX - startX;

      // 小さな動きは無視
      if (Math.abs(deltaX) < 2) return;

      const deltaSeconds = (deltaX / pps) * 0.7;

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

    function onPointerMove(e) {
      if (!isDragging) return;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);

      const currentX = e.clientX;
      animationFrameId = requestAnimationFrame(() => updateDrag(currentX));
    }

    function onPointerUp() {
      isDragging = false;
 handle.classList.remove('dragging');

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    

    // スクロール許可
      document.body.removeEventListener('touchmove', disableScroll, { passive: false });
      document.body.removeEventListener('wheel', disableScroll, { passive: false });
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  });
}

  // === 選択状態 ===
  document.addEventListener('click', (e) => {
    document.querySelectorAll('.timeline-clip').forEach(c => c.classList.remove('selected'));
    const clip = e.target.closest('.timeline-clip');
    if (clip) {
      clip.classList.add('selected');
      selectedClip = clip;
    } else {
      selectedClip = null;
    }
  });

  // === ズーム切替 ===
  zoomToggle.addEventListener('click', () => {
    isZoomed = !isZoomed;
    updateTimelineView();
  });

  // === プレイヘッドから再生
  //     - 動画：プレイヘッド位置のクリップを inTime からスタート
  //     - ナレーション：タイムライン上の playhead 位置に対応する時刻からスタート
  // =================================================================== */
  playFromHead.addEventListener('click', () => {
    const playheadX = parseFloat(playhead.style.left) || 0;
    const pps = pixelsPerSecond();
    const playheadTime = playheadX / pps; // タイムライン上の経過秒数

    const clips = Array.from(document.querySelectorAll('.timeline-clip'));
    // playheadX 以降に始まるクリップ、または playheadX を内包するクリップを探す
    const target = clips.find(clip => {
      const left = parseFloat(clip.style.left) || 0;
      const width = parseFloat(clip.style.width) || 0;
      return left + width >= playheadX;
    });
    if (!target) {
      console.warn('[kotoedit] プレイヘッド位置にクリップがありません');
      return;
    }

    const label = target.querySelector('.clip-label').textContent;
    const inTime = parseFloat(target.dataset.in) || 0;
    const targetLeft = parseFloat(target.style.left) || 0;
    // プレイヘッドが対象クリップの途中にあれば、その分だけ inTime を進める
    const insideOffset = Math.max(0, (playheadX - targetLeft) / pps);
    const startInClip = inTime + insideOffset;

    // タイムライン再生モード（ナレーション連動）
    window.materialPreviewMode = false;

    // src 切替 → metadata 読み込み完了を待ってから currentTime セット & play
    previewVideo.src = `media/${label}`;
    previewVideo.load();

    const onMeta = () => {
      previewVideo.removeEventListener('loadedmetadata', onMeta);
      try { previewVideo.currentTime = startInClip; } catch (e) {}
      const p = previewVideo.play();
      if (p && p.catch) p.catch(() => {});
    };
    previewVideo.addEventListener('loadedmetadata', onMeta, { once: true });
    if (previewVideo.readyState >= 1) onMeta();

    // ナレーションはプレイヘッド位置に対応する時刻から
    try {
      const audioDur = isFinite(voiceover.duration) ? voiceover.duration : Infinity;
      voiceover.currentTime = Math.min(Math.max(0, playheadTime), audioDur);
    } catch (e) {}
    const ap = voiceover.play();
    if (ap && ap.catch) ap.catch(() => {});
  });

  // === 最初から再生（タイムラインを最初から、ナレーション連動） ===
  playFromStart.addEventListener('click', () => {
    const clips = Array.from(document.querySelectorAll('.timeline-clip'));
    if (clips.length === 0) return;
    let i = 0;

    window.materialPreviewMode = false;

    function playNext() {
      if (i >= clips.length) return;
      const clip = clips[i];
      const label = clip.querySelector('.clip-label').textContent;
      const inTime = parseFloat(clip.dataset.in) || 0;
      const outTime = parseFloat(clip.dataset.out) || 0;

      previewVideo.src = `media/${label}`;
      previewVideo.load();

      const onMeta = () => {
        previewVideo.removeEventListener('loadedmetadata', onMeta);
        try { previewVideo.currentTime = inTime; } catch (e) {}
        const p = previewVideo.play();
        if (p && p.catch) p.catch(() => {});
        playhead.style.left = clip.style.left;

        previewVideo.ontimeupdate = () => {
          if (previewVideo.currentTime >= outTime) {
            previewVideo.pause();
            i++;
            playNext();
          }
        };
      };
      previewVideo.addEventListener('loadedmetadata', onMeta, { once: true });
      if (previewVideo.readyState >= 1) onMeta();
    }

    voiceover.currentTime = 0;
    const ap = voiceover.play();
    if (ap && ap.catch) ap.catch(() => {});
    playNext();
  });

  // === 全素材連続再生（素材パネルの素材を順に全部再生。タイムライン非依存、ナレーションなし） ===
  fullPreviewButton.addEventListener('click', () => {
    const items = Array.from(document.querySelectorAll('.media-item'));
    if (items.length === 0) return;
    let i = 0;

    function getFileName(item) {
      const img = item.querySelector('img');
      if (img && img.alt) return img.alt;
      const labelDiv = item.querySelector('div');
      if (labelDiv) return labelDiv.textContent.trim();
      return null;
    }

    function playNext() {
      if (i >= items.length) {
        window.materialPreviewMode = false;
        return;
      }
      const item = items[i];
      const file = getFileName(item);
      if (!file) { i++; playNext(); return; }

      previewVideo.src = `media/${file}`;
      previewVideo.currentTime = 0;
      const p = previewVideo.play();
      if (p && p.catch) p.catch(() => {});

      previewVideo.onended = () => {
        i++;
        playNext();
      };
    }

    // 素材プレビューモードON：media-sync 側で audio を連動させないフラグ
    window.materialPreviewMode = true;
    voiceover.pause();
    voiceover.currentTime = 0;
    playNext();
  });


  // === EDL出力 ===
  edlExport.addEventListener('click', () => {
    const lines = [];
    document.querySelectorAll('.timeline-clip').forEach((clip, i) => {
      const file = clip.querySelector('.clip-label').textContent;
      const inTime = clip.dataset.in;
      const outTime = clip.dataset.out;
      lines.push(`${i + 1}  AX  V  C  ${inTime} ${outTime} ${inTime} ${outTime}`);
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.download = 'timeline.edl';
    link.href = URL.createObjectURL(blob);
    link.click();
  });

  updateTimelineView();
});
