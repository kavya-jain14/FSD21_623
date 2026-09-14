const ball = document.getElementById("ball");
const shadow = document.getElementById("shadow");
const toggleButton = document.getElementById("toggle-button");
const restartButton = document.getElementById("restart-button");
const speedControl = document.getElementById("speed-control");

let paused = false;

function setPaused(nextPaused) {
  paused = nextPaused;
  ball.classList.toggle("paused", paused);
  shadow.classList.toggle("paused", paused);
  toggleButton.textContent = paused ? "Resume" : "Pause";
}

toggleButton.addEventListener("click", () => {
  setPaused(!paused);
});

restartButton.addEventListener("click", () => {
  ball.style.animation = "none";
  shadow.style.animation = "none";
  void ball.offsetWidth;
  ball.style.animation = "";
  shadow.style.animation = "";
  setPaused(false);
});

speedControl.addEventListener("input", (event) => {
  const duration = 1.4 / Number(event.target.value);
  ball.style.setProperty("--duration", `${duration}s`);
  shadow.style.setProperty("--duration", `${duration}s`);
});
