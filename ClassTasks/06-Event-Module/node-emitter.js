const EventEmitter = require("events");

class WorkshopEmitter extends EventEmitter {}

const emitter = new WorkshopEmitter();

emitter.on("greet", (name) => {
  console.log(`Hello, ${name}! Welcome.`);
});

emitter.on("exit", () => {
  console.log("Goodbye! Exiting the application.");
});

emitter.emit("greet", "Kavya Jain");
emitter.emit("exit");

