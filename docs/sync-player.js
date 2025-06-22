// sync-player.js
document.addEventListener('DOMContentLoaded', () => {
  // ナレーション再生とクリップ切り替え処理
  // 
const voiceoverAudio = new Audio('audio/narration.mp3');
const previewVideo = document.getElementById('preview-video');

// Define video clips with their corresponding in/out times relative to narration
const clips = [
    { src: '../assets/clip1.mp4', start: 0, end: 5 },
    { src: '../assets/clip2.mp4', start: 5, end: 10 },
    { src: '../assets/clip3.mp4', start: 10, end: 15 }
];

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
