const EventEmitter = require("events");

class Button extends EventEmitter {
  click() {
    console.log("Calling button click event");
    this.emit("click");
  }

  mouseover() {
    console.log("Calling button mouseover event");
    this.emit("mouseover");
  }
}

const button = new Button();

button.on("click", () => {
  console.log("Button clicked");
});

button.on("mouseover", () => {
  console.log("Mouse over button");
});

button.click();
button.mouseover();

