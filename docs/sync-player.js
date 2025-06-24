// sync-player.js
document.addEventListener('DOMContentLoaded', () => {
  // ナレーション再生とクリップ切り替え処理
  // 
document.addEventListener('DOMContentLoaded', () => {
  const voiceoverAudio = document.getElementById('voiceover-audio'); // 修正点
  const previewVideo = document.getElementById('preview-video');
  // clips[] は必要に応じて統合の検討（現状はscript.jsと重複しやすい）

  document.getElementById('play-all').addEventListener('click', () => {
    voiceoverAudio.load(); // 安定のため明示的にロード
    voiceoverAudio.play(); // iOSでは必ずユーザー操作後に再生

    // videoの再生処理を script.js に一元化した方が整理しやすいかもしれません
  });
});




let currentClipIndex = 0;

// Set up audio
voiceoverAudio.addEventListener('timeupdate', () => {
    const currentTime = voiceoverAudio.currentTime;
    const clip = clips[currentClipIndex];

    if (currentTime >= clip.start && currentTime < clip.end) {
        if (previewVideo.src !== clip.src) {
            previewVideo.src = clip.src;
            previewVideo.currentTime = 0;
            previewVideo.play();
        }
    } else if (currentTime >= clip.end) {
        currentClipIndex++;
        if (currentClipIndex < clips.length) {
            previewVideo.src = clips[currentClipIndex].src;
            previewVideo.currentTime = 0;
            previewVideo.play();
        } else {
            previewVideo.pause();
        }
    }
});

document.getElementById('play-all').addEventListener('click', () => {
    currentClipIndex = 0;
    previewVideo.src = clips[0].src;
    previewVideo.currentTime = 0;
    previewVideo.play();
    voiceoverAudio.currentTime = 0;
    voiceoverAudio.load(); // iOSでの再生安定化に重要
    voiceoverAudio.play();
});

});
