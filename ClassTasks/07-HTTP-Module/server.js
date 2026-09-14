const http = require("http");

const port = 3000;

const server = http.createServer((request, response) => {
  if (request.url === "/") {
    response.writeHead(200, {
      "Content-Type": "text/plain",
      "X-Powered-By": "Node.js"
    });
    response.end("Hello World. Status Code: 200\n");
    return;
  }

  response.writeHead(404, {
    "Content-Type": "text/plain",
    "X-Powered-By": "Node.js"
  });
  response.end("Page not found. Status Code: 404\n");
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

