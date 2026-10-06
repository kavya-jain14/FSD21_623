const { createApp } = require("./app");

const port = Number(process.env.PORT || 4006);
const server = createApp().listen(port, "127.0.0.1", (error) => {
  if (error) {
    console.error("Unable to start Campus Notes:", error.message);
    process.exitCode = 1;
    return;
  }
  console.log("Campus Notes: http://localhost:" + port);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close());
}
