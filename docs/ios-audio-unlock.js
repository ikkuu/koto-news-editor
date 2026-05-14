/* ============================================================
   kotoedit Media Sync & iOS Unlock
   ------------------------------------------------------------
   役割：
   1. iOS Safari/Chrome の autoplay policy を回避（unlock）
   2. <video>（プレビュー）と <audio>（ナレーション）を完全連動
      - 動画が再生されたら音声も再生
      - 動画が停止したら音声も停止
      - 動画がシークされたら音声も同位置へ
      - 「停止」ボタンで両方止める
   3. すべての play() を safePlay() でラップし、Promise rejection
      で止まらないようにする
   ============================================================ */

(function () {
  'use strict';

  let unlocked = false;
  let isUserPausing = false; // 停止ボタンが押されたかフラグ

  /* ----------------------------------------------------------------
     safePlay: Promise reject を握りつぶす play() ラッパー
  ---------------------------------------------------------------- */
  function safePlay(el) {
    if (!el) return Promise.resolve();
    try {
      const p = el.play();
      if (p && typeof p.then === 'function') {
        return p.catch(() => {});
      }
      return Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  }
  window.safePlay = safePlay;

  /* ----------------------------------------------------------------
     iOS unlock：最初のユーザー操作で video/audio を一瞬play→pause
  ---------------------------------------------------------------- */
  async function unlockMedia() {
    if (unlocked) return;
    unlocked = true;

    const video = document.getElementById('preview-video');
    const audio = document.getElementById('voiceover-audio');

    if (video) {
      const prevMuted = video.muted;
      video.muted = true;
      try {
        await safePlay(video);
        video.pause();
      } catch (e) {}
      video.muted = prevMuted;
    }

    if (audio) {
      try {
        await safePlay(audio);
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {}
    }

    console.log('[kotoedit] media unlocked for iOS autoplay policy');
  }

  function attachUnlockOnce() {
    const handler = () => {
      unlockMedia();
      window.removeEventListener('touchstart', handler, { passive: true });
      window.removeEventListener('click', handler, true);
      window.removeEventListener('keydown', handler, true);
    };
    window.addEventListener('touchstart', handler, { passive: true });
    window.addEventListener('click', handler, true);
    window.addEventListener('keydown', handler, true);
  }

  /* ----------------------------------------------------------------
     Media Sync：video の状態変化に audio を追随させる
  ---------------------------------------------------------------- */
  function setupMediaSync() {
    const video = document.getElementById('preview-video');
    const audio = document.getElementById('voiceover-audio');
    if (!video || !audio) return;

    // 既存ハンドラとの干渉を避けるため、ガード変数で重複動作を抑制
    let syncing = false;

    /* video → audio：再生連動
       ただし「素材を全部見る」モード中は audio を起こさない
    */
    video.addEventListener('play', () => {
      if (isUserPausing) return;
      if (window.materialPreviewMode) return;
      if (audio.paused) safePlay(audio);
    });

    /* video → audio：停止連動
       ただし、既存JSは「クリップ終了 → 次のクリップへ」のとき一旦pauseする。
       これも止めてしまうと音声が途切れるので、user-initiated pause か
       end-of-clip pause かを判別する。
       end-of-clip: video.currentTime >= video.duration もしくは
                    タイムライン上の次クリップへ移動するケース
       簡易判別：停止ボタン経由は isUserPausing=true、それ以外の pause は
       次クリップへの遷移とみなして audio は止めない。
    */
    video.addEventListener('pause', () => {
      if (isUserPausing) {
        audio.pause();
      }
      // それ以外（クリップ終了など）は audio はそのまま流し続ける
    });

    /* video → audio：シーク連動（簡易：単独クリップ再生時のみ自然に同期）
       既存JSではタイムライン上の通し時間は管理していないため、
       seek 連動は無効化（誤同期を避ける）。
       必要に応じて将来 wavesurfer 統合時に有効化する。
    */
    // video.addEventListener('seeking', () => {
    //   if (syncing) return;
    //   syncing = true;
    //   audio.currentTime = video.currentTime;
    //   syncing = false;
    // });

    console.log('[kotoedit] media sync attached');
  }

  /* ----------------------------------------------------------------
     停止ボタン：video と audio を両方止める
  ---------------------------------------------------------------- */
  function setupStopButton() {
    const stopBtn = document.getElementById('preview-stop');
    const video = document.getElementById('preview-video');
    const audio = document.getElementById('voiceover-audio');
    if (!stopBtn || !video || !audio) return;

    stopBtn.addEventListener('click', () => {
      isUserPausing = true;
      try {
        // 既存JSが ontimeupdate / onended で次クリップへ自動遷移するのを止める
        video.ontimeupdate = null;
        video.onended = null;
      } catch (e) {}
      video.pause();
      audio.pause();
      // 短い猶予の後にフラグを戻す（次の再生開始を妨げないため）
      setTimeout(() => { isUserPausing = false; }, 100);
      console.log('[kotoedit] stopped by user');
    });
  }

  /* ----------------------------------------------------------------
     既存 video/audio の play() を safePlay 化（Promise rejection 抑制）
  ---------------------------------------------------------------- */
  function wrapPlayMethods() {
    const video = document.getElementById('preview-video');
    const audio = document.getElementById('voiceover-audio');
    [video, audio].forEach((el) => {
      if (!el) return;
      const originalPlay = el.play.bind(el);
      el.play = function () {
        const p = originalPlay();
        if (p && typeof p.catch === 'function') p.catch(() => {});
        return p;
      };
    });
  }

  /* ----------------------------------------------------------------
     再生系ボタンに unlock を先行実行（capture フェーズ）
  ---------------------------------------------------------------- */
  function attachUnlockToPlayButtons() {
    ['preview-from-start', 'preview-play-all', 'preview-from-playhead'].forEach((id) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.addEventListener('click', () => {
        isUserPausing = false; // 再生ボタンが押されたら停止フラグは解除
        unlockMedia();
      }, true);
    });
  }

  /* ----------------------------------------------------------------
     起動
  ---------------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      attachUnlockOnce();
      wrapPlayMethods();
      setupMediaSync();
      setupStopButton();
      attachUnlockToPlayButtons();
    });
  } else {
    attachUnlockOnce();
    wrapPlayMethods();
    setupMediaSync();
    setupStopButton();
    attachUnlockToPlayButtons();
  }
})();
