const button = document.getElementById("event-button");

button.addEventListener("click", () => {
  button.textContent = "Button clicked";
});

button.addEventListener("mouseenter", () => {
  button.style.background = "#315c2b";
});

button.addEventListener("mouseleave", () => {
  button.style.background = "#171717";
});

