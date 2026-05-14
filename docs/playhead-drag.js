/* ============================================================
   kotoedit Playhead Drag
   ------------------------------------------------------------
   役割：
   - タイムライン上で playhead（再生位置インジケータ）をドラッグして
     好きな位置へ移動できるようにする。
   - マウス／タッチ両対応（pointerdown/move/up）。
   - clip-track 上の空き領域をクリックしてもプレイヘッドが移動する。
   - 移動後、style.left をピクセル単位で反映し、既存JSの
     pixelsPerSecond と整合する形にする。
   ============================================================ */

(function () {
  'use strict';

  function init() {
    const playhead = document.getElementById('playhead');
    const timeline = document.querySelector('.timeline');
    const clipTrack = document.querySelector('.clip-track');
    if (!playhead || !timeline || !clipTrack) {
      console.warn('[kotoedit] playhead-drag: 必要な要素が見つかりません');
      return;
    }

    /* スマホ判定（タッチ環境ならヒット領域を拡張） */
    const isTouch = matchMedia('(hover: none) and (pointer: coarse)').matches;
    const hitW = isTouch ? 36 : 22;
    const headW = isTouch ? 28 : 18;
    const headH = isTouch ? 22 : 14;

    /* プレイヘッドを操作可能にする：見た目とポインタ */
    playhead.style.pointerEvents = 'auto';
    playhead.style.cursor = 'ew-resize';
    playhead.style.touchAction = 'none';

    /* つかみ領域を広げるための透明な hit area を生成 */
    const hitArea = document.createElement('div');
    hitArea.className = 'playhead-hit';
    hitArea.style.cssText = `
      position: absolute;
      top: 0;
      bottom: 0;
      left: ${-Math.floor(hitW / 2)}px;
      width: ${hitW}px;
      cursor: ew-resize;
      z-index: 21;
      background: transparent;
      touch-action: none;
    `;
    playhead.appendChild(hitArea);

    /* プレイヘッド上部の三角頭をもう少し見やすくする透明バー */
    const headGrab = document.createElement('div');
    headGrab.className = 'playhead-grab';
    headGrab.style.cssText = `
      position: absolute;
      top: -4px;
      left: ${-Math.floor(headW / 2)}px;
      width: ${headW}px;
      height: ${headH}px;
      cursor: ew-resize;
      z-index: 22;
      background: transparent;
      touch-action: none;
    `;
    playhead.appendChild(headGrab);

    /* clip-track 内での位置から playhead を移動 */
    function setPlayheadAtClientX(clientX) {
      const rect = clipTrack.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      playhead.style.left = `${x}px`;
    }

    /* ドラッグ処理 */
    let dragging = false;

    function onPointerDown(e) {
      dragging = true;
      e.preventDefault();
      e.stopPropagation();
      // ポインタを掴んだ要素に固定（タイムラインの横スクロールを抑止）
      try { e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      // 即座に位置反映（タップで「ここに移動」も同時に実現）
      setPlayheadAtClientX(e.clientX);
      // タッチスクロール抑制（フォールバック）
      document.body.style.touchAction = 'none';
    }

    function onPointerMove(e) {
      if (!dragging) return;
      e.preventDefault();
      setPlayheadAtClientX(e.clientX);
    }

    function onPointerUp(e) {
      if (!dragging) return;
      dragging = false;
      try { hitArea.releasePointerCapture && hitArea.releasePointerCapture(e.pointerId); } catch (_) {}
      document.body.style.touchAction = '';
    }

    /* playhead 本体 / hitArea / headGrab すべてに対して pointerdown を受ける */
    [playhead, hitArea, headGrab].forEach((el) => {
      el.addEventListener('pointerdown', onPointerDown);
    });
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    /* clip-track の空き部分（クリップ以外）をクリックしても移動 */
    clipTrack.addEventListener('pointerdown', (e) => {
      // クリップ本体やハンドル上ならスキップ（既存ドラッグ処理を優先）
      const onClip = e.target.closest('.timeline-clip, .handle, .clip-delete');
      if (onClip) return;
      setPlayheadAtClientX(e.clientX);
    });

    console.log('[kotoedit] playhead drag enabled');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
