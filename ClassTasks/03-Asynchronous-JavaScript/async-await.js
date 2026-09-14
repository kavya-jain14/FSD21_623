function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function getMessage() {
  await delay(500);
  return "Hello from async and await";
}

async function main() {
  const message = await getMessage();
  console.log(message);
}

console.log("This is asynchronous programming");
main();

