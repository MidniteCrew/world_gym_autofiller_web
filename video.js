const modal = document.getElementById("videoModal");
const video = document.getElementById("tutorialVideo");

document.getElementById("openVideo").onclick = () => {
  modal.style.display = "flex";
  video.currentTime = 0;
  video.play();
};

document.getElementById("closeVideo").onclick = closeVideo;

modal.onclick = e => {
  if (e.target === modal) closeVideo();
};

function closeVideo() {
  video.pause();
  modal.style.display = "none";
}