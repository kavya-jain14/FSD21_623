const { createApp } = require("./app");

const port = Number(process.env.PORT || 4005);
const server = createApp().listen(port, "127.0.0.1", (error) => {
  if (error) {
    console.error("Unable to start Campus Help Desk:", error.message);
    process.exitCode = 1;
    return;
  }
  console.log("Campus Help Desk: http://localhost:" + port);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close());
}
