const { createApp } = require("./app");

const port = Number(process.env.PORT) || 4000;

createApp().listen(port, () => {
  console.log(`Express API running at http://localhost:${port}`);
});

