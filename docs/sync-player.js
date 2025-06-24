document.addEventListener('DOMContentLoaded', () => {
  const voiceoverAudio = document.getElementById('voiceover-audio');
  const previewVideo = document.getElementById('preview-video');
  const playBtn = document.getElementById('play-timeline');
  const timeOverlay = document.getElementById('timecode-overlay');

  playBtn.addEventListener('click', () => {
    const clips = document.querySelectorAll('.timeline-clip');
    if (clips.length === 0) return;

    let currentIndex = 0;

    function playNextClip() {
      if (currentIndex >= clips.length) {
        voiceoverAudio.pause();
        return;
      }

      const clip = clips[currentIndex];
      const fileName = clip.querySelector('.clip-label').textContent.trim();
      const inTime = parseFloat(clip.dataset.in);
      const outTime = parseFloat(clip.dataset.out);

      previewVideo.src = `media/${fileName}`;
      previewVideo.onloadedmetadata = () => {
        previewVideo.currentTime = inTime;
        previewVideo.play();

        previewVideo.addEventListener('timeupdate', function checkPlayback() {
          timeOverlay.textContent = formatTimecode(previewVideo.currentTime);
          if (previewVideo.currentTime >= outTime) {
            previewVideo.pause();
            previewVideo.removeEventListener('timeupdate', checkPlayback);
            currentIndex++;
            playNextClip();
          }
        });
      };
    }

    // iOS向けに load を明示
    voiceoverAudio.currentTime = 0;
    voiceoverAudio.load();
    voiceoverAudio.play().then(() => {
      playNextClip();
    }).catch(err => {
      alert("音声の自動再生がブロックされました。再度ボタンを押してください。");
      console.warn(err);
    });
  });

  function formatTimecode(t) {
    const minutes = Math.floor(t / 60).toString().padStart(2, '0');
    const seconds = Math.floor(t % 60).toString().padStart(2, '0');
    const decimal = Math.floor((t % 1) * 10);
    return `${minutes}:${seconds}.${decimal}`;
  }
});
