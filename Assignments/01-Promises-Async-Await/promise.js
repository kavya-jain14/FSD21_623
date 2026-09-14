const { findUser, verifyUser } = require("./user-service");

console.log("Checking user with Promises...");

findUser(1)
  .then((user) => verifyUser(user))
  .then((result) => {
    console.log(`Username: ${result.username}`);
    console.log(`Password: ${result.password}`);
    console.log(result.message);
  })
  .catch((error) => {
    console.error(error.message);
  })
  .finally(() => {
    console.log("Promise workflow completed");
  });

