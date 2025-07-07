document.addEventListener('DOMContentLoaded', () => {
  const previewVideo = document.getElementById('preview-video');
  const voiceoverAudio = document.getElementById('voiceover-audio');
  const playFromHeadBtn = document.getElementById('preview-from-playhead');
  const playhead = document.getElementById('playhead');

  let isPlaying = false;

  function playFromPlayhead() {
    const playheadLeft = parseFloat(playhead.style.left || '0');
    const pps = 20; // 必要に応じてズーム状態で変更

    const playheadTime = playheadLeft / pps;

    previewVideo.currentTime = playheadTime;
    voiceoverAudio.currentTime = playheadTime;

    previewVideo.play();
    voiceoverAudio.play();
    isPlaying = true;

    playFromHeadBtn.innerHTML = '❚❚ プレイヘッドから再生'; // 一時停止表示
  }

  function pauseMedia() {
    previewVideo.pause();
    voiceoverAudio.pause();
    isPlaying = false;
    playFromHeadBtn.innerHTML = '▶ プレイヘッドから再生';
  }

  if (playFromHeadBtn) {
    playFromHeadBtn.addEventListener('click', () => {
      if (!isPlaying) {
        playFromPlayhead();
      } else {
        pauseMedia();
      }
    });
  }
});
